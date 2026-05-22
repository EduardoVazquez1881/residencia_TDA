import { supabase } from "@/supabaseconfig";

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface NotificacionData {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  entidad_id?: string;
  leido: boolean;
  creado_en: string;
}

// ─── Obtener Notificaciones del Usuario ────────────────────────────────────────
export async function getNotificaciones(usuarioId: string): Promise<NotificacionData[]> {
  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error al obtener notificaciones:", error);
    return [];
  }
  return data || [];
}

// ─── Conteo de Notificaciones No Leídas ───────────────────────────────────────
export async function getNotificacionesSinLeerCount(usuarioId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notificaciones")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .eq("leido", false);

  if (error) {
    console.error("Error al contar notificaciones no leídas:", error);
    return 0;
  }
  return count || 0;
}

// ─── Marcar como Leída ─────────────────────────────────────────────────────────
export async function marcarComoLeida(id: string): Promise<void> {
  const { error } = await supabase
    .from("notificaciones")
    .update({ leido: true })
    .eq("id", id);

  if (error) {
    console.error("Error al marcar notificación como leída:", error);
  }
}

// ─── Marcar todas como Leídas ──────────────────────────────────────────────────
export async function marcarTodasComoLeidas(usuarioId: string): Promise<void> {
  const { error } = await supabase
    .from("notificaciones")
    .update({ leido: true })
    .eq("usuario_id", usuarioId)
    .eq("leido", false);

  if (error) {
    console.error("Error al marcar todas las notificaciones como leídas:", error);
  }
}

// ─── Registro de Token Push (Mobile) ──────────────────────────────────────────
export async function registrarTokenPush(usuarioId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from("tokens_push_usuario")
    .upsert(
      { usuario_id: usuarioId, token, creado_en: new Date().toISOString() },
      { onConflict: "token" }
    );

  if (error) {
    console.error("Error al registrar token push:", error);
  }
}

// ─── Enviar Notificaciones Push a través de la API de Expo ──────────────────────
export async function enviarNotificacionPush(
  tokens: string[],
  titulo: string,
  mensaje: string,
  data?: any
): Promise<any> {
  if (!tokens || tokens.length === 0) return null;

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        tokens.map(token => ({
          to: token,
          sound: "default",
          title: titulo,
          body: mensaje,
          data: data || {},
        }))
      ),
    });

    const res = await response.json();
    return res;
  } catch (error) {
    console.error("Error enviando push notification a Expo:", error);
    return null;
  }
}

// Generador simple de UUID v4 para inserciones que no pueden usar RETURNING por RLS
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Crear Notificación Individual y Enviar Push ──────────────────────────────
export async function crearNotificacion(
  usuarioId: string,
  titulo: string,
  mensaje: string,
  tipo: string,
  entidadId?: string
): Promise<void> {
  const notificationId = generateUUID();
  console.log(`[crearNotificacion] Intentando insertar notificación. ID: ${notificationId}, Destinatario: ${usuarioId}, Título: "${titulo}"`);

  // 1. Guardar en la base de datos (sin .select() para evitar error RLS de lectura en inserciones cruzadas)
  const { error } = await supabase
    .from("notificaciones")
    .insert({
      id: notificationId,
      usuario_id: usuarioId,
      titulo,
      mensaje,
      tipo,
      entidad_id: entidadId,
      leido: false
    });

  if (error) {
    console.warn("[crearNotificacion] Error al insertar notificación en BD:", error);
    return;
  }
  console.log("[crearNotificacion] Notificación insertada correctamente en BD.");

  // 2. Buscar tokens push para este usuario y enviar push si los hay
  const { data: tokensData, error: tokensErr } = await supabase
    .from("tokens_push_usuario")
    .select("token")
    .eq("usuario_id", usuarioId);

  if (tokensErr) {
    console.error("[crearNotificacion] Error recuperando tokens push:", tokensErr);
  }
  console.log("[crearNotificacion] Tokens push recuperados:", tokensData);

  if (tokensData && tokensData.length > 0) {
    const tokens = tokensData.map(t => t.token);
    console.log(`[crearNotificacion] Enviando push a ${tokens.length} tokens para usuario ${usuarioId}`);
    const pushResult = await enviarNotificacionPush(tokens, titulo, mensaje, {
      id: notificationId,
      tipo,
      entidad_id: entidadId
    });
    console.log("[crearNotificacion] Resultado del envío push:", pushResult);
  } else {
    console.log("[crearNotificacion] No hay tokens push registrados para este usuario.");
  }
}

