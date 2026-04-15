import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function SeleccionBitacoraScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.title, { color: colors.text }]}>Nueva Bitácora</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              ¿Cómo deseas crear la bitácora?
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          </View>
        </View>

        {/* ── Info chip ── */}
        <View
          style={[
            styles.infoChip,
            { backgroundColor: isDark ? "#1e2d3d" : "#eff6ff" },
          ]}
        >
          <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
          <Text style={[styles.infoChipText, { color: "#3b82f6" }]}>
            Una bitácora necesita una plantilla que defina su estructura
          </Text>
        </View>

        {/* ── Opción 1: Nueva Plantilla ── */}
        <TouchableOpacity
          style={[styles.optionCard, cardStyle]}
          activeOpacity={0.75}
          onPress={() => router.push("/nueva-plantilla" as any)}
        >
          <View style={[styles.optionIconBox, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="add-circle-outline" size={30} color={colors.primary} />
          </View>
          <View style={styles.optionTextBox}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Nueva Plantilla
            </Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              Crea un formato personalizado: define secciones, campos y tipos de respuesta
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* ── Opción 2: Plantilla existente (próximamente) ── */}
        <View style={[styles.optionCard, cardStyle, { opacity: 0.52 }]}>
          <View style={[styles.optionIconBox, { backgroundColor: "#8b5cf618" }]}>
            <Ionicons name="documents-outline" size={30} color="#8b5cf6" />
          </View>
          <View style={styles.optionTextBox}>
            <View style={styles.optionTitleRow}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Plantilla Existente
              </Text>
              <View style={[styles.soonBadge, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[styles.soonBadgeText, { color: colors.primary }]}>
                  Próximamente
                </Text>
              </View>
            </View>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              Selecciona una plantilla que ya hayas creado anteriormente
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  infoChipText: { fontSize: 12, fontWeight: "500", flex: 1, lineHeight: 17 },

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    gap: 16,
  },
  optionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTextBox: { flex: 1 },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  optionTitle: { fontSize: 16, fontWeight: "700" },
  optionDesc: { fontSize: 13, lineHeight: 18 },
  soonBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  soonBadgeText: { fontSize: 10, fontWeight: "700" },
});
