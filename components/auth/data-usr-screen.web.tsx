import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { upsertUsuario } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebCenteredCard } from "@/components/ui/web/WebCenteredCard";

const ROLES = [
  { id: 2, label: "Terapeuta", icon: "medkit-outline" as const },
  { id: 3, label: "Sombra", icon: "person-outline" as const },
  { id: 4, label: "Tutor", icon: "school-outline" as const },
];

export const DataUsrScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";
  const { email } = useLocalSearchParams<{ email: string }>();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rolId, setRolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
    <WebCenteredCard maxWidth={600}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={{ marginBottom: 40, alignItems: "center" }}>
           <Text style={[styles.title, { color: colors.text }]}>
             Hola,
           </Text>
           <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
             Cuéntanos un poco sobre ti
           </Text>
           
           {email ? (
             <View style={styles.emailBadge}>
               <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
               <Text style={[styles.emailText, { color: colors.textSecondary }]}>{email}</Text>
             </View>
           ) : null}
        </View>

        {/* INPUTS DE TEXTO EN ROW PARA WEB */}
        <View style={styles.rowGrid}>
          <View style={styles.flexHalf}>
            <FormLabel label="Nombres" />
            <FormInput
              placeholder="Ej. Sofia"
              value={nombres}
              onChangeText={setNombres}
              icon="person-outline"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.flexHalf}>
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

        {/* SELECTOR DE ROL */}
        <View style={{ marginBottom: 40, marginTop: 24 }}>
          <FormLabel label="Selecciona tu función" helperText="Esto define tus permisos en el sistema" />
          <View style={styles.rolesGrid}>
            {ROLES.map((rol) => {
              const selected = rolId === rol.id;
              return (
                <TouchableOpacity
                  key={rol.id}
                  onPress={() => setRolId(rol.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: selected ? colors.primary : (isDark ? "#ffffff08" : "#f1f5f9"),
                      borderColor: selected ? colors.primary : "transparent",
                    }
                  ]}
                >
                  <Ionicons name={rol.icon} size={18} color={selected ? "#fff" : colors.textSecondary} />
                  <Text style={[styles.roleText, { color: selected ? "#fff" : colors.text }]}>
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

        {/* INDICADOR DE PASOS */}
        <View style={styles.stepsContainer}>
          {[1, 2, 3].map((step, i) => (
            <React.Fragment key={step}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: i === 2 ? colors.primary : (i < 2 ? colors.primary : colors.border) }
              ]}>
                {i < 2 ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[styles.stepText, { color: i === 2 ? "#fff" : colors.textSecondary }]}>{step}</Text>
                )}
              </View>
              {i < 2 && (
                <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
              )}
            </React.Fragment>
          ))}
        </View>

    </WebCenteredCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 4,
    fontWeight: "500",
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    opacity: 0.8,
  },
  emailText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  rowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  flexHalf: {
    flex: 1,
    minWidth: 200,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    opacity: 0.6,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  stepLine: {
    width: 30,
    height: 1.5,
    marginHorizontal: 4,
  },
});
