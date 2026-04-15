/**
 * HomeScreen — Pantalla principal tras inicio de sesión exitoso
 * Diseño basado en el mockup de referencia:
 * - Saludo personalizado con nombre del usuario
 * - Buscador
 * - Próxima Sesión
 * - Acciones Rápidas
 * - Búsquedas Recientes
 * - Bottom Tab Bar
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getUsuario, UsuarioData } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tipos de datos de ejemplo ────────────────────────────────────────────────
interface ProximaSesion {
  nombre: string;
  hora: string;
  grado: string;
}

interface BusquedaReciente {
  id: string;
  nombre: string;
  proximaSesion: string;
  estado: "Confirmada" | "Revisión Pendiente" | "Cancelada";
}

// ─── Datos de ejemplo (se reemplazarán con datos reales de la BD) ─────────────
const PROXIMA_SESION: ProximaSesion = {
  nombre: "Alan Carrillo",
  hora: "Hoy, 10:00 AM",
  grado: "Grado 3B",
};

const BUSQUEDAS_RECIENTES: BusquedaReciente[] = [
  {
    id: "1",
    nombre: "Mario Cervantes",
    proximaSesion: "Siguiente sesion: 10/03/26",
    estado: "Revisión Pendiente",
  },
  {
    id: "2",
    nombre: "Sofia Martinez",
    proximaSesion: "Siguiente sesion: 09/03/26",
    estado: "Confirmada",
  },
];

// ─── Colores de estado ────────────────────────────────────────────────────────
function getEstadoColor(estado: BusquedaReciente["estado"], colors: typeof Colors.light) {
  switch (estado) {
    case "Confirmada":
      return colors.success;
    case "Revisión Pendiente":
      return colors.warning;
    case "Cancelada":
      return colors.error;
    default:
      return colors.textSecondary;
  }
}

function getEstadoIcon(estado: BusquedaReciente["estado"]) {
  switch (estado) {
    case "Confirmada":
      return "checkmark-circle";
    case "Revisión Pendiente":
      return "star";
    case "Cancelada":
      return "close-circle";
    default:
      return "ellipse";
  }
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { name: "Inicio", icon: "home" as const, active: true },
  { name: "Agenda", icon: "calendar-outline" as const, active: false },
  { name: "", icon: "add" as const, active: false, isFab: true },
  { name: "Reportes", icon: "document-text-outline" as const, active: false },
  { name: "Perfil", icon: "person-outline" as const, active: false },
];

// ─── Componente Principal ─────────────────────────────────────────────────────
export function HomeScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];

  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Animaciones de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getCurrentSession();
        if (!session) {
          router.replace("/");
          return;
        }
        const user = await getUsuario(session.user.id);
        setUserData(user);
      } catch (e) {
        console.error("Error fetching user:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  const nombreCompleto = userData
    ? `${userData.nombres} ${userData.apellidos}`
    : "Usuario";

  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Contenido principal scrolleable ── */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* ── Encabezado / Saludo ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.welcomeSmall, { color: colors.textSecondary }]}>
              Bienvenida de nuevo,
            </Text>
            <Text style={[styles.welcomeName, { color: colors.text }]}>
              {nombreCompleto}
            </Text>
          </View>
          {/* Avatar */}
          <View style={[
            styles.avatarCircle,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8",
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }
          ]}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        </View>

        {/* ── Buscador ── */}
        <View style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : "#f5f7fa",
            shadowColor: "#000",
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }
        ]}>
          <Ionicons name="search-outline" size={17} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar alumnos, bitácoras, casos..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* ── Próxima Sesión ── */}
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.15 : 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }
        ]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Próxima Sesión</Text>
            <Ionicons name="calendar-outline" size={17} color={colors.textSecondary} />
          </View>

          <View style={[
            styles.sessionCard,
            {
              backgroundColor: isDark ? "#ffffff08" : "#f8fafc",
              borderRadius: 14,
            }
          ]}>
            {/* Avatar del alumno */}
            <View style={[
              styles.studentAvatar,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#e9eef5" }
            ]}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={[styles.studentName, { color: colors.text }]}>
                {PROXIMA_SESION.nombre}
              </Text>
              <Text style={[styles.verPerfil, { color: colors.primary }]}>
                Ver Perfil Completo
              </Text>
            </View>
          </View>

          <View style={styles.sessionMeta}>
            <View style={styles.sessionMetaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>
                {" "}{PROXIMA_SESION.hora}
              </Text>
            </View>
            <View style={styles.sessionMetaItem}>
              <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>
                {" "}{PROXIMA_SESION.grado}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Acciones Rápidas ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones Rápidas</Text>
        <View style={styles.accionesRow}>
          {[
            { label: "Nueva Bitácora", icon: "newspaper-outline" as const, bg: isDark ? "#1e2d3d" : "#eff6ff", color: "#3b82f6" },
            { label: "Expedientes", icon: "person-add-outline" as const, bg: isDark ? "#2d1e1e" : "#fff1f2", color: "#ef4444" },
            { label: "Alumnos", icon: "people-outline" as const, bg: isDark ? "#251e2d" : "#f5f3ff", color: "#8b5cf6" },
          ].map((accion) => (
            <TouchableOpacity
              key={accion.label}
              style={[
                styles.accionItem,
                {
                  backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                  shadowColor: "#000",
                  shadowOpacity: isDark ? 0.1 : 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.accionIconCircle, { backgroundColor: accion.bg }]}>
                <Ionicons name={accion.icon} size={21} color={accion.color} />
              </View>
              <Text style={[styles.accionLabel, { color: colors.textSecondary }]}>
                {accion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Búsquedas Recientes ── */}
        <View style={styles.recentesHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Búsquedas Recientes
          </Text>
          <TouchableOpacity>
            <Text style={[styles.verTodo, { color: colors.primary }]}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {BUSQUEDAS_RECIENTES.map((item) => {
          const estadoColor = getEstadoColor(item.estado, colors);
          const estadoIcon = getEstadoIcon(item.estado);
          return (
            <View
              key={item.id}
              style={[
                styles.recenteCard,
                {
                  backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                  shadowColor: "#000",
                  shadowOpacity: isDark ? 0.12 : 0.05,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }
              ]}
            >
              <View style={styles.recenteInfo}>
                <Text style={[styles.recenteName, { color: colors.text }]}>{item.nombre}</Text>
                <Text style={[styles.recenteMeta, { color: colors.textSecondary }]}>
                  {item.proximaSesion}
                </Text>
                <View style={styles.estadoRow}>
                  <Ionicons name={estadoIcon as any} size={12} color={estadoColor} />
                  <Text style={[styles.estadoText, { color: estadoColor }]}>
                    {" "}{item.estado}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.verBtn,
                  { backgroundColor: isDark ? "#ffffff10" : "#f5f7fa" }
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.verBtnText, { color: colors.text }]}>Ver</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Espacio al final para el tab bar */}
        <View style={{ height: 90 }} />
      </Animated.ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? colors.background : "#fffc",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.25 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        }
      ]}>
        {TAB_ITEMS.map((tab) => {
          if (tab.isFab) {
            return (
              <TouchableOpacity key="fab" style={styles.fabContainer} activeOpacity={0.85}>
                <View style={[
                  styles.fab,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                  }
                ]}>
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={tab.name} style={styles.tabItem} activeOpacity={0.7}>
              <Ionicons
                name={tab.active ? (tab.icon === "home" ? "home" : tab.icon) : tab.icon}
                size={22}
                color={tab.active ? colors.primary : colors.tabIconDefault}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab.active ? colors.primary : colors.tabIconDefault },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  welcomeSmall: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  welcomeName: {
    fontSize: 23,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  // Buscador — sin borde, fondo suave
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 22,
  },
  searchIcon: {
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  // Tarjeta genérica — sin borde, usa sombra sutil
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Próxima sesión
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    marginBottom: 14,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
  },
  verPerfil: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },
  sessionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  sessionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionMetaText: {
    fontSize: 12,
  },

  // Acciones Rápidas
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  accionesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
    gap: 10,
  },
  accionItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 16,
    gap: 9,
  },
  accionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  accionLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  // Búsquedas Recientes
  recentesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  verTodo: {
    fontSize: 13,
    fontWeight: "600",
  },
  recenteCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  recenteInfo: {
    flex: 1,
  },
  recenteName: {
    fontSize: 15,
    fontWeight: "600",
  },
  recenteMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  estadoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  verBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  verBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Bottom Tab Bar — glassmorphism sutil, sin línea superior
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingBottom: 22,
    paddingTop: 10,
    alignItems: "flex-end",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  fabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
});
