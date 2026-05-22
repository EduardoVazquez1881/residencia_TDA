import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function SeleccionBitacoraScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Módulo de Plantillas</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Modela la información de tus bitácoras de seguimiento
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {/* Opción 1: Nueva Plantilla */}
        <TouchableOpacity
          style={[styles.optionCard, cardStyle]}
          activeOpacity={0.7}
          onPress={() => router.push("/nueva-plantilla" as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Nueva Plantilla</Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              Crea un formato personalizado desde cero: define secciones, campos y tipos de respuesta.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Opción 2: Mis Plantillas */}
        <TouchableOpacity
          style={[styles.optionCard, cardStyle]}
          activeOpacity={0.7}
          onPress={() => router.push("/mis-plantillas" as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#8b5cf615" }]}>
            <Ionicons name="documents-outline" size={32} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Mis Plantillas</Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              Administra tus formatos existentes: visualiza, edita o elimina tus plantillas.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: isDark ? "#1e2d3d" : "#eff6ff" }]}>
        <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
        <Text style={[styles.infoText, { color: "#3b82f6" }]}>
          Las plantillas te permiten estandarizar la recolección de datos. Una vez creada una plantilla, puedes asignarla a uno o varios expedientes.
        </Text>
      </View>
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  grid: { gap: 24, maxWidth: 800 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    gap: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  optionDesc: { fontSize: 15, lineHeight: 22 },
  infoBox: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 16,
    maxWidth: 800,
  },
  infoText: { fontSize: 14, lineHeight: 20, fontWeight: '500', flex: 1 },
});
