import { supabase } from "@/supabaseconfig";

// ─── Tipos del wizard ─────────────────────────────────────────────────────────
export interface WizardOpcion {
  localId: string;
  etiqueta: string;
  valor: string;
  orden: number;
}

export interface WizardCampo {
  localId: string;
  clave: string;
  etiqueta: string;
  tipo: string;
  requerido: boolean;
  placeholder: string;
  ayuda: string;
  orden: number;
  opciones: WizardOpcion[];
}

export interface WizardSeccion {
  localId: string;
  nombre: string;
  descripcion: string;
  orden: number;
  campos: WizardCampo[];
}

export interface WizardPlantillaPayload {
  terapeuta_id: string;
  alumno_id: number | null;
  nombre: string;
  descripcion: string;
  es_global: boolean;
  secciones: WizardSeccion[];
}

export interface CrearPlantillaResult {
  plantilla_id: number | null;
  error: string | null;
}

export interface PlantillaData {
  plantilla_id: number;
  terapeuta_id: string;
  alumno_id: number | null;
  nombre: string;
  descripcion: string | null;
  es_global: boolean;
  activa: boolean;
  creado_en: string;
}

// ─── Helper: slug desde texto libre ──────────────────────────────────────────
export function generarClave(etiqueta: string): string {
  return etiqueta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

// ─── Crear plantilla completa en cascada ─────────────────────────────────────
export async function crearPlantillaCompleta(
  payload: WizardPlantillaPayload,
): Promise<CrearPlantillaResult> {
  // 1 — plantilla principal
  const { data: plantillaData, error: plantillaErr } = await supabase
    .from("plantillas")
    .insert({
      terapeuta_id: payload.terapeuta_id,
      alumno_id: payload.alumno_id,
      nombre: payload.nombre,
      descripcion: payload.descripcion || null,
      es_global: payload.es_global,
    })
    .select("plantilla_id")
    .single();

  if (plantillaErr || !plantillaData) {
    return {
      plantilla_id: null,
      error: plantillaErr?.message ?? "Error al crear la plantilla",
    };
  }

  const plantillaId = plantillaData.plantilla_id;

  // 2 — secciones (en orden)
  for (const seccion of payload.secciones) {
    const { data: seccionData, error: seccionErr } = await supabase
      .from("plantilla_secciones")
      .insert({
        plantilla_id: plantillaId,
        nombre: seccion.nombre,
        descripcion: seccion.descripcion || null,
        orden: seccion.orden,
      })
      .select("seccion_id")
      .single();

    if (seccionErr || !seccionData) {
      return {
        plantilla_id: null,
        error: seccionErr?.message ?? "Error al crear la sección",
      };
    }

    const seccionId = seccionData.seccion_id;

    // 3 — campos de esa sección
    for (const campo of seccion.campos) {
      const { data: campoData, error: campoErr } = await supabase
        .from("plantilla_campos")
        .insert({
          seccion_id: seccionId,
          clave: campo.clave,
          etiqueta: campo.etiqueta,
          tipo: campo.tipo,
          requerido: campo.requerido,
          placeholder: campo.placeholder || null,
          ayuda: campo.ayuda || null,
          orden: campo.orden,
        })
        .select("campo_id")
        .single();

      if (campoErr || !campoData) {
        return {
          plantilla_id: null,
          error: campoErr?.message ?? "Error al crear el campo",
        };
      }

      const campoId = campoData.campo_id;

      // 4 — opciones para radio / select
      if (
        (campo.tipo === "radio" || campo.tipo === "select") &&
        campo.opciones.length > 0
      ) {
        const { error: opErr } = await supabase.from("campo_opciones").insert(
          campo.opciones.map((op) => ({
            campo_id: campoId,
            etiqueta: op.etiqueta,
            valor: op.valor,
            orden: op.orden,
          })),
        );

        if (opErr) {
          return { plantilla_id: null, error: opErr.message };
        }
      }
    }
  }

  return { plantilla_id: plantillaId, error: null };
}

// ─── Obtener plantillas del terapeuta (propias + globales) ───────────────────
export async function getPlantillas(uid: string): Promise<PlantillaData[]> {
  const { data, error } = await supabase
    .from("plantillas")
    .select("*")
    .or(`terapeuta_id.eq.${uid},es_global.eq.true`)
    .eq("activa", true)
    .order("creado_en", { ascending: false });

  if (error || !data) return [];
  return data as PlantillaData[];
}
