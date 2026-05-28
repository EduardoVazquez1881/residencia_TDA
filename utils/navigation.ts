import { router } from "expo-router";

/**
 * Intenta navegar hacia atrás en el historial.
 * Si no hay un historial disponible (por ejemplo, el usuario recargó la página directamente),
 * lo redirige de forma segura a la pantalla principal ('/').
 */
export function safeBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}
