import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function AlumnosListScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUid, setCurrentUid] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchAlumnos = async () => {
    try {
      const session = await getCurrentSession();
      if (!session) return;
      setCurrentUid(session.user.id);
      
      const data = await getAlumnos(session.user.id);
      setAlumnos(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchAlumnos();
        if (isActive) {
          setLoading(false);
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
        }
      };
      load();
      return () => { isActive = false; };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlumnos();
    setRefreshing(false);
  };

  const getRoleBadge = (alumno: AlumnoData) => {
    if (alumno.creado_por === currentUid) {
      return { label: "Agregado por mí", color: "#8b5cf6", bg: "#8b5cf620" };
    }
    return { label: "Asignado", color: "#10b981", bg: "#10b98120" };
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Alumnos</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={alumnos}
          keyExtractor={(item) => item.alumno_id.toString()}
          contentContainerStyle={[styles.listContent, alumnos.length === 0 && styles.centerContainerList]}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="people-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin alumnos aún</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Crea tu primer alumno tocando el botón flotante.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const inicial = item.pseudonimo.charAt(0).toUpperCase();
            const badge = getRoleBadge(item);
            const fechaRegistrada = new Date(item.creado_en).toLocaleDateString();
            
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/alumno/${item.alumno_id}`)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                    shadowColor: "#000",
                    shadowOpacity: isDark ? 0.2 : 0.05,
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{inicial}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.alumnoName, { color: colors.text }]} numberOfLines={1}>
                      {item.pseudonimo}
                    </Text>
                    <Text style={[styles.alumnoDate, { color: colors.textSecondary }]}>
                      Registrado: {fechaRegistrada}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
                  <View style={styles.footerItem}>
                    <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.escuela_actual || "Sin escuela registrada"}
                    </Text>
                  </View>
                  {item.nivel_tea ? (
                     <View style={styles.footerItemRight}>
                       <Ionicons name="bar-chart-outline" size={14} color={colors.textSecondary} />
                       <Text style={[styles.footerText, { color: colors.textSecondary }]}>Nivel {item.nivel_tea}</Text>
                     </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Botón flotante para crear nuevo alumno */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          }
        ]}
        activeOpacity={0.8}
        onPress={() => router.push("/registro-alumno")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainerList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  alumnoName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  alumnoDate: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 2,
  },
  footerItemRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  }
});
