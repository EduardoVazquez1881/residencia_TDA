import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { NotificacionesProvider } from "@/context/notificaciones-context";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Registrar notificaciones push en móviles
  usePushNotifications();

  return (
    <NotificacionesProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Pantalla principal con demo de Tailwind y Supabase */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: "Demo Tailwind + Supabase",
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: true,
            title: "Registro",
          }}
        />
        <Stack.Screen
          name="verify-email"
          options={{
            headerShown: true,
            title: "Verificar Email",
          }}
        />
        <Stack.Screen
          name="prueba"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="registro-alumno"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="seleccion-bitacora"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="nueva-plantilla"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="alumnos"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="expedientes"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mis-plantillas"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reportes"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="perfil"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="seleccion-caso"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </NotificacionesProvider>
  );
}
