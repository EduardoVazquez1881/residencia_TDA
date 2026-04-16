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
  const isDark = colorScheme === "dark";
  const { email } = useLocalSearchParams<{ email: string }>();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rolId, setRolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSave = async () => {
    if (!nombres.trim() || !apellidos.trim() || !rolId) {
      Alert.alert("Campos incompletos", "Por favor completa toda la información para continuar.");
      return;
    }

    setLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        Alert.alert("Error", "No hay una sesión activa. Intenta entrar de nuevo.");
        return;
      }

      const result = await upsertUsuario({
        usuario_id: session.user.id,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        rol_id: rolId,
        correo: email || session.user.email,
      });

      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        router.replace("/prueba");
      }
    } catch {
      Alert.alert("Error", "No se pudieron guardar los datos.");
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
          paddingHorizontal: 28,
          paddingTop: 80,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* HEADER MINIMALISTA */}
        <View style={{ marginBottom: 40 }}>
           <Text style={{ fontSize: 32, fontWeight: "800", color: colors.text, letterSpacing: -1 }}>
             Hola,
           </Text>
           <Text style={{ fontSize: 18, color: colors.textSecondary, marginTop: 4, fontWeight: "500" }}>
             Cuentanos un poco sobre ti
           </Text>
           
           {email && (
             <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, opacity: 0.8 }}>
               <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
               <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 6, fontWeight: "600" }}>{email}</Text>
             </View>
           )}
        </View>

        {/* INPUTS DE TEXTO */}
        <View style={{ gap: 24, marginBottom: 32 }}>
          <View>
            <FormLabel label="Nombres" />
            <FormInput
              placeholder="Ej. Sofia"
              value={nombres}
              onChangeText={setNombres}
              icon="person-outline"
              autoCapitalize="words"
            />
          </View>

          <View>
            <FormLabel label="Apellidos" />
            <FormInput
              placeholder="Ej. Valenzuela"
              value={apellidos}
              onChangeText={setApellidos}
              icon="people-outline"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* SELECTOR DE ROL MINIMALISTA */}
        <View style={{ marginBottom: 40 }}>
          <FormLabel label="Selecciona tu función" helperText="Esto define tus permisos en el sistema" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
            {ROLES.map((rol) => {
              const selected = rolId === rol.id;
              return (
                <TouchableOpacity
                  key={rol.id}
                  onPress={() => setRolId(rol.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: selected ? colors.primary : (isDark ? "#ffffff08" : "#f1f5f9"),
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.primary : "transparent",
                  }}
                >
                  <Ionicons name={rol.icon} size={18} color={selected ? "#fff" : colors.textSecondary} />
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: "700", 
                    color: selected ? "#fff" : colors.text 
                  }}>
                    {rol.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <PrimaryButton
          title="Completar Perfil"
          loading={loading}
          disabled={!isComplete}
          onPress={handleSave}
        />

        {/* INDICADOR DE PASOS MAS FINO */}
        <View style={{ 
          flexDirection: "row", 
          justifyContent: "center", 
          alignItems: "center", 
          marginTop: 40,
          opacity: 0.6
        }}>
          {[1, 2, 3].map((step, i) => (
            <React.Fragment key={step}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: i === 2 ? colors.primary : (i < 2 ? colors.primary : colors.border),
                alignItems: "center",
                justifyContent: "center"
              }}>
                {i < 2 ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={{ color: i === 2 ? "#fff" : colors.textSecondary, fontSize: 11, fontWeight: "bold" }}>{step}</Text>
                )}
              </View>
              {i < 2 && (
                <View style={{ 
                  width: 30, 
                  height: 1.5, 
                  backgroundColor: colors.primary, 
                  marginHorizontal: 4 
                }} />
              )}
            </React.Fragment>
          ))}
        </View>

      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};
