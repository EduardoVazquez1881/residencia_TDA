import React, { useEffect, useState } from "react";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import { getUsuario, UsuarioData } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

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

export function HomeScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

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


  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando dashboard...</Text>
      </View>
    );
  }

  const nombreCompleto = userData ? `${userData.nombres} ${userData.apellidos}` : "Usuario";

  const alumnosFiltrados = searchText.trim()
    ? alumnos.filter((a) =>
        a.pseudonimo.toLowerCase().includes(searchText.toLowerCase().trim()),
      )
    : alumnos;

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

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
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* ── Buscador ── */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search-outline" size={17} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar alumno..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/seleccion-caso" as any)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6 }}>Nueva Bitácora</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {/* COLUMNA IZQUIERDA: Alumnos Recientes y Acciones */}
        <View style={styles.leftCol}>
          {/* ── Acciones Rápidas ── */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones Rápidas</Text>
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
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.accionIconCircle, { backgroundColor: accion.bg }]}>
                    <Ionicons name={accion.icon} size={24} color={accion.color} />
                  </View>
                  <Text style={[styles.accionLabel, { color: colors.textSecondary }]}>
                    {accion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Alumnos Recientes ── */}
          <View>
            <View style={styles.recentesHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                {searchText.trim() ? "Resultados" : "Alumnos Recientes"}
              </Text>
              <TouchableOpacity onPress={() => router.push("/alumnos" as any)}>
                <Text style={[styles.verTodo, { color: colors.primary }]}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            {alumnosFiltrados.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
                <Ionicons
                  name={searchText.trim() ? "search-outline" : "people-outline"}
                  size={48}
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
              <View style={styles.alumnosGrid}>
                {alumnosFiltrados.map((alumno) => {
                  const inicial = alumno.pseudonimo.charAt(0).toUpperCase();
                  const nivelColor = getNivelTeaColor(alumno.nivel_tea);
                  const nivelBg = getNivelTeaBg(alumno.nivel_tea, isDark);
                  const escuelaMeta = [
                    alumno.escuela_actual,
                    [alumno.grado_escolar, alumno.grupo_escolar].filter(Boolean).join(" - "),
                  ].filter(Boolean).join(" · ");

                  return (
                    <View
                      key={alumno.alumno_id}
                      style={[
                        styles.recenteCard,
                        { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" },
                      ]}
                    >
                      <View style={[styles.alumnoAvatar, { backgroundColor: `${colors.primary}1a` }]}>
                        <Text style={[styles.alumnoInicial, { color: colors.primary }]}>{inicial}</Text>
                      </View>
                      <View style={styles.recenteInfo}>
                        <Text style={[styles.recenteName, { color: colors.text }]}>{alumno.pseudonimo}</Text>
                        {escuelaMeta ? (
                          <Text style={[styles.recenteMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            {escuelaMeta}
                          </Text>
                        ) : null}
                        {alumno.nivel_tea ? (
                          <View style={styles.estadoRow}>
                            <View style={[styles.nivelPill, { backgroundColor: nivelBg }]}>
                              <View style={[styles.nivelDot, { backgroundColor: nivelColor }]} />
                              <Text style={[styles.estadoText, { color: nivelColor }]}>
                                Nivel {alumno.nivel_tea} TEA
                              </Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={[styles.verBtn, { backgroundColor: isDark ? "#ffffff10" : "#f5f7fa" }]}
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: "/alumno-details", params: { id: alumno.alumno_id } } as any)}
                      >
                        <Text style={[styles.verBtnText, { color: colors.text }]}>Ver</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* COLUMNA DERECHA: Resumen */}
        <View style={styles.rightCol}>
          {/* ── Resumen de Mis Alumnos ── */}
          <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mi Actividad</Text>
              <Ionicons name="stats-chart-outline" size={20} color={colors.textSecondary} />
            </View>

            {alumnos.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/alumnos" as any)}
                activeOpacity={0.8}
                style={[styles.summaryEmptyRow, { backgroundColor: isDark ? "#ffffff08" : "#f8fafc" }]}
              >
                <View style={[styles.summaryEmptyIcon, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name="person-add-outline" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryEmptyTitle, { color: colors.text }]}>Aún no hay alumnos</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.summaryTotalBox}>
                  <Text style={[styles.summaryTotalNum, { color: colors.primary }]}>{alumnos.length}</Text>
                  <Text style={[styles.summaryTotalLabel, { color: colors.textSecondary }]}>
                    Alumnos asignados a tu cuenta
                  </Text>
                </View>

                <View style={styles.summaryLevels}>
                  {[1, 2, 3].map((n) => {
                    const count = alumnos.filter((a) => a.nivel_tea === n).length;
                    const color = getNivelTeaColor(n);
                    const bg = getNivelTeaBg(n, isDark);
                    return (
                      <View key={n} style={[styles.summaryLevelRow, { backgroundColor: bg }]}>
                        <View style={[styles.nivelDot, { backgroundColor: color }]} />
                        <Text style={[styles.summaryLevelLabel, { color: colors.textSecondary }]}>Nivel {n}</Text>
                        <Text style={[styles.summaryLevelCount, { color }]}>{count}</Text>
                      </View>
                    );
                  })}
                </View>

                {alumnos[0] ? (
                  <View style={[styles.lastAlumnoRow, { borderTopColor: colors.border }]}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>Último registro:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.alumnoAvatar, { backgroundColor: `${colors.primary}1a`, width: 36, height: 36, marginRight: 10 }]}>
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>{alumnos[0].pseudonimo.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={{ fontWeight: '600', color: colors.text }}>{alumnos[0].pseudonimo}</Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </View>
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeSmall: {
    fontSize: 16,
  },
  welcomeName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    width: 300,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    outlineStyle: 'none' as any,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 48,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 2,
  },
  rightCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  accionesRow: {
    flexDirection: "row",
    gap: 16,
  },
  accionItem: {
    flex: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  accionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  accionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  recentesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  verTodo: {
    fontSize: 14,
    fontWeight: "600",
  },
  alumnosGrid: {
    gap: 16,
  },
  recenteCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  alumnoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  alumnoInicial: {
    fontSize: 18,
    fontWeight: "700",
  },
  recenteInfo: {
    flex: 1,
  },
  recenteName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  recenteMeta: {
    fontSize: 13,
    marginBottom: 6,
  },
  estadoRow: {
    flexDirection: "row",
  },
  nivelPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nivelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: "700",
  },
  verBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryTotalBox: {
    alignItems: "center",
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTotalNum: {
    fontSize: 48,
    fontWeight: "800",
  },
  summaryTotalLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  summaryLevels: {
    gap: 10,
  },
  summaryLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  summaryLevelLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  summaryLevelCount: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  summaryEmptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryEmptyTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  lastAlumnoRow: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
});
