import { supabase } from "@/supabaseconfig";
import { ConfiguracionOrganizacion } from "@/services/pdf.config.service";

// ─── Tipos de datos del PDF ───────────────────────────────────────────────────
export interface CampoConRespuesta {
  campo_id: number;
  etiqueta: string;
  tipo: string;
  valor: string; // Ya procesado: etiqueta legible para radio/select
}

export interface SeccionConRespuestas {
  seccion_id: number;
  nombre: string;
  descripcion: string | null;
  campos: CampoConRespuesta[];
}

export interface BitacoraPDFData {
  bitacora_id: number;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  contexto: string | null;
  notas_revision: string | null;
  fecha_revision: string | null;
  estado: string;
  // Alumno
  pseudonimo: string;
  nivel_tea: number | null;
  grado_escolar: string | null;
  escuela_actual: string | null;
  // Participantes
  nombreSombra: string;
  nombreTerapeuta: string;
  // Plantilla
  nombrePlantilla: string;
  // Secciones dinámicas con respuestas
  secciones: SeccionConRespuestas[];
}

// ─── Obtener todos los datos necesarios para el PDF ───────────────────────────
export async function getBitacoraPDFData(
  bitacoraId: number
): Promise<BitacoraPDFData | null> {
  try {
    // 1. Bitácora con relaciones anidadas
    //    NOTA: creado_por NO tiene FK constraint hacia usuarios, por eso se
    //    obtiene el usuario sombra en una query separada (paso 2b).
    //    revisado_por SÍ tiene FK (bitacoras_revisado_por_fkey).
    const { data: bitacora, error: bitErr } = await supabase
      .from("bitacoras")
      .select(`
        bitacora_id, fecha, hora_entrada, hora_salida, contexto,
        notas_revision, fecha_revision, estado, caso_id, plantilla_id,
        creado_por, revisado_por,
        terapeuta_revisor:usuarios!bitacoras_revisado_por_fkey (nombres, apellidos),
        casos (
          alumnos (pseudonimo, nivel_tea, grado_escolar, escuela_actual)
        ),
        plantillas (nombre)
      `)
      .eq("bitacora_id", bitacoraId)
      .single();

    if (bitErr || !bitacora) {
      console.error("[getBitacoraPDFData] Error al obtener bitácora:", bitErr);
      return null;
    }

    // 2. Respuestas de la bitácora
    const { data: respuestas } = await supabase
      .from("bitacora_respuestas")
      .select("campo_id, valor")
      .eq("bitacora_id", bitacoraId);

    const respuestasMap: Record<number, string> = {};
    (respuestas || []).forEach((r: any) => {
      respuestasMap[r.campo_id] = r.valor;
    });

    // 2b. Obtener nombre del sombra (creado_por) en query separada
    let nombreSombra = "—";
    if (bitacora.creado_por) {
      const { data: sombraData } = await supabase
        .from("usuarios")
        .select("nombres, apellidos")
        .eq("usuario_id", bitacora.creado_por)
        .maybeSingle();
      if (sombraData) {
        nombreSombra = `${sombraData.nombres} ${sombraData.apellidos}`;
      }
    }

    // 3. Estructura completa de la plantilla con opciones
    const { data: seccionesData } = await supabase
      .from("plantilla_secciones")
      .select(`
        seccion_id, nombre, descripcion, orden,
        plantilla_campos (
          campo_id, etiqueta, tipo, orden,
          campo_opciones (etiqueta, valor, orden)
        )
      `)
      .eq("plantilla_id", bitacora.plantilla_id)
      .order("orden", { ascending: true });

    // 4. Ensamblar secciones + respuestas
    const secciones: SeccionConRespuestas[] = (seccionesData || [])
      .sort((a: any, b: any) => a.orden - b.orden)
      .map((sec: any) => ({
        seccion_id: sec.seccion_id,
        nombre: sec.nombre,
        descripcion: sec.descripcion,
        campos: (sec.plantilla_campos || [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((campo: any) => {
            const opciones = (campo.campo_opciones || []).sort(
              (a: any, b: any) => a.orden - b.orden
            );
            const valorRaw = respuestasMap[campo.campo_id] ?? "";
            let valorDisplay = valorRaw;
            if (
              (campo.tipo === "radio" || campo.tipo === "select") &&
              valorRaw
            ) {
              const opcion = opciones.find((o: any) => o.valor === valorRaw);
              if (opcion) valorDisplay = opcion.etiqueta;
            }
            return {
              campo_id: campo.campo_id,
              etiqueta: campo.etiqueta,
              tipo: campo.tipo,
              valor: valorDisplay,
            };
          }),
      }));

    const alumno = (bitacora.casos as any)?.alumnos;
    const terapeutaData = (bitacora as any).terapeuta_revisor;

    return {
      bitacora_id: bitacora.bitacora_id,
      fecha: bitacora.fecha,
      hora_entrada: bitacora.hora_entrada,
      hora_salida: bitacora.hora_salida,
      contexto: bitacora.contexto,
      notas_revision: bitacora.notas_revision,
      fecha_revision: bitacora.fecha_revision,
      estado: bitacora.estado,
      pseudonimo: alumno?.pseudonimo || "—",
      nivel_tea: alumno?.nivel_tea ?? null,
      grado_escolar: alumno?.grado_escolar ?? null,
      escuela_actual: alumno?.escuela_actual ?? null,
      nombreSombra,
      nombreTerapeuta: terapeutaData
        ? `${terapeutaData.nombres} ${terapeutaData.apellidos}`
        : "—",
      nombrePlantilla: (bitacora.plantillas as any)?.nombre || "—",
      secciones,
    };
  } catch (err) {
    console.error("[getBitacoraPDFData] Excepción:", err);
    return null;
  }
}

// ─── Generador de HTML del documento PDF ─────────────────────────────────────
export function generarHTMLBitacora(
  data: BitacoraPDFData,
  config: ConfiguracionOrganizacion,
  incluirFirmas: boolean = true
): string {
  const fechaFormateada = new Date(
    data.fecha + "T00:00:00"
  ).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const fechaRevision = data.fecha_revision
    ? new Date(data.fecha_revision).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  const horario =
    data.hora_entrada || data.hora_salida
      ? `${data.hora_entrada?.slice(0, 5) ?? "—"} a ${data.hora_salida?.slice(0, 5) ?? "—"} hrs.`
      : "No registrado";

  const orgContacto = [
    config.direccion,
    config.telefono,
    config.correo_contacto,
  ]
    .filter(Boolean)
    .join("  |  ");

  const seccionesHTML = data.secciones
    .map((sec) => {
      const camposHTML = sec.campos
        .map(
          (campo) => `
          <tr>
            <td class="campo-etiqueta">${campo.etiqueta}</td>
            <td class="campo-valor">${campo.valor?.trim() || '<span class="sin-resp">Sin respuesta</span>'}</td>
          </tr>`
        )
        .join("");

      return `
        <div class="seccion">
          <div class="seccion-titulo">${sec.nombre}</div>
          ${sec.descripcion ? `<p class="seccion-desc">${sec.descripcion}</p>` : ""}
          <table class="campos-tabla">
            <tbody>${camposHTML}</tbody>
          </table>
        </div>`;
    })
    .join("");

  const logoHTML = config.logotipo_url
    ? `<img src="${config.logotipo_url}" class="org-logo" alt="Logo" />`
    : "";

  const contextoHTML = data.contexto
    ? `<div class="nota-bloque">
        <div class="nota-titulo">Observaciones Generales</div>
        <div class="nota-cuerpo">${data.contexto.replace(/\n/g, "<br/>")}</div>
      </div>`
    : "";

  const revisionHTML = data.notas_revision
    ? `<div class="nota-bloque">
        <div class="nota-titulo">Evaluacion del Terapeuta</div>
        <div class="nota-cuerpo">${data.notas_revision.replace(/\n/g, "<br/>")}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bitacora de Sesion — ${data.pseudonimo} — ${fechaFormateada}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      font-size: 10pt;
      line-height: 1.4;
      background: #fff;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 32px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #111827;
      margin-bottom: 12px;
    }
    .org-logo {
      max-height: 40px;
      max-width: 100px;
      object-fit: contain;
      display: block;
      margin-bottom: 4px;
    }
    .org-nombre { font-size: 11pt; font-weight: bold; color: #111827; }
    .org-contacto { font-size: 8pt; color: #4b5563; margin-top: 2px; }
    .header-derecho { text-align: right; }
    .header-derecho .doc-ref { font-size: 11pt; font-weight: 800; text-transform: uppercase; color: #111827; display: block; margin-bottom: 2px; }
    .header-derecho .doc-meta { font-size: 8pt; color: #4b5563; }
    .estado {
      display: inline-block;
      font-size: 7pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #374151;
      border: 1px solid #9ca3af;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 6px;
      vertical-align: middle;
    }
    .info-tabla {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }
    .info-tabla td {
      padding: 4px 6px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }
    .info-tabla .lbl { width: 20%; background: #f9fafb; font-weight: bold; color: #374151; }
    .info-tabla .val { color: #111827; }
    .info-tabla .val.muted { color: #9ca3af; font-style: italic; }
    .seccion-divisora {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #111827;
      border-bottom: 1.5px solid #e5e7eb;
      padding-bottom: 2px;
      margin: 16px 0 10px;
    }
    .seccion { margin-bottom: 12px; page-break-inside: avoid; }
    .seccion-titulo {
      font-size: 9pt;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      margin-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 2px;
    }
    .seccion-desc { font-size: 8pt; color: #4b5563; font-style: italic; margin-bottom: 6px; }
    .campos-tabla { width: 100%; border-collapse: collapse; }
    .campos-tabla td { padding: 3px 6px; border: 1px solid #f3f4f6; font-size: 8.5pt; vertical-align: top; }
    .campo-etiqueta { width: 35%; color: #374151; font-weight: 600; background: #fafafa; }
    .campo-valor { color: #111827; }
    .sin-resp { color: #9ca3af; font-style: italic; }
    .nota-bloque { margin-bottom: 10px; page-break-inside: avoid; }
    .nota-titulo {
      font-size: 8.5pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #111827;
      margin-bottom: 4px;
    }
    .nota-cuerpo {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 9pt;
      color: #1f2937;
      line-height: 1.4;
      background: #f9fafb;
    }
    .firmas-tabla { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: avoid; }
    .firmas-tabla td { text-align: center; padding: 0 15px; vertical-align: bottom; }
    .firma-espacio { height: 35px; }
    .firma-linea { border-top: 1px solid #374151; margin-bottom: 4px; }
    .firma-nombre { font-size: 8.5pt; font-weight: bold; color: #111827; }
    .firma-rol { font-size: 7.5pt; color: #4b5563; }
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 7.5pt;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 16px 24px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        ${logoHTML}
        <div class="org-nombre">${config.nombre_organizacion || "Organizacion"}</div>
        ${orgContacto ? `<div class="org-contacto">${orgContacto}</div>` : ""}
      </div>
      <div class="header-derecho">
        <span class="doc-ref">Bitacora No. ${String(data.bitacora_id).padStart(4, "0")} <span class="estado">Aprobado</span></span>
        <span class="doc-meta">Generado: ${fechaGeneracion}</span>
      </div>
    </div>
    <table class="info-tabla">
      <tbody>
        <tr>
          <td class="lbl">Alumno (Pseudonimo)</td><td class="val">${data.pseudonimo}</td>
          <td class="lbl">Nivel TEA</td><td class="val ${!data.nivel_tea ? "muted" : ""}">${data.nivel_tea ? `Nivel ${data.nivel_tea}` : "No especificado"}</td>
        </tr>
        <tr>
          <td class="lbl">Escuela</td><td class="val ${!data.escuela_actual ? "muted" : ""}">${data.escuela_actual || "No especificada"}</td>
          <td class="lbl">Grado Escolar</td><td class="val ${!data.grado_escolar ? "muted" : ""}">${data.grado_escolar || "No especificado"}</td>
        </tr>
        <tr>
          <td class="lbl">Fecha de Sesion</td><td class="val">${fechaFormateada}</td>
          <td class="lbl">Horario</td><td class="val">${horario}</td>
        </tr>
        <tr>
          <td class="lbl">Maestro Sombra</td><td class="val">${data.nombreSombra}</td>
          <td class="lbl">Terapeuta</td><td class="val">${data.nombreTerapeuta}</td>
        </tr>
        <tr>
          <td class="lbl">Plantilla</td><td class="val" colspan="3">${data.nombrePlantilla}</td>
        </tr>
      </tbody>
    </table>
    <div class="seccion-divisora">Contenido de la Sesion</div>
    ${seccionesHTML}
    ${contextoHTML}
    ${revisionHTML}
    ${incluirFirmas ? `
    <div class="seccion-divisora">Firmas de Conformidad</div>
    <table class="firmas-tabla">
      <tbody>
        <tr>
          <td>
            <div class="firma-espacio"></div><div class="firma-linea"></div>
            <div class="firma-nombre">${data.nombreSombra}</div><div class="firma-rol">Maestro Sombra</div>
          </td>
          <td>
            <div class="firma-espacio"></div><div class="firma-linea"></div>
            <div class="firma-nombre">${data.nombreTerapeuta}</div><div class="firma-rol">Terapeuta</div>
          </td>
          <td>
            <div class="firma-espacio"></div><div class="firma-linea"></div>
            <div class="firma-nombre">Tutor / Padre de Familia</div><div class="firma-rol">Representante Legal</div>
          </td>
        </tr>
      </tbody>
    </table>` : ''}
    <div class="footer">
      ${config.nombre_organizacion || "Sistema de Bitacoras"} &nbsp;|&nbsp; Documento generado automaticamente el ${fechaGeneracion}
    </div>
  </div>
</body>
</html>`;
}
