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

// ─── Obtener alumnos del usuario ──────────────────────────────────────────────
export async function getAlumnos(uid: string): Promise<AlumnoData[]> {
  const { data, error } = await supabase
    .from("alumnos")
    .select("*")
    .eq("creado_por", uid)
    .eq("activo", true)
    .order("creado_en", { ascending: false });

  if (error || !data) return [];
  return data as AlumnoData[];
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
