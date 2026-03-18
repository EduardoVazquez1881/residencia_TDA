import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { signUp } from "@/services/auth.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export const RegisterScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

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
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!validateEmail(email)) {
      newErrors.email = "Ingresa un correo válido";
    }

    if (!password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return (
      !newErrors.email && !newErrors.password && !newErrors.confirmPassword
    );
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 300);
  };

  async function handleSignUp() {
    if (!validateForm()) return;

    setLoading(true);
    const result = await signUp(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setErrors({ ...errors, email: result.error });
      return;
    }
    if (result.alreadyRegistered) {
      setErrors({ ...errors, email: "Este correo ya está registrado." });
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
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
            <Ionicons
              name="person-add-outline"
              size={40}
              color={colors.primary}
            />
          </Animated.View>
          <Text
            className="text-base font-medium"
            style={{ color: colors.textSecondary }}
          >
            Nombre
          </Text>
        </Animated.View>

        {/* Register Card */}
        <Animated.View
          style={[
            {
              backgroundColor:
                colorScheme === "dark" ? colors.backgroundSecondary : "#f5f5f5",
              borderRadius: 40,
              paddingTop: 32,
              paddingHorizontal: 24,
              paddingBottom: 32,
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
          className="flex-1"
        >
          <Stack.Screen
            options={{
              title: "Registro",
              headerShown: false,
            }}
          />

          {/* Welcome Section */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              Crear Cuenta
            </Text>
            <Text
              className="mt-2 text-base"
              style={{ color: colors.textSecondary }}
            >
              Completa los datos para registrarte
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
                placeholder="tu@email.com"
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

            {/* Confirm Password Field */}
            <View>
              <FormLabel
                label="Confirmar Contraseña"
                required
                error={errors.confirmPassword}
              />
              <FormInput
                ref={confirmPasswordRef}
                placeholder="••••••••"
                icon="key-outline"
                secureTextEntry
                showPasswordToggle
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: "" });
                }}
                value={confirmPassword}
                autoCapitalize="none"
                onFocus={handleInputFocus}
              />
            </View>

            {/* Terms & Conditions */}
            <View className="flex-row items-start gap-2 mt-2">
              <Text
                className="text-xs leading-5"
                style={{ color: colors.textSecondary, flex: 1 }}
              >
                Al registrarte aceptas nuestros{" "}
                <Text className="font-bold" style={{ color: colors.info }}>
                  Términos de Servicio
                </Text>{" "}
                y{" "}
                <Text className="font-bold" style={{ color: colors.info }}>
                  Política de Privacidad
                </Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <View className="mt-6">
              <PrimaryButton
                title="Crear Cuenta"
                loading={loading}
                disabled={loading}
                onPress={handleSignUp}
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

            {/* Login Link */}
            <View className="flex-row justify-center gap-1 mt-4">
              <Text
                className="text-base"
                style={{ color: colors.textSecondary }}
              >
                ¿Ya tienes una cuenta?
              </Text>
              <Link href="/">
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.info }}
                >
                  Inicia Sesión
                </Text>
              </Link>
            </View>

            {/* Security Info */}
            <View
              style={{
                backgroundColor: colors.info,
                borderRadius: 12,
                padding: 12,
                marginTop: 16,
              }}
              className="gap-2"
            >
              <View className="flex-row items-start gap-3">
                <Ionicons name="shield-checkmark" size={20} color="white" />
                <Text className="flex-1 text-xs font-medium text-white">
                  Tus datos están protegidos con encriptación de nivel
                  empresarial
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};
