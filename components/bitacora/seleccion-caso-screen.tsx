import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getCasosListosParaBitacora } from "@/services/bitacoras.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function SeleccionCasoScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      
      const load = async () => {
        const session = await getCurrentSession();
        if (session && active) {
          const res = await getCasosListosParaBitacora(session.user.id);
          setCasos(res);
        }
        if (active) {
          setLoading(false);
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
        }
      };

      load();
      return () => { active = false; };
    }, [fadeAnim, slideAnim])
  );

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Seleccionar Caso</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          ¿Para qué estudiante deseas llenar una bitácora hoy?
        </Text>

        {loading ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 15, color: colors.textSecondary }}>Buscando expedientes elegibles...</Text>
          </View>
        ) : casos.length === 0 ? (
          <View style={[styles.emptyBox, cardStyle]}>
            <Ionicons name="folder-open-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin casos configurados</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              No estás participando en ningún caso activo o los casos en los que participas aún no tienen una Plantilla asociada.
            </Text>
          </View>
        ) : (
          casos.map((caso) => {
            const pseudonimo = caso.alumnos?.pseudonimo || "Desconocido";
            const inicial = pseudonimo.charAt(0).toUpperCase();

            return (
              <TouchableOpacity
                key={caso.caso_id}
                style={[styles.casoCard, cardStyle]}
                onPress={() => router.push(`/nueva-bitacora?casoId=${caso.caso_id}&plantillaId=${caso.plantilla_id}` as any)}
              >
                <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{inicial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.casoName, { color: colors.text }]}>{pseudonimo}</Text>
                  <Text style={[styles.casoDesc, { color: colors.textSecondary }]}>
                    Plantilla Asignada ID: {caso.plantilla_id}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24, paddingHorizontal: 4 },
  
  emptyBox: { padding: 30, borderRadius: 20, alignItems: "center", marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  casoCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 18, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 15 },
  avatarText: { fontSize: 18, fontWeight: "bold" },
  casoName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  casoDesc: { fontSize: 13 },
});
