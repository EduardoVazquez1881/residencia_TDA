import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabaseconfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export const LoginScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  // Animaciones
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.8)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animación de entrada del header
    Animated.parallel([
      Animated.timing(headerScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de entrada del contenido
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    return () => clearTimeout(timer);
  }, [headerScale, headerOpacity, contentOpacity, contentTranslateY]);

  // Efecto parallax para el header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!validateEmail(email)) {
      newErrors.email = "Ingresa un correo válido";
    }

    if (!password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 300);
  };

  async function signInWithEmail() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert("Error de Autenticación", error.message);
      } else {
        Alert.alert("¡Éxito!", "Sesión iniciada correctamente.");
        router.replace("/prueba");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Animated.ScrollView
        ref={scrollViewRef as any}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        bounces={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Spacer para permitir scroll */}
        <View style={{ height: screenHeight * 0.08 }} />

        {/* Header Section con Parallax */}
        <Animated.View
          style={[
            {
              alignItems: "center",
              marginBottom: 24,
              transform: [
                { scale: headerScale },
                { translateY: headerTranslateY },
              ],
              opacity: headerOpacity,
            },
          ]}
          className="items-center"
        >
          <Animated.View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 24,
              transform: [
                {
                  scale: scrollY.interpolate({
                    inputRange: [0, 150],
                    outputRange: [1, 0.9],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
            className="items-center justify-center w-20 h-20 mb-3"
          >
            <Ionicons name="apps-outline" size={40} color={colors.primary} />
          </Animated.View>
          <Text
            className="text-base font-medium"
            style={{ color: colors.textSecondary }}
          >
            Nombre
          </Text>
        </Animated.View>

        {/* Login Card */}
        <Animated.View
          style={[
            {
              backgroundColor:
                colorScheme === "dark" ? colors.backgroundSecondary : "#f5f5f5",
              borderRadius: 40,
              paddingTop: 32,
              paddingHorizontal: 24,
              paddingBottom: 50,
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
          className="flex-1"
        >
          <Stack.Screen
            options={{
              title: "Inicio de Sesión",
              headerShown: false,
            }}
          />

          {/* Welcome Section */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              Bienvenido
            </Text>
            <Text
              className="mt-2 text-base"
              style={{ color: colors.textSecondary }}
            >
              Inicia sesión para continuar
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Email Field */}
            <View>
              <FormLabel
                label="Correo Electrónico"
                required
                error={errors.email}
              />
              <FormInput
                ref={emailRef}
                placeholder="ejemplo@correo.com"
                icon="mail-outline"
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={handleInputFocus}
              />
            </View>

            {/* Password Field */}
            <View>
              <FormLabel label="Contraseña" required error={errors.password} />
              <FormInput
                ref={passwordRef}
                placeholder="••••••••"
                icon="key-outline"
                secureTextEntry
                showPasswordToggle
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                value={password}
                autoCapitalize="none"
                onFocus={handleInputFocus}
              />
            </View>

            {/* Forgot Password */}
            <Link href="/prueba" className="mt-2 text-right">
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.info }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </Link>

            {/* Sign In Button */}
            <View className="mt-6">
              <PrimaryButton
                title="Iniciar Sesión"
                loading={loading}
                disabled={loading}
                onPress={signInWithEmail}
                icon={
                  !loading && (
                    <Ionicons
                      name="arrow-forward-outline"
                      size={20}
                      color="white"
                    />
                  )
                }
              />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center gap-1 mt-4">
              <Text
                className="text-base"
                style={{ color: colors.textSecondary }}
              >
                ¿No tienes una cuenta?
              </Text>
              <Link href="/prueba">
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.info }}
                >
                  Regístrate
                </Text>
              </Link>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};
