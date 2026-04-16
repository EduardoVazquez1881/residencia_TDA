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