// ─── Notificar a todos los Participantes del Caso (Dueño + Colaboradores) ───────
export async function notificarCasoParticipantes(
  casoId: number,
  autorId: string,
  titulo: string,
  mensaje: string,
  tipo: string,
  entidadId?: string
): Promise<void> {
  try {
    console.log(`[notificarCasoParticipantes] Iniciando para caso ${casoId}, autor ${autorId}`);
    // 1. Obtener dueños/creadores del caso
    const { data: caso, error: casoErr } = await supabase
      .from("casos")
      .select("usuario_id, creado_por")
      .eq("caso_id", casoId)
      .single();

    if (casoErr) {
      console.error("Error recuperando dueños del caso para notificar:", casoErr);
      return;
    }
    console.log("[notificarCasoParticipantes] Datos del caso recuperados:", caso);

    // 2. Obtener colaboradores del caso
    const { data: colaboradores, error: colabErr } = await supabase
      .from("caso_participantes")
      .select("usuario_id")
      .eq("caso_id", casoId);

    if (colabErr) {
      console.error("Error recuperando participantes del caso para notificar:", colabErr);
    }
    console.log("[notificarCasoParticipantes] Colaboradores recuperados:", colaboradores);

    // 3. Unificar IDs únicos excluyendo al autor del evento
    const destinatarios = new Set<string>();
    if (caso?.usuario_id) destinatarios.add(caso.usuario_id);
    if (caso?.creado_por) destinatarios.add(caso.creado_por);
    
    colaboradores?.forEach(c => {
      if (c.usuario_id) destinatarios.add(c.usuario_id);
    });

    // Quitar a la persona que realizó la acción
    destinatarios.delete(autorId);
    console.log("[notificarCasoParticipantes] Destinatarios finales tras filtrar autor:", Array.from(destinatarios));

    if (destinatarios.size === 0) {
      console.log("[notificarCasoParticipantes] No hay destinatarios a notificar.");
      return;
    }

    // 4. Crear notificaciones en BD en lote
    const insertPayload = Array.from(destinatarios).map(uid => ({
      usuario_id: uid,
      titulo,
      mensaje,
      tipo,
      entidad_id: entidadId || casoId.toString(),
      leido: false
    }));

    const { error: insErr } = await supabase
      .from("notificaciones")
      .insert(insertPayload);

    if (insErr) {
      console.error("Error insertando notificaciones en lote:", insErr);
      return;
    }
    console.log("[notificarCasoParticipantes] Notificaciones en lote insertadas correctamente.");

    // 5. Enviar alertas push individuales
    for (const uid of destinatarios) {
      const { data: tokensData } = await supabase
        .from("tokens_push_usuario")
        .select("token")
        .eq("usuario_id", uid);

      if (tokensData && tokensData.length > 0) {
        const tokens = tokensData.map(t => t.token);
        console.log(`[notificarCasoParticipantes] Enviando push a ${tokens.length} tokens para usuario ${uid}`);
        await enviarNotificacionPush(tokens, titulo, mensaje, {
          tipo,
          entidad_id: entidadId || casoId.toString()
        });
      }
    }
  } catch (error) {
    console.error("Error en notificarCasoParticipantes:", error);
  }
}

