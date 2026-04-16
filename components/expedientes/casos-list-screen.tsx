import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getMisCasos, ListaCasoData } from "@/services/casos.service";
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

export function CasosListScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [casos, setCasos] = useState<ListaCasoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUid, setCurrentUid] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchCasos = async () => {
    try {
      const session = await getCurrentSession();
      if (!session) return;
      setCurrentUid(session.user.id);
      
      const data = await getMisCasos(session.user.id);
      setCasos(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchCasos();
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
    await fetchCasos();
    setRefreshing(false);
  };

  const getRoleLabel = (caso: ListaCasoData) => {
    if (caso.usuario_id === currentUid || caso.creado_por === currentUid) {
      return "Creador";
    }
    // Si no es el creador, idealmente sacaríamos su rol de caso_participantes,
    // pero por ahora podemos mostrar simplemente "Participante"
    return "Participante";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()} // Vuelve a la pantalla anterior (Home)
          style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Expedientes</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={casos}
          keyExtractor={(item) => item.caso_id.toString()}
          contentContainerStyle={[styles.listContent, casos.length === 0 && styles.centerContainerList]}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="folder-open-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay casos activos</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Crea tu primer expediente o espera a que alguien te asigne a uno.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const inicial = item.alumnos?.pseudonimo?.charAt(0).toUpperCase() || "?";
            const role = getRoleLabel(item);
            
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/caso/${item.caso_id}`)}
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
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.casoName, { color: colors.text }]}>
                      {item.alumnos?.pseudonimo || "Alumno Desconocido"}
                    </Text>
                    <Text style={[styles.casoDate, { color: colors.textSecondary }]}>
                      Creado el: {item.fecha_asignacion || "N/A"}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: role === "Creador" ? "#8b5cf620" : "#10b98120" }]}>
                    <Text style={[styles.roleBadgeText, { color: role === "Creador" ? "#8b5cf6" : "#10b981" }]}>{role}</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
                  <View style={styles.footerItem}>
                    <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.plantillas?.nombre || "Sin plantilla asignada"}
                    </Text>
                  </View>
                  {item.alumnos?.nivel_tea ? (
                     <View style={styles.footerItem}>
                       <Ionicons name="bar-chart-outline" size={14} color={colors.textSecondary} />
                       <Text style={[styles.footerText, { color: colors.textSecondary }]}>Nivel {item.alumnos.nivel_tea}</Text>
                     </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Botón flotante para crear nuevo caso */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          }
        ]}
        activeOpacity={0.8}
        onPress={() => router.push("/crear-caso")}
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
    paddingBottom: 100, // Espacio para el fab
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
  casoName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  casoDate: {
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
