import { supabase } from "@/supabaseconfig";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ConfiguracionOrganizacion {
  nombre_organizacion: string;
  logotipo_url?: string;
  direccion?: string;
  telefono?: string;
  correo_contacto?: string;
}

export const CONFIG_ORG_DEFAULT: ConfiguracionOrganizacion = {
  nombre_organizacion: "",
  logotipo_url: "",
  direccion: "",
  telefono: "",
  correo_contacto: "",
};

// ─── Obtener configuración del usuario ────────────────────────────────────────
export async function getConfiguracionOrganizacion(
  usuarioId: string
): Promise<ConfiguracionOrganizacion> {
  const { data } = await supabase
    .from("configuracion_organizacion")
    .select("nombre_organizacion, logotipo_url, direccion, telefono, correo_contacto")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (!data) return { ...CONFIG_ORG_DEFAULT };

  return {
    nombre_organizacion: data.nombre_organizacion || "",
    logotipo_url: data.logotipo_url || "",
    direccion: data.direccion || "",
    telefono: data.telefono || "",
    correo_contacto: data.correo_contacto || "",
  };
}

// ─── Guardar / actualizar configuración ───────────────────────────────────────
export async function guardarConfiguracionOrganizacion(
  usuarioId: string,
  config: ConfiguracionOrganizacion
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("configuracion_organizacion")
    .upsert(
      {
        usuario_id: usuarioId,
        nombre_organizacion: config.nombre_organizacion.trim(),
        logotipo_url: config.logotipo_url?.trim() || null,
        direccion: config.direccion?.trim() || null,
        telefono: config.telefono?.trim() || null,
        correo_contacto: config.correo_contacto?.trim() || null,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "usuario_id" }
    );

  return { error: error?.message ?? null };
}
