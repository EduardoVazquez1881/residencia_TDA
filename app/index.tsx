import { Link, Stack, router } from "expo-router";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabaseconfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 300);
  };

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("¡Éxito!", "Sesión iniciada correctamente.");
      router.replace("/prueba");
    }
    setLoading(false);
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className=""
      >
        <View className="flex-1 justify-end items-center bg-white dark:bg-gray-900 px-6 pt-5 pb-40 mt-56 rounded-t-3xl">
          <Stack.Screen options={{ title: "Inicio de Sesión" }} />
          <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Bienvenido
          </Text>
          <Text className="text-base text-center mb-8 text-gray-500 dark:text-gray-400">
            Ingresa tus credenciales para continuar
          </Text>
          <View className="w-full max-w-sm">
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 ml-1">
                  Correo Electrónico
                </Text>
                <TextInput
                  placeholder="ejemplo@email.com"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#9ca3af" : "#6b7280"
                  }
                  onChangeText={(text) => setEmail(text)}
                  value={email}
                  autoCapitalize={"none"}
                  onFocus={handleInputFocus}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 ml-1">
                  Contraseña
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={
                      colorScheme === "dark" ? "#9ca3af" : "#6b7280"
                    }
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={!showPassword}
                    autoCapitalize={"none"}
                    onFocus={handleInputFocus}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-4 pr-14 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={colorScheme === "dark" ? "#9ca3af" : "#6b7280"}
                    />
                  </Pressable>
                </View>
              </View>

              <Link href="/prueba" className="mt-2 text-right">
                <Text className="text-blue-600 dark:text-blue-400">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Link>

              <TouchableOpacity
                onPress={() => signInWithEmail()}
                disabled={loading}
                className={`w-full rounded-xl p-4 mt-8 flex-row justify-center items-center ${
                  loading
                    ? "bg-blue-400"
                    : "bg-blue-600 shadow-lg shadow-blue-500/30"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg text-center">
                    Iniciar Sesión
                  </Text>
                )}
              </TouchableOpacity>

              <Text className="mt-10 text-center text-gray-600 dark:text-gray-400">
                No tienes una cuenta?{" "}
                <Link
                  href="/prueba"
                  className="text-blue-600 dark:text-blue-400"
                >
                  Registrate
                </Link>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
