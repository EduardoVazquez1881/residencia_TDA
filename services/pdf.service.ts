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
  config: ConfiguracionOrganizacion
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
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1a1a1a;
      font-size: 11.5pt;
      line-height: 1.55;
      background: #fff;
    }

    .page {
      max-width: 760px;
      margin: 0 auto;
      padding: 48px 56px;
    }

    /* ENCABEZADO */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 6px;
    }

    .org-logo {
      max-height: 56px;
      max-width: 110px;
      object-fit: contain;
      display: block;
      margin-bottom: 6px;
    }

    .org-nombre {
      font-size: 14pt;
      font-weight: bold;
      color: #1a1a1a;
      letter-spacing: 0.02em;
    }

    .org-contacto {
      font-size: 8.5pt;
      color: #555;
      margin-top: 3px;
      font-family: 'Arial', sans-serif;
    }

    .header-derecho {
      text-align: right;
      font-family: 'Arial', sans-serif;
      font-size: 8.5pt;
      color: #555;
      white-space: nowrap;
    }

    .header-derecho .doc-ref {
      font-size: 9pt;
      font-weight: bold;
      color: #1a1a1a;
      display: block;
      margin-bottom: 3px;
    }

    .doc-subtitulo {
      font-family: 'Arial', sans-serif;
      font-size: 8.5pt;
      color: #555;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 0 14px;
      border-bottom: 1px solid #ccc;
      margin-bottom: 18px;
    }

    /* TITULO CENTRAL */
    .doc-titulo {
      text-align: center;
      margin: 22px 0 20px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 16px;
    }

    .doc-titulo h1 {
      font-size: 17pt;
      font-weight: bold;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #1a1a1a;
    }

    .doc-titulo .estado {
      display: inline-block;
      margin-top: 6px;
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #444;
      border: 1px solid #aaa;
      padding: 2px 12px;
    }

    /* TABLA DE INFORMACION */
    .info-tabla {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      font-family: 'Arial', sans-serif;
    }

    .info-tabla td {
      padding: 5px 8px;
      vertical-align: top;
      border: 1px solid #ddd;
      font-size: 9.5pt;
    }

    .info-tabla .lbl {
      width: 22%;
      background: #f5f5f5;
      color: #333;
      font-weight: bold;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .info-tabla .val { color: #1a1a1a; }
    .info-tabla .val.muted { color: #888; font-style: italic; }

    /* DIVISORES */
    .seccion-divisora {
      font-family: 'Arial', sans-serif;
      font-size: 8.5pt;
      font-weight: bold;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #333;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin: 22px 0 14px;
    }

    /* SECCIONES DE CONTENIDO */
    .seccion {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }

    .seccion-titulo {
      font-family: 'Arial', sans-serif;
      font-size: 9.5pt;
      font-weight: bold;
      color: #1a1a1a;
      background: #f0f0f0;
      border-left: 3px solid #1a1a1a;
      padding: 5px 10px;
    }

    .seccion-desc {
      font-family: 'Arial', sans-serif;
      font-size: 8.5pt;
      color: #666;
      padding: 4px 10px;
      background: #fafafa;
      border-left: 3px solid #ccc;
    }

    .campos-tabla {
      width: 100%;
      border-collapse: collapse;
    }

    .campos-tabla td {
      padding: 5px 10px;
      vertical-align: top;
      border: 1px solid #e0e0e0;
      border-top: none;
      font-size: 9.5pt;
      font-family: 'Arial', sans-serif;
    }

    .campo-etiqueta {
      width: 36%;
      color: #444;
      font-size: 8.5pt;
      font-weight: bold;
      background: #fafafa;
    }

    .campo-valor { color: #1a1a1a; }
    .sin-resp { color: #aaa; font-style: italic; }

    /* BLOQUES DE NOTAS */
    .nota-bloque {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .nota-titulo {
      font-family: 'Arial', sans-serif;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1a1a1a;
      border-left: 3px solid #1a1a1a;
      padding: 4px 10px;
      background: #f0f0f0;
    }

    .nota-cuerpo {
      border: 1px solid #e0e0e0;
      border-top: none;
      padding: 10px 12px;
      font-size: 10pt;
      color: #222;
      min-height: 40px;
      line-height: 1.6;
    }

    /* FIRMAS */
    .firmas-tabla {
      width: 100%;
      border-collapse: collapse;
      margin-top: 36px;
    }

    .firmas-tabla td {
      text-align: center;
      padding: 0 20px;
      vertical-align: bottom;
    }

    .firma-espacio { height: 48px; }

    .firma-linea {
      border-top: 1px solid #555;
      margin-bottom: 5px;
    }

    .firma-nombre {
      font-family: 'Arial', sans-serif;
      font-size: 8.5pt;
      font-weight: bold;
      color: #1a1a1a;
    }

    .firma-rol {
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      color: #666;
    }

    /* PIE */
    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      color: #888;
      text-align: center;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 28px 36px; }
      .seccion, .nota-bloque { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ENCABEZADO -->
    <div class="header">
      <div>
        ${logoHTML}
        <div class="org-nombre">${config.nombre_organizacion || "Organizacion"}</div>
        ${orgContacto ? `<div class="org-contacto">${orgContacto}</div>` : ""}
      </div>
      <div class="header-derecho">
        <span class="doc-ref">Bitacora No. ${String(data.bitacora_id).padStart(4, "0")}</span>
        <span>Generado: ${fechaGeneracion}</span>
      </div>
    </div>

    <div class="doc-subtitulo">Registro de sesion de apoyo educativo especializado</div>

    <!-- TITULO -->
    <div class="doc-titulo">
      <h1>Bitacora de Sesion</h1>
      <span class="estado">Revisado y aprobado</span>
    </div>

    <!-- INFORMACION GENERAL -->
    <table class="info-tabla">
      <tbody>
        <tr>
          <td class="lbl">Alumno (Pseudonimo)</td>
          <td class="val">${data.pseudonimo}</td>
          <td class="lbl">Nivel TEA</td>
          <td class="val ${!data.nivel_tea ? "muted" : ""}">${data.nivel_tea ? `Nivel ${data.nivel_tea}` : "No especificado"}</td>
        </tr>
        <tr>
          <td class="lbl">Escuela</td>
          <td class="val ${!data.escuela_actual ? "muted" : ""}">${data.escuela_actual || "No especificada"}</td>
          <td class="lbl">Grado Escolar</td>
          <td class="val ${!data.grado_escolar ? "muted" : ""}">${data.grado_escolar || "No especificado"}</td>
        </tr>
        <tr>
          <td class="lbl">Fecha de Sesion</td>
          <td class="val">${fechaFormateada}</td>
          <td class="lbl">Horario</td>
          <td class="val">${horario}</td>
        </tr>
        <tr>
          <td class="lbl">Maestro Sombra</td>
          <td class="val">${data.nombreSombra}</td>
          <td class="lbl">Terapeuta</td>
          <td class="val">${data.nombreTerapeuta}</td>
        </tr>
        <tr>
          <td class="lbl">Plantilla</td>
          <td class="val" colspan="3">${data.nombrePlantilla}</td>
        </tr>
        <tr>
          <td class="lbl">Fecha de Revision</td>
          <td class="val">${fechaRevision}</td>
          <td class="lbl">Estado</td>
          <td class="val">Revisado y aprobado</td>
        </tr>
      </tbody>
    </table>

    <!-- CONTENIDO DE LA SESION -->
    <div class="seccion-divisora">Contenido de la Sesion</div>
    ${seccionesHTML}

    ${contextoHTML}
    ${revisionHTML}

    <!-- FIRMAS -->
    <div class="seccion-divisora">Firmas de Conformidad</div>
    <table class="firmas-tabla">
      <tbody>
        <tr>
          <td>
            <div class="firma-espacio"></div>
            <div class="firma-linea"></div>
            <div class="firma-nombre">${data.nombreSombra}</div>
            <div class="firma-rol">Maestro Sombra</div>
          </td>
          <td>
            <div class="firma-espacio"></div>
            <div class="firma-linea"></div>
            <div class="firma-nombre">${data.nombreTerapeuta}</div>
            <div class="firma-rol">Terapeuta</div>
          </td>
          <td>
            <div class="firma-espacio"></div>
            <div class="firma-linea"></div>
            <div class="firma-nombre">Tutor / Padre de Familia</div>
            <div class="firma-rol">Representante Legal</div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      ${config.nombre_organizacion || "Sistema de Bitacoras"}
      &nbsp;&nbsp;|&nbsp;&nbsp;
      Documento generado automaticamente el ${fechaGeneracion}
    </div>

  </div>
</body>
</html>`;
}