// ─── Suscripción en Tiempo Real a Notificaciones del Usuario ─────────────────
export function subscribeToNotificaciones(
  usuarioId: string,
  onUpdate: () => void
): () => void {
  const channel = supabase
    .channel(`notificaciones-usuario-${usuarioId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notificaciones",
        filter: `usuario_id=eq.${usuarioId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  // Retorna función para desuscribirse
  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Notificar a los Terapeutas del Caso sobre una Nueva Bitácora ───────────────
export async function notificarTerapeutasNuevaBitacora(
  casoId: number,
  bitacoraId: number,
  creadorId: string
): Promise<void> {
  try {
    console.log(`[notificarTerapeutasNuevaBitacora] Iniciando para caso ${casoId}, creador ${creadorId}`);
    
    // 1. Obtener dueños/creadores del caso y pseudónimo del alumno
    const { data: caso, error: casoErr } = await supabase
      .from("casos")
      .select("usuario_id, creado_por, alumnos(pseudonimo)")
      .eq("caso_id", casoId)
      .single();

    if (casoErr) {
      console.error("Error recuperando dueños del caso para notificar:", casoErr);
      return;
    }
    console.log("[notificarTerapeutasNuevaBitacora] Datos del caso recuperados:", caso);
    const alumnoPseudonimo = (caso as any)?.alumnos?.pseudonimo || "un alumno";

    // 2. Obtener terapeutas colaboradores del caso
    const { data: colaboradores, error: colabErr } = await supabase
      .from("caso_participantes")
      .select("usuario_id, rol_en_caso")
      .eq("caso_id", casoId);

    if (colabErr) {
      console.error("Error recuperando participantes del caso para notificar:", colabErr);
    }
    console.log("[notificarTerapeutasNuevaBitacora] Colaboradores recuperados:", colaboradores);

    // 3. Obtener nombre del creador (Sombra)
    const { data: creadorData } = await supabase
      .from("usuarios")
      .select("nombres, apellidos")
      .eq("usuario_id", creadorId)
      .single();
    const nombreSombra = creadorData ? `${creadorData.nombres} ${creadorData.apellidos}` : "Un maestro sombra";

    // 4. Unificar IDs únicos excluyendo al creador del evento
    const destinatarios = new Set<string>();
    if (caso?.usuario_id) destinatarios.add(caso.usuario_id);
    if (caso?.creado_por) destinatarios.add(caso.creado_por);
    
    colaboradores?.forEach(c => {
      if (c.usuario_id && c.rol_en_caso?.toLowerCase().trim().includes("terapeuta")) {
        destinatarios.add(c.usuario_id);
      }
    });

    // Quitar al creador de la bitácora
    destinatarios.delete(creadorId);
    console.log("[notificarTerapeutasNuevaBitacora] Destinatarios finales tras filtrar creador:", Array.from(destinatarios));

    if (destinatarios.size === 0) {
      console.log("[notificarTerapeutasNuevaBitacora] No hay destinatarios a notificar.");
      return;
    }

    const titulo = "Bitácora Pendiente de Revisión";
    const mensaje = `${nombreSombra} ha registrado una nueva bitácora para el alumno ${alumnoPseudonimo}.`;
    const tipo = "bitacora_creada";

    // 5. Crear notificaciones en BD en lote
    const insertPayload = Array.from(destinatarios).map(uid => ({
      usuario_id: uid,
      titulo,
      mensaje,
      tipo,
      entidad_id: bitacoraId.toString(),
      leido: false
    }));

    const { error: insErr } = await supabase
      .from("notificaciones")
      .insert(insertPayload);

    if (insErr) {
      console.error("Error insertando notificaciones en lote para terapeutas:", insErr);
      return;
    }
    console.log("[notificarTerapeutasNuevaBitacora] Notificaciones en lote insertadas correctamente.");

    // 6. Enviar alertas push individuales
    for (const uid of destinatarios) {
      const { data: tokensData } = await supabase
        .from("tokens_push_usuario")
        .select("token")
        .eq("usuario_id", uid);

      if (tokensData && tokensData.length > 0) {
        const tokens = tokensData.map(t => t.token);
        console.log(`[notificarTerapeutasNuevaBitacora] Enviar push a ${tokens.length} tokens para terapeuta ${uid}`);
        await enviarNotificacionPush(tokens, titulo, mensaje, {
          tipo,
          entidad_id: bitacoraId.toString()
        });
      }
    }
  } catch (error) {
    console.error("Error en notificarTerapeutasNuevaBitacora:", error);
  }
}

// ─── Notificar el Resultado de la Revisión de la Bitácora ────────────────────────
export async function notificarRevisionBitacora(
  casoId: number,
  bitacoraId: number,
  sombraId: string,
  revisorId: string,
  nuevoEstado: "revisado" | "devuelta",
  notasRevision: string
): Promise<void> {
  try {
    console.log(`[notificarRevisionBitacora] Iniciando para caso ${casoId}, bitacora ${bitacoraId}, nuevoEstado ${nuevoEstado}`);
    
    // 1. Obtener el pseudónimo del alumno
    const { data: casoData, error: casoErr } = await supabase
      .from("casos")
      .select("alumnos(pseudonimo)")
      .eq("caso_id", casoId)
      .single();

    if (casoErr) {
      console.error("[notificarRevisionBitacora] Error al obtener el caso:", casoErr);
      return;
    }
    const pseudonimo = (casoData as any)?.alumnos?.pseudonimo || "un alumno";

    // 2. Obtener el nombre del terapeuta revisor
    const { data: revisorData } = await supabase
      .from("usuarios")
      .select("nombres, apellidos")
      .eq("usuario_id", revisorId)
      .single();
    const nombreRevisor = revisorData ? `${revisorData.nombres} ${revisorData.apellidos}` : "Un terapeuta";

    // 3. Notificar a la Sombra
    let finalSombraId = sombraId;
    console.log(`[notificarRevisionBitacora] sombraId recibido: "${sombraId}"`);

    if (!finalSombraId) {
      console.log(`[notificarRevisionBitacora] sombraId no proporcionado. Buscando creador en la bitácora...`);
      const { data: bitData, error: bitErr } = await supabase
        .from("bitacoras")
        .select("creado_por, sombra_id")
        .eq("bitacora_id", bitacoraId)
        .single();
      
      if (bitErr) {
        console.error(`[notificarRevisionBitacora] Error al recuperar la bitácora ${bitacoraId} para obtener creador:`, bitErr);
      } else if (bitData) {
        finalSombraId = bitData.creado_por || bitData.sombra_id;
        console.log(`[notificarRevisionBitacora] Encontrado finalSombraId en base de datos: "${finalSombraId}"`);
      }
    }

    if (!finalSombraId) {
      console.log(`[notificarRevisionBitacora] Aún sin sombraId. Buscando participante con rol 'Sombra' en caso_participantes para caso ${casoId}...`);
      const { data: participantes, error: partError } = await supabase
        .from("caso_participantes")
        .select("usuario_id, rol_en_caso")
        .eq("caso_id", casoId);

      if (partError) {
        console.error("[notificarRevisionBitacora] Error al obtener participantes del caso:", partError);
      } else {
        const sombraColab = participantes?.find(p => p.rol_en_caso?.toLowerCase().trim().includes("sombra"));
        if (sombraColab) {
          finalSombraId = sombraColab.usuario_id;
          console.log(`[notificarRevisionBitacora] Encontrado participante Sombra en caso: "${finalSombraId}"`);
        }
      }
    }

    console.log(`[notificarRevisionBitacora] sombraId resuelto: "${finalSombraId}". RevisorId: "${revisorId}"`);

    if (finalSombraId && finalSombraId !== revisorId) {
      const actualEstadoText = nuevoEstado === "revisado" ? "aprobada" : "devuelta";
      const commentText = notasRevision.trim() ? ` Observaciones: "${notasRevision.trim()}"` : "";
      
      const tituloSombra = `Bitácora ${nuevoEstado === "revisado" ? "Validada" : "Observada"}`;
      const mensajeSombra = `Tu bitácora del alumno ${pseudonimo} ha sido ${actualEstadoText} por ${nombreRevisor}.${commentText}`;

      console.log(`[notificarRevisionBitacora] Enviando notificación a Sombra (${finalSombraId})`);
      await crearNotificacion(
        finalSombraId,
        tituloSombra,
        mensajeSombra,
        "bitacora_revisada",
        bitacoraId.toString()
      );
    } else {
      console.log(`[notificarRevisionBitacora] Se omitió el envío a Sombra. finalSombraId: "${finalSombraId}", revisorId: "${revisorId}"`);
    }

    // 4. Si el estado es revisado (Aprobada / Correcta), notificar al Tutor(es) del caso
    if (nuevoEstado === "revisado") {
      const { data: participantes, error: partErr } = await supabase
        .from("caso_participantes")
        .select("usuario_id, rol_en_caso")
        .eq("caso_id", casoId);

      if (partErr) {
        console.error("[notificarRevisionBitacora] Error al obtener tutores:", partErr);
      } else {
        const tutoresIds = new Set<string>();
        participantes?.forEach(p => {
          if (p.usuario_id && p.rol_en_caso?.toLowerCase().trim().includes("tutor")) {
            tutoresIds.add(p.usuario_id);
          }
        });

        // Quitar al propio revisor
        tutoresIds.delete(revisorId);

        if (tutoresIds.size > 0) {
          const tituloTutor = "Nueva Bitácora Disponible";
          const mensajeTutor = `La bitácora de ${pseudonimo} ha sido validada por el terapeuta y ya se encuentra disponible para su consulta.`;
          const tipoTutor = "bitacora_revisada"; // Usar el mismo tipo para reutilizar la lógica de redirección y estilo

          const insertPayload = Array.from(tutoresIds).map(uid => ({
            usuario_id: uid,
            titulo: tituloTutor,
            mensaje: mensajeTutor,
            tipo: tipoTutor,
            entidad_id: bitacoraId.toString(),
            leido: false
          }));

          const { error: insErr } = await supabase
            .from("notificaciones")
            .insert(insertPayload);

          if (insErr) {
            console.error("[notificarRevisionBitacora] Error al insertar notificaciones para tutores:", insErr);
          } else {
            console.log("[notificarRevisionBitacora] Notificaciones para tutores insertadas en BD.");
            
            // Enviar alerta push para tutores
            for (const uid of tutoresIds) {
              const { data: tokensData } = await supabase
                .from("tokens_push_usuario")
                .select("token")
                .eq("usuario_id", uid);

              if (tokensData && tokensData.length > 0) {
                const tokens = tokensData.map(t => t.token);
                await enviarNotificacionPush(tokens, tituloTutor, mensajeTutor, {
                  tipo: tipoTutor,
                  entidad_id: bitacoraId.toString()
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error en notificarRevisionBitacora:", error);
  }
}
