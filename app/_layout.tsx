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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
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
            headerShown: true,
            title: "Panel de Usuario",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
