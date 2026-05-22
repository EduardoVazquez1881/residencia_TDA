import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { resendOtp, verifyOtp } from "@/services/auth.service";
import { tienePerfilCompleto } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebCenteredCard } from "@/components/ui/web/WebCenteredCard";

export const VerifyEmailScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams();
  const { email } = params as { email: string };
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length === 0) {
      Alert.alert("Error", "Por favor ingresa el código de verificación");
      return;
    }
    if (otp.length !== 6) {
      Alert.alert("Error", "El código debe tener 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtp(email, otp);

      if (result.error) {
        Alert.alert("Error", result.error);
      } else if (result.success && result.uid) {
        // Verificar si ya completó el perfil
        const tienePerfil = await tienePerfilCompleto(result.uid);
        if (tienePerfil) {
          router.replace("/prueba");
        } else {
          router.replace({ pathname: "/dataUsr", params: { email } });
        }
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const result = await resendOtp(email);
      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        Alert.alert("Código Reenviado", "Te hemos enviado un nuevo código de verificación a tu correo");
      }
    } catch {
      Alert.alert("Error", "No pudimos reenviar el código");
    } finally {
      setResendLoading(false);
    }
  };

  const isComplete = otp.length === 6;

  return (
    <WebCenteredCard maxWidth={480}>
      <Stack.Screen options={{ title: "Verificar Email", headerShown: false }} />

      {/* ── Icono ── */}
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: colors.primary, shadowColor: colors.primary }
          ]}
        >
          <Ionicons name="mail-open-outline" size={40} color="#fff" />
        </View>
      </View>

        {/* ── Título ── */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text style={[styles.title, { color: colors.text }]}>Verifica tu Email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ingresa el código de 6 dígitos{"\n"}que enviamos a:
          </Text>

          {/* Badge del email */}
          <View
            style={[
              styles.emailBadge,
              {
                backgroundColor: isDark ? colors.backgroundSecondary : "#f0f9ff",
                borderColor: colors.primary,
              }
            ]}
          >
            <Ionicons name="at-outline" size={15} color={colors.primary} />
            <Text style={[styles.emailText, { color: colors.primary }]} numberOfLines={1}>
              {email || "tu correo"}
            </Text>
          </View>
        </View>

        {/* ── Input OTP ── */}
        <View style={{ marginBottom: 8, alignItems: "center" }}>
          <TextInput
            placeholder="• • • • • •"
            placeholderTextColor={colors.inputBorder}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
            maxLength={6}
            keyboardType="number-pad"
            editable={!loading}
            style={[
              styles.otpInput,
              {
                backgroundColor: colors.input,
                borderColor: isComplete ? colors.success : colors.inputBorder,
                color: colors.text,
              }
            ]}
          />
        </View>

        {/* Contador + limpiar */}
        <View style={styles.counterRow}>
          <Text style={{ fontSize: 13, color: isComplete ? colors.success : colors.textSecondary, fontWeight: isComplete ? "600" : "400" }}>
            {isComplete ? "✓ Código completo" : `${otp.length} / 6 dígitos`}
          </Text>
          {otp.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setOtp("")}>
              <Text style={{ fontSize: 13, color: colors.error, fontWeight: "600" }}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Botón verificar ── */}
        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            title={isComplete ? "Verificar Código" : "Ingresa 6 dígitos"}
            loading={loading}
            disabled={loading || !isComplete}
            onPress={handleVerifyOtp}
            icon={
              !loading && isComplete ? (
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              ) : undefined
            }
          />
        </View>

        {/* ── Info box ── */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : "#eff6ff",
              borderLeftColor: colors.info,
            }
          ]}
        >
          <Ionicons name="time-outline" size={18} color={colors.info} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            El código expira en <Text style={{ fontWeight: "700", color: colors.info }}>10 minutos</Text>. 
            Revisa también tu carpeta de spam si no lo encuentras.
          </Text>
        </View>

        {/* ── Divisor ── */}
        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>¿Problemas?</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Reenviar ── */}
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>¿No recibiste el código?</Text>
            <PrimaryButton
              title="Reenviar"
              variant="outline"
              size="small"
              loading={resendLoading}
              disabled={resendLoading || loading}
              onPress={handleResendOtp}
            />
          </View>

          {/* Volver al login */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>o volver al</Text>
            <Link href="/">
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>Login</Text>
            </Link>
          </View>
        </View>

    </WebCenteredCard>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 14,
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 7,
    maxWidth: "90%",
  },
  emailText: {
    fontSize: 14,
    fontWeight: "700",
  },
  otpInput: {
    borderWidth: 2,
    borderRadius: 18,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 14,
    textAlign: "center",
    paddingVertical: 22,
    paddingHorizontal: 20,
    width: "100%",
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 4,
    width: "100%",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
  },
});
