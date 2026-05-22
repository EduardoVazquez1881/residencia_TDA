import React, { useCallback, useState } from "react";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function AlumnosListScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState("");

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
        if (isActive) setLoading(false);
      };
      load();
      return () => { isActive = false; };
    }, [])
  );

  const getRoleBadge = (alumno: AlumnoData) => {
    if (alumno.creado_por === currentUid) {
      return { label: "Agregado por mí", color: "#8b5cf6", bg: "#8b5cf615" };
    }
    return { label: "Asignado", color: "#10b981", bg: "#10b98115" };
  };

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Alumnos</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Lista de alumnos bajo tu seguimiento
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/registro-alumno" as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6 }}>Nuevo Alumno</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : alumnos.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="people-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin alumnos aún</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Registra a tu primer alumno para comenzar el seguimiento.
          </Text>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
            onPress={() => router.push("/registro-alumno" as any)}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Registrar Alumno</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {alumnos.map((item) => {
            const inicial = item.pseudonimo.charAt(0).toUpperCase();
            const badge = getRoleBadge(item);
            const fechaRegistrada = new Date(item.creado_en).toLocaleDateString();
            
            return (
              <TouchableOpacity
                key={item.alumno_id}
                activeOpacity={0.7}
                onPress={() => router.push(`/alumno/${item.alumno_id}`)}
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

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.footerItem}>
                    <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.escuela_actual || "Sin escuela registrada"}
                    </Text>
                  </View>
                  {item.nivel_tea ? (
                     <View style={styles.footerItemRight}>
                       <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
                       <Text style={[styles.footerText, { color: colors.textSecondary }]}>Nivel {item.nivel_tea}</Text>
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
  alumnoName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  alumnoDate: {
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
    flex: 2,
  },
  footerItemRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
