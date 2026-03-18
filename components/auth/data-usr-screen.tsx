import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { upsertUsuario } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Opciones de rol ───────────────────────────────────────────────────────────
const ROLES = [
  { id: 2, label: "Terapeuta", icon: "medkit-outline" as const },
  { id: 3, label: "Sombra", icon: "person-outline" as const },
  { id: 4, label: "Tutor", icon: "school-outline" as const },
];

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export const DataUsrScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const { email } = useLocalSearchParams<{ email: string }>();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rolId, setRolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSave = async () => {
    if (!nombres.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tus nombres");
      return;
    }
    if (!apellidos.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tus apellidos");
      return;
    }
    if (!rolId) {
      Alert.alert("Campo requerido", "Por favor selecciona tu rol");
      return;
    }

    setLoading(true);
    try {
      const session = await getCurrentSession();

      if (!session) {
        Alert.alert("Error", "No se pudo obtener la sesión. Inicia sesión nuevamente.");
        return;
      }

      const result = await upsertUsuario({
        usuario_id: session.user.id,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        rol_id: rolId,
      });

      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        router.replace("/prueba");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error al guardar los datos");
    } finally {
      setLoading(false);
    }
  };

  const isComplete = nombres.trim().length > 0 && apellidos.trim().length > 0 && rolId !== null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* ── Header ── */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View
            style={{
              backgroundColor: colors.primary,
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              shadowColor: colors.primary,
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Ionicons name="person-add-outline" size={36} color="#fff" />
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.text,
              textAlign: "center",
              letterSpacing: -0.5,
              marginBottom: 8,
            }}
          >
            Completa tu perfil
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Ingresa tus datos para finalizar el registro
          </Text>

          {/* Badge del email */}
          {email ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 14,
                backgroundColor:
                  colorScheme === "dark" ? colors.backgroundSecondary : "#f0f9ff",
                borderColor: colors.primary,
                borderWidth: 1.5,
                borderRadius: 24,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Ionicons name="at-outline" size={14} color={colors.primary} />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}
                numberOfLines={1}
              >
                {email}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Formulario ── */}
        <View
          style={{
            backgroundColor:
              colorScheme === "dark" ? colors.backgroundSecondary : "#f9fafb",
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Nombres */}
          <View style={{ marginBottom: 20 }}>
            <FormLabel label="Nombres" required />
            <FormInput
              placeholder="Ej. Juan Carlos"
              value={nombres}
              onChangeText={setNombres}
              icon="person-outline"
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Apellidos */}
          <View style={{ marginBottom: 20 }}>
            <FormLabel label="Apellidos" required />
            <FormInput
              placeholder="Ej. García López"
              value={apellidos}
              onChangeText={setApellidos}
              icon="people-outline"
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Selector de Rol */}
          <View>
            <FormLabel label="Rol" required helperText="Selecciona el rol que mejor describe tu función" />
            <View style={{ gap: 10 }}>
              {ROLES.map((rol) => {
                const selected = rolId === rol.id;
                return (
                  <TouchableOpacity
                    key={rol.id}
                    onPress={() => setRolId(rol.id)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: selected
                        ? colorScheme === "dark"
                          ? `${colors.primary}22`
                          : "#e0f2fe"
                        : colors.input,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.primary : colors.inputBorder,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    {/* Ícono del rol */}
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: selected ? colors.primary : colors.inputBorder,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={rol.icon} size={18} color="#fff" />
                    </View>

                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: selected ? "700" : "500",
                        color: selected ? colors.primary : colors.text,
                      }}
                    >
                      {rol.label}
                    </Text>

                    {selected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Botón guardar ── */}
        <PrimaryButton
          title="Guardar y continuar"
          loading={loading}
          disabled={loading || !isComplete}
          onPress={handleSave}
          icon={
            !loading && isComplete ? (
              <Ionicons name="arrow-forward-circle-outline" size={20} color="white" />
            ) : undefined
          }
        />

        {/* ── Indicador de progreso ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginTop: 28,
          }}
        >
          {["Cuenta", "Verificación", "Perfil"].map((step, i) => {
            const active = i === 2;
            const done = i < 2;
            return (
              <React.Fragment key={step}>
                <View style={{ alignItems: "center", gap: 4 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: done || active ? colors.primary : colors.inputBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: active ? "#fff" : colors.textSecondary,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {step}
                  </Text>
                </View>
                {i < 2 && (
                  <View
                    style={{
                      width: 32,
                      height: 2,
                      backgroundColor: done ? colors.primary : colors.inputBorder,
                      borderRadius: 1,
                      marginBottom: 14,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};
