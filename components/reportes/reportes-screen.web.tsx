import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getHistorialBitacoras, HistorialBitacoraData } from "@/services/bitacoras.service";
import { supabase } from "@/supabaseconfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";
import { BitacoraPDFViewer } from "@/components/pdf/BitacoraPDFViewer.web";

export function ReportesScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [historial, setHistorial] = useState<HistorialBitacoraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [casosTerapeuta, setCasosTerapeuta] = useState<Set<number>>(new Set());
  const [pdfBitacoraId, setPdfBitacoraId] = useState<number | null>(null);

  const fetchHistorial = async () => {
    try {
      const session = await getCurrentSession();
      if (!session) return;
      const uid = session.user.id;
      setCurrentUserId(uid);

      const [data, partRes] = await Promise.all([
        getHistorialBitacoras(uid),
        supabase
          .from("caso_participantes")
          .select("caso_id, rol_en_caso")
          .eq("usuario_id", uid)
      ]);

      const therapistCases = new Set<number>(
        partRes.data
          ?.filter((p: any) => p.rol_en_caso?.toLowerCase().includes("terapeuta"))
          .map((p: any) => p.caso_id) || []
      );

      setCasosTerapeuta(therapistCases);
      setHistorial(data);
    } catch (e) {
      console.error("Error fetching bitacoras history:", e);
    }
  };

  useEffect(() => {
    fetchHistorial().finally(() => setLoading(false));
  }, []);

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Historial de Bitácoras</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Consulta y gestiona los registros de sesiones
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.headerActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/seleccion-bitacora" as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>Nueva Bitácora</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : historial.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="reader-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin registros aún</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Las sesiones registradas aparecerán aquí para tu consulta.
          </Text>
        </View>
      ) : (
        <View style={styles.tableCard}>
          {/* Encabezados de tabla para Web */}
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textSecondary }]}>Alumno</Text>
            <Text style={[styles.colHeader, { flex: 2, color: colors.textSecondary }]}>Plantilla</Text>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textSecondary }]}>Fecha</Text>
            <Text style={[styles.colHeader, { flex: 1, color: colors.textSecondary }]}>Horario</Text>
            <Text style={[styles.colHeader, { flex: 1, color: colors.textSecondary }]}>Estado</Text>
            <Text style={[styles.colHeader, { width: 100, textAlign: 'right', color: colors.textSecondary }]}>Acciones</Text>
          </View>

          {historial.map((item) => {
            const pseudonimo = item.casos?.alumnos?.pseudonimo || "Alumno";
            const plantilla = item.plantillas?.nombre || "Sin plantilla";
            const fechaPretty = new Date(item.fecha + "T00:00:00").toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });

            const isOwner = item.casos?.usuario_id === currentUserId;
            const isCreator = item.casos?.creado_por === currentUserId;
            const isTerapeuta = isOwner || isCreator || (item.caso_id ? casosTerapeuta.has(item.caso_id) : false);

            return (
              <View key={item.bitacora_id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                   <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
                     <Text style={{ color: colors.primary, fontWeight: '700' }}>{pseudonimo[0].toUpperCase()}</Text>
                   </View>
                   <Text style={{ color: colors.text, fontWeight: '600' }}>{pseudonimo}</Text>
                </View>

                <Text style={{ flex: 2, color: colors.textSecondary }}>{plantilla}</Text>
                
                <Text style={{ flex: 1.2, color: colors.text }}>{fechaPretty}</Text>
                
                <Text style={{ flex: 1, color: colors.textSecondary }}>
                  {item.hora_entrada?.slice(0, 5)} - {item.hora_salida?.slice(0, 5)}
                </Text>

                <View style={{ flex: 1 }}>
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: item.estado === "revisado" 
                        ? "#3b82f615" 
                        : item.estado === "devuelta"
                        ? "#ef444415"
                        : (item.estado === "completado" ? "#10b98115" : "#f59e0b15") 
                    }
                  ]}>
                    <View style={[
                      styles.statusDot, 
                      { 
                        backgroundColor: item.estado === "revisado" 
                          ? "#3b82f6" 
                          : item.estado === "devuelta"
                          ? "#ef4444"
                          : (item.estado === "completado" ? "#10b981" : "#f59e0b") 
                      }
                    ]} />
                    <Text style={[
                      styles.statusText, 
                      { 
                        color: item.estado === "revisado" 
                          ? "#3b82f6" 
                          : item.estado === "devuelta"
                          ? "#ef4444"
                          : (item.estado === "completado" ? "#10b981" : "#f59e0b") 
                      }
                    ]}>
                      {item.estado === "revisado" ? "REVISADO" : item.estado === "devuelta" ? "DEVUELTA" : item.estado.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={{ width: 120, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                  {/* Botón ver / revisar */}
                  <TouchableOpacity 
                    onPress={() => router.push({
                      pathname: "/nueva-bitacora",
                      params: { casoId: item.caso_id, plantillaId: item.plantilla_id, editId: item.bitacora_id }
                    })}
                    style={[styles.iconAction, isTerapeuta && { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}
                  >
                    <Ionicons 
                      name={isTerapeuta ? "eye-outline" : "pencil-outline"} 
                      size={18} 
                      color={isTerapeuta ? "#3b82f6" : colors.primary} 
                    />
                  </TouchableOpacity>
                  {/* Botón PDF — solo para bitácoras revisadas */}
                  {item.estado === "revisado" && (
                    <TouchableOpacity
                      onPress={() => setPdfBitacoraId(item.bitacora_id)}
                      style={[styles.iconAction, { backgroundColor: "rgba(239, 68, 68, 0.08)" }]}
                    >
                      <Ionicons name="document-text-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
      {/* Modal de generación de PDF */}
      {pdfBitacoraId !== null && (
        <BitacoraPDFViewer
          bitacoraId={pdfBitacoraId}
          visible={pdfBitacoraId !== null}
          onClose={() => setPdfBitacoraId(null)}
        />
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
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 48,
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400 },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 60, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  emptyIconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { fontSize: 16, textAlign: "center", maxWidth: 400 },
  tableCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  colHeader: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  iconAction: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.02)' },
});
