import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registrarTokenPush } from "@/services/notificaciones.service";
import { getCurrentSession } from "@/services/auth.service";

// Detectar si estamos ejecutando dentro de Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Configurar comportamiento en primer plano (Foreground) solo si no estamos en Expo Go ni en Web
if (Platform.OS !== "web" && !isExpoGo) {
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.error("Error al configurar expo-notifications:", error);
  }
}

export function usePushNotifications() {
  useEffect(() => {
    // Ignorar en plataforma Web y en Expo Go
    if (Platform.OS === "web" || isExpoGo) {
      if (isExpoGo && Platform.OS !== "web") {
        console.warn(
          "Las notificaciones push móviles no están soportadas en Expo Go a partir de SDK 53. Usa una build de desarrollo para probarlas."
        );
      }
      return;
    }

    async function registerForPushNotificationsAsync() {
      if (!Device.isDevice) {
        console.log("Simulador móvil detectado. No se generará token push nativo real.");
        return;
      }

      try {
        const Notifications = require("expo-notifications");
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("Permisos de notificación push no otorgados por el usuario.");
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        });

        const token = tokenData.data;

        // Registrar el token en Supabase
        const session = await getCurrentSession();
        if (session?.user?.id) {
          await registrarTokenPush(session.user.id, token);
          console.log("Token push móvil registrado con éxito:", token);
        }
      } catch (error) {
        console.error("Error al registrar notificaciones push nativas:", error);
      }
    }

    registerForPushNotificationsAsync();
  }, []);
}
