import { supabase } from "@/supabaseconfig";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface UsuarioData {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  rol_id: number;
}

// ─── Verificar si el usuario tiene perfil en la tabla usuarios ────────────────
/**
 * Retorna true si el usuario ya completó su perfil (existe fila en 'usuarios').
 */
export async function tienePerfilCompleto(uid: string): Promise<boolean> {
  const { data } = await supabase
    .from("usuarios")
    .select("usuario_id")
    .eq("usuario_id", uid)
    .maybeSingle();

  return !!data;
}

// ─── Crear o actualizar perfil de usuario ─────────────────────────────────────
export interface UpsertUsuarioResult {
  error: string | null;
}

export async function upsertUsuario(
  payload: UsuarioData,
): Promise<UpsertUsuarioResult> {
  const { error } = await supabase.from("usuarios").upsert(payload);
  return { error: error?.message ?? null };
}

// ─── Obtener perfil de usuario por UID ───────────────────────────────────────
export async function getUsuario(uid: string): Promise<UsuarioData | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("usuario_id", uid)
    .single();

  if (error || !data) return null;
  return data as UsuarioData;
}
