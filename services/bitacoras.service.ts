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

  // 3. Notificar en segundo plano a los terapeutas del caso
  (async () => {
    try {
      const { notificarTerapeutasNuevaBitacora } = await import("@/services/notificaciones.service");
      await notificarTerapeutasNuevaBitacora(
        payload.caso_id,
        bitacoraId,
        payload.creado_por
      );
    } catch (err) {
      console.error("Error al enviar notificaciones de bitacora:", err);
    }
  })();

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
  revisado_por?: string | null;
  fecha_revision?: string | null;
  notas_revision?: string | null;
  casos: {
    caso_id: number;
    usuario_id: string;
    creado_por: string;
    alumnos: {
      pseudonimo: string;
    };
  } | null;
  plantillas: {
    nombre: string;
  };
}

export async function getHistorialBitacoras(uid: string): Promise<HistorialBitacoraData[]> {
  // 1. Obtener los caso_ids donde el usuario participa
  const { data: participaciones } = await supabase
    .from("caso_participantes")
    .select("caso_id")
    .eq("usuario_id", uid);
  
  const casoIds = participaciones?.map((p) => p.caso_id) || [];

  // 2. Construir la consulta de bitácoras
  let query = supabase
    .from("bitacoras")
    .select(`
      bitacora_id, caso_id, plantilla_id, fecha, hora_entrada, hora_salida, estado, creado_por,
      revisado_por, fecha_revision, notas_revision,
      casos ( caso_id, usuario_id, creado_por, alumnos ( pseudonimo ) ),
      plantillas ( nombre )
    `);

  if (casoIds.length > 0) {
    query = query.or(`creado_por.eq.${uid},sombra_id.eq.${uid},caso_id.in.(${casoIds.join(",")})`);
  } else {
    query = query.or(`creado_por.eq.${uid},sombra_id.eq.${uid}`);
  }

  const { data, error } = await query
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
    .select(`
      *,
      revisado_por_user:usuarios!bitacoras_revisado_por_fkey (
        nombres,
        apellidos
      )
    `)
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
  // 1. Actualizar campos base (se establece en "borrador" para requerir revisión del terapeuta)
  const { error: bitError } = await supabase
    .from("bitacoras")
    .update({
      fecha: payload.fecha,
      hora_entrada: payload.hora_entrada,
      hora_salida: payload.hora_salida,
      contexto: payload.contexto,
      estado: "borrador"
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

  // 3. Notificar en segundo plano a los terapeutas del caso para su revisión
  const casoIdVal = payload.caso_id;
  const creadoPorVal = payload.creado_por;
  if (casoIdVal && creadoPorVal) {
    (async () => {
      try {
        const { notificarTerapeutasNuevaBitacora } = await import("@/services/notificaciones.service");
        await notificarTerapeutasNuevaBitacora(
          casoIdVal,
          bitacoraId,
          creadoPorVal
        );
      } catch (err) {
        console.error("Error al enviar notificaciones de bitacora al actualizar:", err);
      }
    })();
  }

  return { error: null };
}

export interface RevisarBitacoraPayload {
  revisado_por: string;
  notas_revision: string;
  estado: string;
}

export async function revisarBitacora(
  bitacoraId: number,
  payload: RevisarBitacoraPayload
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from("bitacoras")
    .update({
      revisado_por: payload.revisado_por,
      fecha_revision: new Date().toISOString(),
      notas_revision: payload.notas_revision,
      estado: payload.estado,
      actualizado_en: new Date().toISOString()
    })
    .eq("bitacora_id", bitacoraId)
    .select();

  if (error) {
    console.error("Error al revisar bitácora:", error);
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: "No se pudo actualizar la bitácora. Esto suele deberse a que no tienes los permisos RLS necesarios en la tabla 'bitacoras' para modificar este caso."
    };
  }

  return { error: null };
}

// ─── Historial y Evolución por Alumno ──────────────────────────────────────────
export interface BitacoraAlumnoData {
  bitacora_id: number;
  fecha: string;
  estado: string;
  plantilla_id: number | null;
  hora_entrada?: string;
  hora_salida?: string;
  plantillas?: { nombre: string };
  casos: { caso_id: number; alumno_id: number; usuario_id: string; creado_por: string };
  bitacora_respuestas?: {
    valor: string;
    plantilla_campos?: {
      campo_id: number;
      etiqueta: string;
      tipo: string;
    };
  }[];
}

export async function getBitacorasPorAlumno(alumnoId: number): Promise<BitacoraAlumnoData[]> {
  // 1. Fetch casos for the alumno
  const { data: casosData, error: casosError } = await supabase
    .from('casos')
    .select('caso_id, alumno_id, usuario_id, creado_por')
    .eq('alumno_id', alumnoId);

  if (casosError || !casosData || casosData.length === 0) {
    return [];
  }

  const casoIds = casosData.map(c => c.caso_id);
  const casosMap = new Map(casosData.map(c => [c.caso_id, c]));

  // 2. Fetch bitacoras for those casos
  const { data: bitacorasData, error: bitacorasError } = await supabase
    .from('bitacoras')
    .select(`
      bitacora_id, fecha, estado, plantilla_id, hora_entrada, hora_salida, caso_id,
      plantillas ( nombre ),
      bitacora_respuestas (
        valor,
        plantilla_campos ( campo_id, etiqueta, tipo )
      )
    `)
    .in('caso_id', casoIds)
    .order('fecha', { ascending: false });

  if (bitacorasError || !bitacorasData) {
    console.error("Error al obtener bitácoras del alumno:", bitacorasError);
    return [];
  }

  // 3. Map the casos back into the bitacoras results to match the interface
  const result = bitacorasData.map((b: any) => ({
    ...b,
    casos: casosMap.get(b.caso_id)
  }));

  return result as any as BitacoraAlumnoData[];
}
