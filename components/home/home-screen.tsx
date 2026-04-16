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
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import { getUsuario, UsuarioData } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Helpers nivel TEA ────────────────────────────────────────────────────────
function getNivelTeaColor(nivel: number | null | undefined): string {
  switch (nivel) {
    case 1:
      return "#10b981";
    case 2:
      return "#f59e0b";
    case 3:
      return "#ef4444";
    default:
      return "#9ca3af";
  }
}

function getNivelTeaBg(
  nivel: number | null | undefined,
  isDark: boolean,
): string {
  switch (nivel) {
    case 1:
      return isDark ? "#1a2e27" : "#ecfdf5";
    case 2:
      return isDark ? "#2e2010" : "#fffbeb";
    case 3:
      return isDark ? "#2e1515" : "#fef2f2";
    default:
      return isDark ? "#1f2937" : "#f3f4f6";
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
  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Animaciones de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const fetchData = async () => {
    try {
      const session = await getCurrentSession();
      if (!session) {
        router.replace("/");
        return;
      }
      const [user, alumnosList] = await Promise.all([
        getUsuario(session.user.id),
        getAlumnos(session.user.id),
      ]);
      setUserData(user);
      setAlumnos(alumnosList);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
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

  // Alumnos filtrados por búsqueda (pseudónimo, case-insensitive)
  const alumnosFiltrados = searchText.trim()
    ? alumnos.filter((a) =>
        a.pseudonimo.toLowerCase().includes(searchText.toLowerCase().trim()),
      )
    : alumnos;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Contenido principal scrolleable ── */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Encabezado / Saludo ── */}
        <View style={styles.headerRow}>
          <View>
            <Text
              style={[styles.welcomeSmall, { color: colors.textSecondary }]}
            >
              Bienvenida de nuevo,
            </Text>
            <Text style={[styles.welcomeName, { color: colors.text }]}>
              {nombreCompleto}
            </Text>
          </View>
          {/* Avatar */}
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isDark
                  ? colors.backgroundSecondary
                  : "#f0f4f8",
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
          >
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        </View>

        {/* ── Buscador ── */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : "#f5f7fa",
              shadowColor: "#000",
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={17}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar alumno por pseudónimo..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* ── Resumen de Mis Alumnos ── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
              shadowColor: "#000",
              shadowOpacity: isDark ? 0.15 : 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            },
          ]}
        >
          {/* Encabezado */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Mis Alumnos
            </Text>
            <Ionicons
              name="people-outline"
              size={17}
              color={colors.textSecondary}
            />
          </View>

          {alumnos.length === 0 ? (
            /* Sin alumnos — CTA */
            <TouchableOpacity
              onPress={() => router.push("/alumnos" as any)}
              activeOpacity={0.8}
              style={[
                styles.summaryEmptyRow,
                {
                  backgroundColor: isDark ? "#ffffff08" : "#f8fafc",
                  borderRadius: 14,
                },
              ]}
            >
              <View
                style={[
                  styles.summaryEmptyIcon,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Ionicons
                  name="person-add-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.summaryEmptyTitle, { color: colors.text }]}
                >
                  Aún no hay alumnos
                </Text>
                <Text
                  style={[
                    styles.summaryEmptyDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  Toca aquí para registrar tu primer alumno
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            <>
              {/* Contador + desglose TEA */}
              <View style={styles.summaryRow}>
                {/* Total */}
                <View
                  style={[
                    styles.summaryTotalBox,
                    { backgroundColor: isDark ? "#ffffff08" : "#f0f7ff" },
                  ]}
                >
                  <Text
                    style={[styles.summaryTotalNum, { color: colors.primary }]}
                  >
                    {alumnos.length}
                  </Text>
                  <Text
                    style={[
                      styles.summaryTotalLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {alumnos.length === 1 ? "alumno" : "alumnos"}
                    {"\n"}activos
                  </Text>
                </View>

                {/* Desglose por nivel TEA */}
                <View style={styles.summaryLevels}>
                  {[1, 2, 3].map((n) => {
                    const count = alumnos.filter(
                      (a) => a.nivel_tea === n,
                    ).length;
                    const color = getNivelTeaColor(n);
                    const bg = getNivelTeaBg(n, isDark);
                    return (
                      <View
                        key={n}
                        style={[
                          styles.summaryLevelRow,
                          { backgroundColor: bg, borderRadius: 10 },
                        ]}
                      >
                        <View
                          style={[styles.nivelDot, { backgroundColor: color }]}
                        />
                        <Text
                          style={[
                            styles.summaryLevelLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Nivel {n}
                        </Text>
                        <Text style={[styles.summaryLevelCount, { color }]}>
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Último alumno registrado */}
              {alumnos[0] && (
                <View
                  style={[
                    styles.lastAlumnoRow,
                    {
                      borderTopColor: isDark ? "#ffffff10" : "#f0f0f0",
                      borderTopWidth: 1,
                      marginTop: 14,
                      paddingTop: 14,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.alumnoAvatar,
                      {
                        backgroundColor: `${colors.primary}1a`,
                        marginRight: 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.alumnoInicial,
                        { color: colors.primary, fontSize: 15 },
                      ]}
                    >
                      {alumnos[0].pseudonimo.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        {
                          fontSize: 11,
                          color: colors.textSecondary,
                          marginBottom: 1,
                        },
                      ]}
                    >
                      Último registrado
                    </Text>
                    <Text
                      style={[
                        { fontSize: 14, fontWeight: "700", color: colors.text },
                      ]}
                    >
                      {alumnos[0].pseudonimo}
                    </Text>
                  </View>
                  {alumnos[0].nivel_tea ? (
                    <View
                      style={[
                        styles.nivelPill,
                        {
                          backgroundColor: getNivelTeaBg(
                            alumnos[0].nivel_tea,
                            isDark,
                          ),
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.nivelDot,
                          {
                            backgroundColor: getNivelTeaColor(
                              alumnos[0].nivel_tea,
                            ),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.estadoText,
                          { color: getNivelTeaColor(alumnos[0].nivel_tea) },
                        ]}
                      >
                        N{alumnos[0].nivel_tea}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Acciones Rápidas ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Acciones Rápidas
        </Text>
        <View style={styles.accionesRow}>
          {[
            {
              label: "Plantillas",
              icon: "document-text-outline" as const,
              bg: isDark ? "#1e2d3d" : "#e0f2fe",
              color: "#0284c7",
              onPress: () => router.push("/seleccion-bitacora" as any),
            },
            {
              label: "Expedientes",
              icon: "folder-open-outline" as const,
              bg: isDark ? "#2d1e1e" : "#fff1f2",
              color: "#ef4444",
              onPress: () => router.push("/expedientes" as any),
            },
            {
              label: "Alumnos",
              icon: "people-outline" as const,
              bg: isDark ? "#251e2d" : "#f5f3ff",
              color: "#8b5cf6",
              onPress: () => router.push("/alumnos" as any),
            },
          ].map((accion) => (
            <TouchableOpacity
              key={accion.label}
              onPress={accion.onPress}
              style={[
                styles.accionItem,
                {
                  backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                  shadowColor: "#000",
                  shadowOpacity: isDark ? 0.1 : 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.accionIconCircle,
                  { backgroundColor: accion.bg },
                ]}
              >
                <Ionicons name={accion.icon} size={21} color={accion.color} />
              </View>
              <Text
                style={[styles.accionLabel, { color: colors.textSecondary }]}
              >
                {accion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Alumnos Recientes ── */}
        <View style={styles.recentesHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginBottom: 0 },
            ]}
          >
            {searchText.trim() ? "Resultados" : "Alumnos Recientes"}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.verTodo, { color: colors.primary }]}>
              Ver todo
            </Text>
          </TouchableOpacity>
        </View>

        {alumnosFiltrados.length === 0 ? (
          /* ── Estado vacío ── */
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.1 : 0.04,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
          >
            <Ionicons
              name={searchText.trim() ? "search-outline" : "people-outline"}
              size={38}
              color={colors.textSecondary}
              style={{ opacity: 0.4, marginBottom: 12 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchText.trim() ? "Sin resultados" : "Sin alumnos aún"}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {searchText.trim()
                ? `No se encontró ningún alumno con "${searchText}"`
                : "Registra tu primer alumno desde Expedientes"}
            </Text>
          </View>
        ) : (
          alumnosFiltrados.map((alumno) => {
            const inicial = alumno.pseudonimo.charAt(0).toUpperCase();
            const nivelColor = getNivelTeaColor(alumno.nivel_tea);
            const nivelBg = getNivelTeaBg(alumno.nivel_tea, isDark);
            const escuelaMeta = [
              alumno.escuela_actual,
              [alumno.grado_escolar, alumno.grupo_escolar]
                .filter(Boolean)
                .join(" - "),
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <View
                key={alumno.alumno_id}
                style={[
                  styles.recenteCard,
                  {
                    backgroundColor: isDark
                      ? colors.backgroundSecondary
                      : "#fff",
                    shadowColor: "#000",
                    shadowOpacity: isDark ? 0.12 : 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  },
                ]}
              >
                {/* Avatar con inicial */}
                <View
                  style={[
                    styles.alumnoAvatar,
                    { backgroundColor: `${colors.primary}1a` },
                  ]}
                >
                  <Text
                    style={[styles.alumnoInicial, { color: colors.primary }]}
                  >
                    {inicial}
                  </Text>
                </View>

                <View style={styles.recenteInfo}>
                  <Text style={[styles.recenteName, { color: colors.text }]}>
                    {alumno.pseudonimo}
                  </Text>
                  {escuelaMeta ? (
                    <Text
                      style={[
                        styles.recenteMeta,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {escuelaMeta}
                    </Text>
                  ) : null}
                  {alumno.nivel_tea ? (
                    <View style={styles.estadoRow}>
                      <View
                        style={[styles.nivelPill, { backgroundColor: nivelBg }]}
                      >
                        <View
                          style={[
                            styles.nivelDot,
                            { backgroundColor: nivelColor },
                          ]}
                        />
                        <Text
                          style={[styles.estadoText, { color: nivelColor }]}
                        >
                          Nivel {alumno.nivel_tea} TEA
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.verBtn,
                    { backgroundColor: isDark ? "#ffffff10" : "#f5f7fa" },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.verBtnText, { color: colors.text }]}>
                    Ver
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Espacio al final para el tab bar */}
        <View style={{ height: 90 }} />
      </Animated.ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? colors.background : "#fffc",
            borderTopWidth: 0,
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.25 : 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 10,
          },
        ]}
      >
        {TAB_ITEMS.map((tab) => {
          if (tab.isFab) {
            return (
              <TouchableOpacity
                key="fab"
                style={styles.fabContainer}
                activeOpacity={0.85}
                onPress={() => router.push("/seleccion-caso" as any)}
              >
                <View
                  style={[
                    styles.fab,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.35,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 8,
                    },
                  ]}
                >
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (tab.name === "Perfil") router.push("/perfil" as any);
                else if (tab.name === "Reportes") router.push("/reportes" as any);
                else if (tab.name === "Agenda") Alert.alert("Próximamente", "La agenda estará disponible muy pronto.");
              }}
            >
              <Ionicons
                name={tab.active ? tab.icon.replace("-outline", "") : tab.icon}
                size={22}
                color={tab.active ? colors.primary : colors.tabIconDefault}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: tab.active ? colors.primary : colors.tabIconDefault,
                  },
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

  // ─ Card resumen Mis Alumnos ─
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  summaryTotalBox: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  summaryTotalNum: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 36,
  },
  summaryTotalLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 15,
  },
  summaryLevels: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  summaryLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  summaryLevelLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  summaryLevelCount: {
    fontSize: 13,
    fontWeight: "800",
  },
  lastAlumnoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  summaryEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryEmptyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  summaryEmptyDesc: {
    fontSize: 12,
    marginTop: 2,
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

  // Alumnos Recientes
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
    fontSize: 11,
    fontWeight: "600",
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

  // Avatar inicial alumno
  alumnoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alumnoInicial: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  // Pill nivel TEA
  nivelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  nivelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Estado vacío
  emptyState: {
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
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
