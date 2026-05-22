import React, { useCallback, useState } from "react";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getMisCasos, ListaCasoData } from "@/services/casos.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function CasosListScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [casos, setCasos] = useState<ListaCasoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUid, setCurrentUid] = useState("");

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
        if (isActive) setLoading(false);
      };
      load();
      return () => { isActive = false; };
    }, [])
  );

  const getRoleLabel = (caso: ListaCasoData) => {
    if (caso.usuario_id === currentUid || caso.creado_por === currentUid) {
      return "Creador";
    }
    return "Participante";
  };

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Expedientes</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Gestiona los casos y asignaciones
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/crear-caso" as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6 }}>Nuevo Expediente</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : casos.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="folder-open-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay casos activos</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Crea tu primer expediente o espera a que alguien te asigne a uno.
          </Text>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
            onPress={() => router.push("/crear-caso" as any)}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Crear Expediente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {casos.map((item) => {
            const inicial = item.alumnos?.pseudonimo?.charAt(0).toUpperCase() || "?";
            const role = getRoleLabel(item);
            
            return (
              <TouchableOpacity
                key={item.caso_id}
                activeOpacity={0.7}
                onPress={() => router.push(`/caso/${item.caso_id}`)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                    borderColor: colors.border,
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
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
                  <View style={[styles.roleBadge, { backgroundColor: role === "Creador" ? "#8b5cf615" : "#10b98115" }]}>
                    <Text style={[styles.roleBadgeText, { color: role === "Creador" ? "#8b5cf6" : "#10b981" }]}>{role}</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.footerItem}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.plantillas?.nombre || "Sin plantilla asignada"}
                    </Text>
                  </View>
                  {item.alumnos?.nivel_tea ? (
                     <View style={styles.footerItem}>
                       <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
                       <Text style={[styles.footerText, { color: colors.textSecondary }]}>Nivel {item.alumnos.nivel_tea}</Text>
                     </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 48,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: 400,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  card: {
    width: 'calc(33.333% - 16px)' as any,
    minWidth: 300,
    maxWidth: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
  },
  casoName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  casoDate: {
    fontSize: 13,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
