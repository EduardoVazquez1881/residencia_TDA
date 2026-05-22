import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { signUp } from "@/services/auth.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router, Stack } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebSplitLayout } from "@/components/ui/web/WebSplitLayout";

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
    return !newErrors.email && !newErrors.password && !newErrors.confirmPassword;
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
    <WebSplitLayout 
      iconName="person-add-outline" 
      title="Únete al Equipo" 
      subtitle="Crea tu cuenta para comenzar a gestionar expedientes y dar seguimiento terapéutico."
    >
      <Stack.Screen options={{ headerShown: false, title: "Registro" }} />

      <View style={{ marginBottom: 32 }}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Crear Cuenta</Text>
        <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>Completa los datos para registrarte en la plataforma.</Text>
      </View>

      <View style={{ gap: 20 }}>
        {/* Email */}
        <View>
          <FormLabel label="Correo Electrónico" required error={errors.email} />
          <FormInput
            placeholder="tu@email.com"
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

        {/* Confirm Password */}
        <View>
          <FormLabel label="Confirmar Contraseña" required error={errors.confirmPassword} />
          <FormInput
            placeholder="••••••••"
            icon="key-outline"
            secureTextEntry
            showPasswordToggle
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
            }}
            value={confirmPassword}
            autoCapitalize="none"
          />
        </View>

        {/* Terms & Conditions */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
            Al registrarte aceptas nuestros{" "}
            <Text style={{ fontWeight: "700", color: colors.info }}>Términos de Servicio</Text>
            {" "}y{" "}
            <Text style={{ fontWeight: "700", color: colors.info }}>Política de Privacidad</Text>
          </Text>
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton
            title="Crear Cuenta"
            loading={loading}
            disabled={loading}
            onPress={handleSignUp}
            icon={
              !loading && <Ionicons name="arrow-forward-outline" size={20} color="white" />
            }
          />
        </View>

        {/* Login Link */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>
            ¿Ya tienes una cuenta?
          </Text>
          <Link href="/">
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.info }}>
              Inicia Sesión
            </Text>
          </Link>
        </View>

        {/* Security Info */}
        <View style={{ backgroundColor: colors.info, borderRadius: 12, padding: 16, marginTop: 24, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name="shield-checkmark" size={24} color="white" />
          <Text style={{ color: "white", flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 18 }}>
            Tus datos están protegidos con encriptación de nivel empresarial
          </Text>
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
