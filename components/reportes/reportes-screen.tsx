import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getHistorialBitacoras, HistorialBitacoraData } from "@/services/bitacoras.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function ReportesScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [historial, setHistorial] = useState<HistorialBitacoraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchHistorial = async () => {
    try {
      const session = await getCurrentSession();
      if (!session) return;
      const data = await getHistorialBitacoras(session.user.id);
      setHistorial(data);
    } catch (e) {
      console.error("Error fetching bitacoras history:", e);
    }
  };

  useEffect(() => {
    fetchHistorial().finally(() => {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistorial();
    setRefreshing(false);
  };

  const renderBitacoraItem = ({ item }: { item: HistorialBitacoraData }) => {
    const pseudonimo = item.casos?.alumnos?.pseudonimo || "Alumno";
    const plantilla = item.plantillas?.nombre || "Sin plantilla";
    const fechaPretty = new Date(item.fecha + "T00:00:00").toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: "/nueva-bitacora",
          params: { casoId: item.caso_id, plantillaId: item.plantilla_id, editId: item.bitacora_id }
        })}
        style={[
          styles.itemCard,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.2 : 0.05,
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: item.estado === "completado" ? "#10b98120" : "#f59e0b20" }]}>
            <View style={[styles.statusDot, { backgroundColor: item.estado === "completado" ? "#10b981" : "#f59e0b" }]} />
            <Text style={[styles.statusText, { color: item.estado === "completado" ? "#10b981" : "#f59e0b" }]}>
              {item.estado.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{fechaPretty}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.alumnoIcon, { backgroundColor: colors.primary + "15" }]}>
            <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 16 }}>{pseudonimo[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alumnoName, { color: colors.text }]}>{pseudonimo}</Text>
            <View style={styles.plantillaRow}>
              <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.plantillaName, { color: colors.textSecondary }]} numberOfLines={1}>{plantilla}</Text>
            </View>
          </View>
          <View style={styles.editBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
          <View style={styles.footerItem}>
             <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
             <Text style={[styles.footerText, { color: colors.textSecondary }]}>
               {item.hora_entrada?.slice(0, 5) || "--:--"} - {item.hora_salida?.slice(0, 5) || "--:--"}
             </Text>
          </View>
          <View style={[styles.btnModificar, { backgroundColor: colors.primary + "15" }]}>
             <Ionicons name="pencil-outline" size={14} color={colors.primary} />
             <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>Modificar</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reportes / Historial</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={historial}
          keyExtractor={(item) => item.bitacora_id.toString()}
          contentContainerStyle={[styles.listContent, historial.length === 0 && styles.centerContainerList]}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="reader-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin bitácoras registradas</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Todas tus informaciones de sesiones aparecerán aquí para que las consultes o modifiques.
              </Text>
              <TouchableOpacity 
                style={[styles.btnCrear, { backgroundColor: colors.primary }]}
                onPress={() => router.navigate("/seleccion-bitacora" as any)}
              >
                 <Text style={{ color: "#fff", fontWeight: "700" }}>Registrar mi primera sesión</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderBitacoraItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerContainerList: { flexGrow: 1, justifyContent: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  itemCard: { borderRadius: 18, padding: 16, marginBottom: 16, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  dateText: { fontSize: 12, fontWeight: "600" },

  cardBody: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  alumnoIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 12 },
  alumnoName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  plantillaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  plantillaName: { fontSize: 12, fontWeight: "500" },
  editBtn: { padding: 4 },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 12 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12, fontWeight: "600" },
  btnModificar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },

  emptyState: { alignItems: "center", justifyContent: "center", padding: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  btnCrear: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }
});
