import { crearNotificacion, notificarCasoParticipantes } from "./notificaciones.service";

/**
 * Script de ayuda para verificar el funcionamiento del sistema de notificaciones.
 * Puedes importar y ejecutar estas funciones en cualquier pantalla o botón temporal para pruebas.
 */

/**
 * Simula la inserción de una notificación directa para un usuario específico.
 * @param usuarioId UUID del usuario destino
 */
export async function simularNotificacionDirecta(usuarioId: string) {
  console.log("Simulando notificación para el usuario:", usuarioId);
  try {
    await crearNotificacion(
      usuarioId,
      "Notificación de Prueba",
      `Esta es una notificación de prueba del sistema enviada el ${new Date().toLocaleTimeString()}.`,
      "sistema"
    );
    console.log("Notificación insertada con éxito.");
  } catch (error) {
    console.error("Error al insertar notificación de prueba:", error);
  }
}

/**
 * Simula la subida de una bitácora para detonar notificaciones a todos los involucrados en un caso.
 * @param casoId ID del caso
 * @param autorId UUID del terapeuta/creador de la bitácora
 */
export async function simularNotificacionDeBitacora(casoId: number, autorId: string) {
  console.log(`Simulando subida de bitácora en el caso ${casoId} por el autor ${autorId}...`);
  try {
    await notificarCasoParticipantes(
      casoId,
      autorId,
      "Nueva Bitácora (Simulada)",
      "Un terapeuta ha subido una nueva bitácora de seguimiento para el alumno.",
      "bitacora_creada"
    );
    console.log("Notificaciones del caso distribuidas con éxito.");
  } catch (error) {
    console.error("Error al simular notificaciones del caso:", error);
  }
}
