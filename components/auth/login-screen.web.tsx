import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { resendOtp, signIn } from "@/services/auth.service";
import { tienePerfilCompleto } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack, router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View, StyleSheet } from "react-native";
import { WebSplitLayout } from "@/components/ui/web/WebSplitLayout";

export const LoginScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

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

  async function signInWithEmail() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);

      if (result.emailNotConfirmed) {
        await resendOtp(email.trim());
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }

      if (result.error) {
        Alert.alert("Error", result.error);
        return;
      }

      if (result.uid) {
        const tienePerfil = await tienePerfilCompleto(result.uid);
        if (!tienePerfil) {
          router.replace({ pathname: "/dataUsr", params: { email: email.trim() } });
          return;
        }
      }

      router.replace("/prueba");
    } catch {
      Alert.alert("Error", "Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WebSplitLayout 
      iconName="apps-outline" 
      title="Residencia TDA" 
      subtitle="Sistema Integral de Gestión de Casos y Seguimiento Terapéutico."
    >
      <Stack.Screen options={{ headerShown: false, title: "Inicio de Sesión" }} />

      <View style={{ marginBottom: 32 }}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Bienvenido de vuelta</Text>
        <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>Ingresa tus credenciales para acceder a tu panel.</Text>
      </View>

      <View style={{ gap: 20 }}>
        {/* Email */}
        <View>
          <FormLabel label="Correo Electrónico" required error={errors.email} />
          <FormInput
            placeholder="ejemplo@correo.com"
            icon="mail-outline"
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password */}
        <View>
          <FormLabel label="Contraseña" required error={errors.password} />
          <FormInput
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
          />
        </View>

        {/* Forgot Password */}
        <Link href="/prueba" style={{ alignSelf: "flex-end", marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.info }}>¿Olvidaste tu contraseña?</Text>
        </Link>

        {/* Submit Button */}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton
            title="Iniciar Sesión"
            loading={loading}
            disabled={loading}
            onPress={signInWithEmail}
            icon={!loading ? <Ionicons name="arrow-forward-outline" size={20} color="white" /> : null}
          />
        </View>

        {/* Register Link */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>¿No tienes una cuenta?</Text>
          <Link href={"/register" as any}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.info }}>Regístrate</Text>
          </Link>
        </View>
      </View>
    </WebSplitLayout>
  );
};

const styles = StyleSheet.create({
  formTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
});
