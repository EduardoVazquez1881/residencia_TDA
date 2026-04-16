import { supabase } from "@/supabaseconfig";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface AlumnoPayload {
  pseudonimo: string;
  fecha_nacimiento?: string | null; // ISO: YYYY-MM-DD
  nivel_tea?: number | null;
  grado_escolar?: string | null;
  grupo_escolar?: string | null;
  escuela_actual?: string | null;
  horario_habitual?: string | null;
  adecuacion_curricular?: string | null;
  notas_generales?: string | null;
  creado_por: string;
}

export interface AlumnoData extends AlumnoPayload {
  alumno_id: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface CrearAlumnoResult {
  alumno_id: number | null;
  error: string | null;
}

// ─── Verificar duplicado por usuario ─────────────────────────────────────────
/**
 * Retorna true si el usuario ya tiene un alumno registrado con ese pseudónimo.
 */
export async function pseudonimoExisteParaUsuario(
  pseudonimo: string,
  uid: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("alumnos")
    .select("alumno_id")
    .eq("pseudonimo", pseudonimo)
    .eq("creado_por", uid)
    .maybeSingle();

  return !!data;
}

// ─── Crear alumno ─────────────────────────────────────────────────────────────
export async function crearAlumno(
  payload: AlumnoPayload,
): Promise<CrearAlumnoResult> {
  const { data, error } = await supabase
    .from("alumnos")
    .insert(payload)
    .select("alumno_id")
    .single();

  if (error) {
    return { alumno_id: null, error: error.message };
  }

  return { alumno_id: data.alumno_id, error: null };
}

// ─── Obtener alumnos vinculados al usuario ──────────────────────────────────────
export async function getAlumnos(uid: string): Promise<AlumnoData[]> {
  // 1. Obtener casos en los que está como participante
  const { data: participaciones } = await supabase
    .from("caso_participantes")
    .select("caso_id")
    .eq("usuario_id", uid);

  const casoIds = participaciones?.map((p) => p.caso_id) || [];

  // 2. Obtener alumno_ids de casos donde es creador principal, terapeuta o participante
  let queryCasos = supabase.from("casos").select("alumno_id");
  if (casoIds.length > 0) {
    queryCasos = queryCasos.or(`usuario_id.eq.${uid},creado_por.eq.${uid},caso_id.in.(${casoIds.join(",")})`);
  } else {
    queryCasos = queryCasos.or(`usuario_id.eq.${uid},creado_por.eq.${uid}`);
  }
  const { data: casos } = await queryCasos;
  const assignedAlumnoIds = casos?.map(c => c.alumno_id) || [];

  // 3. Obtener los alumnos (creados por uid o extraídos de sus casos)
  let queryAlumnos = supabase
    .from("alumnos")
    .select("*")
    .eq("activo", true)
    .order("creado_en", { ascending: false });

  if (assignedAlumnoIds.length > 0) {
    queryAlumnos = queryAlumnos.or(`creado_por.eq.${uid},alumno_id.in.(${assignedAlumnoIds.join(",")})`);
  } else {
    queryAlumnos = queryAlumnos.eq("creado_por", uid);
  }

  const { data, error } = await queryAlumnos;

  if (error || !data) return [];
  
  // Filtrar posibles duplicados por si Supabase/Postgrest retorna varios (aunque in() de llaves únicas no suele duplicar)
  const uniqueData = Array.from(new Map(data.map(item => [item.alumno_id, item])).values());
  
  return uniqueData as AlumnoData[];
}

// ─── Obtener un alumno por ID ─────────────────────────────────────────────────
export async function getAlumno(id: number): Promise<AlumnoData | null> {
  const { data, error } = await supabase
    .from("alumnos")
    .select("*")
    .eq("alumno_id", id)
    .single();

  if (error || !data) return null;
  return data as AlumnoData;
}

// ─── Actualizar alumno ────────────────────────────────────────────────────────
export async function actualizarAlumno(
  id: number,
  payload: Partial<AlumnoPayload>,
  uid: string // Se pasa el UID para corroborar seguridad a nivel aplicación (por si acaso)
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("alumnos")
    .update(payload)
    .eq("alumno_id", id)
    .eq("creado_por", uid); // Verificación fuerte

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
