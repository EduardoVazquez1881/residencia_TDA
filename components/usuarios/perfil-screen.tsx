import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession, logout } from "@/services/auth.service";
import { getMisCasos, ListaCasoData } from "@/services/casos.service";
import { getUsuario, UsuarioData } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoleLabel(roleId: number): string {
  switch (roleId) {
    case 1: return "Director";
    case 2: return "Terapeuta";
    case 3: return "Sombra";
    case 4: return "Tutor";
    default: return "Colaborador";
  }
}

function getRoleIcon(roleId: number): any {
  switch (roleId) {
    case 2: return "medkit-outline";
    case 3: return "person-outline";
    case 4: return "school-outline";
    default: return "person-circle-outline";
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PerfilScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [casos, setCasos] = useState<ListaCasoData[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchData = async () => {
    try {
      const session = await getCurrentSession();
      if (!session) {
        router.replace("/");
        return;
      }
      const uid = session.user.id;
      
      const [user, casesList, alumnosList] = await Promise.all([
        getUsuario(uid),
        getMisCasos(uid),
        getAlumnos(uid),
      ]);

      setUserData(user);
      setCasos(casesList);
      setAlumnos(alumnosList);
    } catch (e) {
      console.error("Error fetching profile data:", e);
    }
  };

  useEffect(() => {
    fetchData().finally(() => {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nombreCompleto = userData 
    ? `${userData.nombres || ""} ${userData.apellidos || ""}`.trim() || "Usuario"
    : "Usuario";

  const iniciales = (
    (userData?.nombres?.[0] || "") + 
    (userData?.apellidos?.[0] || "")
  ).toUpperCase() || "U";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: "Mi Perfil",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: "700" }
      }} />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header: Avatar & Info ── */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{iniciales}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{nombreCompleto}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name={getRoleIcon(userData?.rol_id || 0)} size={14} color={colors.primary} />
            <Text style={[styles.roleLabel, { color: colors.primary }]}>{getRoleLabel(userData?.rol_id || 0)}</Text>
          </View>
        </View>

        {/* ── Info Personal ── */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Información Personal</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{userData?.correo || "No disponible"}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Perfil Verificado</Text>
          </View>
        </View>

        {/* ── Estadísticas rápidas ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.primary + "10" }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{casos.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Casos Activos</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#8b5cf610" }]}>
            <Text style={[styles.statNum, { color: "#8b5cf6" }]}>{alumnos.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Alumnos Totales</Text>
          </View>
        </View>

        {/* ── Casos Asignados ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Casos Asignados</Text>
          <TouchableOpacity onPress={() => router.push("/expedientes" as any)}>
            <Text style={[styles.verTodo, { color: colors.primary }]}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {casos.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#f8fafc" }]}>
            <Text style={{ color: colors.textSecondary }}>No tienes casos asignados todavía.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {casos.map((caso) => (
              <TouchableOpacity 
                key={caso.caso_id} 
                activeOpacity={0.8}
                style={[styles.smallCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}
                onPress={() => router.push(`/caso/${caso.caso_id}` as any)}
              >
                <View style={[styles.smallCardIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.smallCardName, { color: colors.text }]} numberOfLines={1}>{caso.alumnos?.pseudonimo || "Sin Nombre"}</Text>
                <Text style={[styles.smallCardRole, { color: colors.textSecondary }]}>{caso.estado}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Mis Alumnos ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis Alumnos</Text>
          <TouchableOpacity onPress={() => router.push("/alumnos" as any)}>
            <Text style={[styles.verTodo, { color: colors.primary }]}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", padding: 12 }]}>
          {alumnos.slice(0, 3).map((alumno, idx) => (
            <View key={alumno.alumno_id} style={[styles.alumnoRow, idx < 2 && styles.borderBottom]}>
              <View style={[styles.miniAvatar, { backgroundColor: colors.primary + "15" }]}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {(alumno.pseudonimo?.[0] || "?").toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.alumnoName, { color: colors.text }]}>{alumno.pseudonimo}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          ))}
          {alumnos.length > 3 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>Y {alumnos.length - 3} alumnos más...</Text>
          )}
          {alumnos.length === 0 && (
              <Text style={{ padding: 10, color: colors.textSecondary, textAlign: 'center' }}>No has registrado alumnos.</Text>
          )}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  
  profileHeader: { alignItems: "center", marginBottom: 30 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 15, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  avatarText: { fontSize: 32, fontWeight: "800" },
  name: { fontSize: 24, fontWeight: "800", marginBottom: 6, letterSpacing: -0.5 },
  roleBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  roleLabel: { fontSize: 13, fontWeight: "700" },

  card: { borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 15 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  infoText: { fontSize: 14, fontWeight: "500" },

  statsRow: { flexDirection: "row", gap: 15, marginBottom: 25 },
  statBox: { flex: 1, padding: 20, borderRadius: 24, alignItems: "center", gap: 4 },
  statNum: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  verTodo: { fontSize: 14, fontWeight: "600" },

  horizontalScroll: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 25 },
  smallCard: { width: 140, padding: 15, borderRadius: 20, marginRight: 15, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  smallCardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  smallCardName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  smallCardRole: { fontSize: 11, fontWeight: "500" },

  emptyCard: { padding: 30, borderRadius: 24, alignItems: "center", marginBottom: 25 },

  alumnoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  alumnoName: { flex: 1, fontSize: 15, fontWeight: "600" },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#00000008" },
  moreText: { fontSize: 12, textAlign: "center", marginTop: 8, fontStyle: "italic" },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, padding: 15 },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" }
});
