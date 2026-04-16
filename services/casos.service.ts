import { supabase } from "@/supabaseconfig";

export interface ParticipantePayload {
  correo: string;
  rol_en_caso: string;
}

export interface CasoPayload {
  alumno_id: number;
  usuario_id: string; // Quien lo crea
  plantilla_id?: number | null;
  estado?: string;
  notas_asignacion?: string;
  participantes: ParticipantePayload[];
}

export interface CrearCasoResult {
  caso_id: number | null;
  error: string | null;
  correosNoEncontrados?: string[];
}

// ─── Resolver correos a UUIDs ──────────────────────────────────────────────────
export async function getUsuarioPorCorreo(correo: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("usuario_id")
    .eq("correo", correo.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return data.usuario_id;
}

// ─── Crear caso y asignar participantes ────────────────────────────────────────
export async function crearCasoCompleto(payload: CasoPayload): Promise<CrearCasoResult> {
  const correosNoEncontrados: string[] = [];
  const participantesAInsertar: { usuario_id: string; rol_en_caso: string }[] = [];

  // 1. Resolver todos los correos a UUIDs antes de crear el caso
  for (const part of payload.participantes) {
    if (!part.correo.trim()) continue;
    
    const uid = await getUsuarioPorCorreo(part.correo);
    if (!uid) {
      correosNoEncontrados.push(part.correo);
    } else {
      participantesAInsertar.push({
        usuario_id: uid,
        rol_en_caso: part.rol_en_caso,
      });
    }
  }

  if (correosNoEncontrados.length > 0) {
    return {
      caso_id: null,
      error: "No se encontraron algunos correos electrónicos.",
      correosNoEncontrados,
    };
  }

  // 2. Revisar si ya existe el caso para evitar el error de llave única
  let casoId: number | null = null;
  const { data: existente } = await supabase
    .from("casos")
    .select("caso_id")
    .eq("alumno_id", payload.alumno_id)
    .eq("usuario_id", payload.usuario_id)
    .maybeSingle();

  if (existente) {
    casoId = existente.caso_id;
    // Opcional: Actualizar la plantilla u otros campos si se mandaron
    const updatePayload: any = {};
    if (payload.plantilla_id) updatePayload.plantilla_id = payload.plantilla_id;
    if (payload.notas_asignacion) updatePayload.notas_asignacion = payload.notas_asignacion;
    
    if (Object.keys(updatePayload).length > 0) {
      await supabase.from("casos").update(updatePayload).eq("caso_id", casoId);
    }
  } else {
    // 3. Crear el caso nuevo
    const { data: casoData, error: casoErr } = await supabase
      .from("casos")
      .insert({
        alumno_id: payload.alumno_id,
        usuario_id: payload.usuario_id,
        creado_por: payload.usuario_id,
        plantilla_id: payload.plantilla_id || null,
        estado: payload.estado || "activo",
        notas_asignacion: payload.notas_asignacion || null,
      })
      .select("caso_id")
      .single();

    if (casoErr || !casoData) {
      return {
        caso_id: null,
        error: casoErr?.message || "Error al crear el caso.",
      };
    }
    casoId = casoData.caso_id;
  }

  // 4. Agregar los participantes
  if (participantesAInsertar.length > 0) {
    const { error: partErr } = await supabase
      .from("caso_participantes")
      .insert(
        participantesAInsertar.map((p) => ({
          caso_id: casoId,
          usuario_id: p.usuario_id,
          rol_en_caso: p.rol_en_caso,
          agregado_por: payload.usuario_id,
        }))
      );

    if (partErr) {
      // Nota: Si esto falla, idealmente habría que revertir el caso (rollback),
      // pero en este contexto sin transacciones desde el frontend, solo retornamos el error.
      return {
        caso_id: casoId,
        error: `El caso se creó pero hubo error al asignar usuarios: ${partErr.message}`,
      };
    }
  }

  return {
    caso_id: casoId,
    error: null,
  };
}

// ─── Fetching Cases ────────────────────────────────────────────────────────────

export interface ListaCasoData {
  caso_id: number;
  alumno_id: number;
  usuario_id: string; // dueño del caso
  creado_por: string;
  plantilla_id: number | null;
  estado: string;
  fecha_asignacion: string;
  alumnos?: {
    pseudonimo: string;
    nivel_tea: number;
  };
  plantillas?: {
    nombre: string;
  };
}

export async function getMisCasos(uid: string): Promise<ListaCasoData[]> {
  // 1. Conseguir IDs donde el usuario es participante
  const { data: participaciones } = await supabase
    .from("caso_participantes")
    .select("caso_id")
    .eq("usuario_id", uid);

  const casoIds = participaciones?.map((p) => p.caso_id) || [];

  // 2. Solicitar los casos donde es dueño, creador, o participante
  let query = supabase
    .from("casos")
    .select(`
      caso_id, alumno_id, usuario_id, creado_por, plantilla_id, estado, fecha_asignacion,
      alumnos (pseudonimo, nivel_tea),
      plantillas (nombre)
    `)
    .eq("estado", "activo")
    .order("fecha_asignacion", { ascending: false });

  if (casoIds.length > 0) {
    query = query.or(`usuario_id.eq.${uid},creado_por.eq.${uid},caso_id.in.(${casoIds.join(",")})`);
  } else {
    query = query.or(`usuario_id.eq.${uid},creado_por.eq.${uid}`);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Error fetching casos:", error);
    return [];
  }
  return data as any as ListaCasoData[];
}
