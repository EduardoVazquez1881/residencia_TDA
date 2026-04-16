import { supabase } from "@/supabaseconfig";

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface BitacoraPayload {
  caso_id: number;
  plantilla_id: number;
  // Opcional, puede ser quien llenó
  sombra_id?: string;
  fecha: string; // YYYY-MM-DD
  hora_entrada?: string; // HH:MM:SS u HH:MM
  hora_salida?: string;
  contexto?: string;
  creado_por: string;
}

export interface CrearBitacoraResult {
  bitacora_id: number | null;
  error: string | null;
}

// ─── Lógica Transaccional ──────────────────────────────────────────────────────
export async function crearBitacoraCompleta(
  payload: BitacoraPayload,
  respuestas: Record<number, string>
): Promise<CrearBitacoraResult> {
  // 1. Insertamos en bitacoras
  const { data: bitacoraData, error: bitError } = await supabase
    .from("bitacoras")
    .insert({
      caso_id: payload.caso_id,
      plantilla_id: payload.plantilla_id,
      sombra_id: payload.sombra_id || null,
      fecha: payload.fecha,
      hora_entrada: payload.hora_entrada || null,
      hora_salida: payload.hora_salida || null,
      contexto: payload.contexto || null,
      creado_por: payload.creado_por,
      estado: "borrador", // Comienza como borrador por defecto en el diseño inicial
    })
    .select("bitacora_id")
    .single();

  if (bitError || !bitacoraData) {
    console.error("Error creando bitacora base:", bitError);
    return { bitacora_id: null, error: bitError?.message || "Error al crear bitácora" };
  }

  const bitacoraId = bitacoraData.bitacora_id;

  // 2. Armamos el arreglo de respuestas (saltar vacías o undefined)
  const respuestasArray = Object.entries(respuestas).map(([campoIdStr, valor]) => ({
    bitacora_id: bitacoraId,
    campo_id: parseInt(campoIdStr, 10),
    valor: valor || "", // si es vacío se pasa string vacío para que no rompa NOT NULL
  }));

  // insertamos masivo en las respuestas
  if (respuestasArray.length > 0) {
    const { error: respError } = await supabase
      .from("bitacora_respuestas")
      .insert(respuestasArray);

    if (respError) {
      console.error("Error creando respuestas de bitácora:", respError);
      return { bitacora_id: null, error: respError.message };
    }
  }

  return { bitacora_id: bitacoraId, error: null };
}

// ─── Obtener lista de casos elegibles ──────────────────────────────────────────
export async function getCasosListosParaBitacora(uid: string) {
  // Solo los activos, donde el usuario participe y ¡que asocian una plantilla!
  const { data, error } = await supabase
    .from("caso_participantes")
    .select(`
      caso_id,
      casos!caso_participantes_caso_id_fkey (
        caso_id,
        estado,
        plantilla_id,
        alumnos ( pseudonimo )
      )
    `)
    .eq("usuario_id", uid);

  if (error || !data) return [];

  // Filtramos por lado de React para mayor flexibilidad
  const listos = data
    .map(d => d.casos)
    // TypeScript safe-check (el cast es porque a veces join devuelve Array o Single, supabase TS plugin a veces marca null)
    .flat()
    .filter((c: any) => c && c.estado === "activo" && c.plantilla_id !== null);

  // quitamos duplicados por si acaso el usuario figure doble de algun modo raro
  const uniqueCasos = Array.from(new Map(listos.map((c: any) => [c.caso_id, c])).values());

  return uniqueCasos;
}

// ─── Historial de Bitácoras ─────────────────────────────────────────────────────
export interface HistorialBitacoraData {
  bitacora_id: number;
  caso_id: number;
  plantilla_id: number;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  estado: string;
  creado_por: string;
  casos: {
    alumnos: {
      pseudonimo: string;
    };
  };
  plantillas: {
    nombre: string;
  };
}

export async function getHistorialBitacoras(uid: string): Promise<HistorialBitacoraData[]> {
  const { data, error } = await supabase
    .from("bitacoras")
    .select(`
      bitacora_id, caso_id, plantilla_id, fecha, hora_entrada, hora_salida, estado, creado_por,
      casos ( alumnos ( pseudonimo ) ),
      plantillas ( nombre )
    `)
    .or(`creado_por.eq.${uid},sombra_id.eq.${uid}`)
    .order("fecha", { ascending: false })
    .order("bitacora_id", { ascending: false });

  if (error || !data) {
    console.error("Error fetching historial:", error);
    return [];
  }
  return data as any as HistorialBitacoraData[];
}

// ─── Obtener una sola para edición ──────────────────────────────────────────────
export async function getBitacoraConRespuestas(bitacoraId: number) {
  const { data: bitacora, error: bitError } = await supabase
    .from("bitacoras")
    .select("*")
    .eq("bitacora_id", bitacoraId)
    .single();

  if (bitError || !bitacora) return null;

  const { data: respuestas, error: respError } = await supabase
    .from("bitacora_respuestas")
    .select("campo_id, valor")
    .eq("bitacora_id", bitacoraId);

  return {
    ...bitacora,
    respuestas: respuestas || []
  };
}

// ─── Actualizar Bitácora ────────────────────────────────────────────────────────
export async function actualizarBitacoraCompleta(
  bitacoraId: number,
  payload: Partial<BitacoraPayload>,
  respuestas: Record<number, string>
): Promise<{ error: string | null }> {
  // 1. Actualizar campos base
  const { error: bitError } = await supabase
    .from("bitacoras")
    .update({
      fecha: payload.fecha,
      hora_entrada: payload.hora_entrada,
      hora_salida: payload.hora_salida,
      contexto: payload.contexto,
      estado: "completado" // Al editar se asume que se quiere finalizar o mantener activo
    })
    .eq("bitacora_id", bitacoraId);

  if (bitError) return { error: bitError.message };

  // 2. Actualizar respuestas: Método sencillo: Borrar las actuales e insertar las nuevas
  // (Esto evita conflictos de IDs y asegura que solo queden las enviadas)
  const { error: delError } = await supabase
    .from("bitacora_respuestas")
    .delete()
    .eq("bitacora_id", bitacoraId);

  if (delError) return { error: delError.message };

  const respuestasArray = Object.entries(respuestas).map(([campoIdStr, valor]) => ({
    bitacora_id: bitacoraId,
    campo_id: parseInt(campoIdStr, 10),
    valor: valor || "",
  }));

  if (respuestasArray.length > 0) {
    const { error: insError } = await supabase
      .from("bitacora_respuestas")
      .insert(respuestasArray);

    if (insError) return { error: insError.message };
  }

  return { error: null };
}
