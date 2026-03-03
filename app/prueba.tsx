/**
 * Pantalla principal - Demo de Tailwind + Supabase + Multiplataforma
 * Usa el Layout multiplataforma (AppLayout carga .web o .native automáticamente)
 */

import AppLayout from "@/components/layout/AppLayout";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabaseconfig";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [supabaseStatus, setSupabaseStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Verificar conexión con Supabase y obtener datos del usuario
  useEffect(() => {
    const checkSessionAndFetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSupabaseStatus("connected");
          setLoadingUser(true);

          // Consultar la tabla usuarios usando el UUID
          const { data, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("usuario_id", session.user.id)
            .single();

          if (data) {
            setUserData(data);
          } else if (error) {
            console.error("Error fetching user data:", error.message);
          }
        } else {
          setSupabaseStatus("checking");
        }
      } catch (error) {
        setSupabaseStatus("error");
      } finally {
        setLoadingUser(false);
      }
    };

    checkSessionAndFetchUser();
  }, []);

  // Detectar plataforma actual
  const platformName = Platform.select({
    ios: "iOS",
    android: "Android",
    web: "Web",
    default: "Desconocido",
  });

  const currentColors = Colors[colorScheme ?? "light"];

  return (
    <AppLayout showSidebar={Platform.OS === "web"}>
      {/* Hero Section */}
      <View className="items-center mb-8">
        <Text className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white"></Text>
        <Text className="text-3xl font-semibold text-center mb-4 text-blue-600 dark:text-blue-400">
          {userData
            ? `Bienvenido, ${userData.nombres || "Usuario"}`
            : "Bienvenido a Tailwind"}
        </Text>
        <Text className="text-base text-center text-gray-600 dark:text-gray-300 max-w-md">
          {userData
            ? `Sesión iniciada correctamente`
            : "NativeWind 4 + Supabase + Expo Router"}
        </Text>
      </View>

      {/* Card de Perfil de Usuario */}
      {userData && (
        <View className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 mb-6 border border-indigo-100 dark:border-indigo-800">
          <Text className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
            Perfil de Usuario
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-semibold text-indigo-600 dark:text-indigo-400">
                Nombres:
              </Text>{" "}
              {userData.nombres || "No especificado"}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-semibold text-indigo-600 dark:text-indigo-400">
                Apellidos:
              </Text>{" "}
              {userData.apellidos || "No especificado"}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-semibold text-indigo-600 dark:text-indigo-400">
                ID de Rol:
              </Text>{" "}
              {userData.rol_id || "N/A"}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-semibold text-indigo-600 dark:text-indigo-400">
                ID:
              </Text>{" "}
              {userData.id}
            </Text>
          </View>
        </View>
      )}

      {loadingUser && (
        <View className="items-center mb-6">
          <ActivityIndicator color={currentColors.tint} />
          <Text className="text-sm text-gray-500 mt-2">Cargando perfil...</Text>
        </View>
      )}

      {/* Card de Plataforma */}
      <View className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-6 mb-6">
        <Text className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          Plataforma
        </Text>
        <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          {platformName}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Versión: {Platform.Version || "N/A"}
        </Text>
      </View>

      {/* Card de Supabase */}
      <View
        className={`rounded-2xl p-6 mb-6 ${
          supabaseStatus === "connected"
            ? "bg-green-50 dark:bg-green-900/20"
            : "bg-yellow-50 dark:bg-yellow-900/20"
        }`}
      >
        <Text className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          Supabase
        </Text>
        {supabaseStatus === "checking" ? (
          <ActivityIndicator color={currentColors.tint} />
        ) : (
          <Text
            className={
              supabaseStatus === "connected"
                ? "text-green-700 dark:text-green-300"
                : "text-yellow-700"
            }
          >
            {supabaseStatus === "connected" ? "Conectado" : "Verificando..."}
          </Text>
        )}
      </View>

      {/* Card de Guía */}
      <View className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6">
        <Text className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          Ejemplos
        </Text>
        <Text className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          • <Text className="font-semibold">Tailwind:</Text> className="text-xl
          font-bold"
        </Text>
        <Text className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          • <Text className="font-semibold">Platform:</Text> Platform.OS,
          Platform.select()
        </Text>
        <Text className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          • <Text className="font-semibold">Layout:</Text> AppLayout.web.tsx /
          .native.tsx
        </Text>
        <Text className="text-sm text-gray-700 dark:text-gray-300">
          • <Text className="font-semibold">Dark mode:</Text> dark:bg-gray-900
        </Text>
      </View>
    </AppLayout>
  );
}
