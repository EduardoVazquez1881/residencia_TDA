import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getHistorialBitacoras, HistorialBitacoraData } from "@/services/bitacoras.service";
import { supabase } from "@/supabaseconfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput
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

  // Filters State
  const [searchAlumno, setSearchAlumno] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

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

  useFocusEffect(
    useCallback(() => {
      fetchHistorial().finally(() => setLoading(false));
    }, [])
  );

  const filteredHistorial = useMemo(() => {
    return historial.filter(item => {
      // 1. Alumno
      if (searchAlumno.trim()) {
        const pseudonimo = item.casos?.alumnos?.pseudonimo || "";
        if (!pseudonimo.toLowerCase().includes(searchAlumno.toLowerCase().trim())) {
          return false;
        }
      }

      // 2. Estado
      if (selectedEstado !== "todos") {
        if (item.estado !== selectedEstado) return false;
      }

      // 3. Fechas
      const itemDate = new Date(item.fecha + "T00:00:00");
      if (fechaInicio) {
        const startCompare = new Date(fechaInicio + "T00:00:00");
        if (itemDate < startCompare) return false;
      }
      if (fechaFin) {
        const endCompare = new Date(fechaFin + "T00:00:00");
        if (itemDate > endCompare) return false;
      }

      return true;
    });
  }, [historial, searchAlumno, selectedEstado, fechaInicio, fechaFin]);

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

      {/* FILTER UI */}
      <View style={[styles.filtersContainer, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}>
        <View style={styles.filterRow}>
           <View style={[styles.inputGroup, { flex: 2 }]}>
             <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filtrar por Alumno</Text>
             <View style={[styles.searchBox, { backgroundColor: isDark ? "#ffffff08" : "#f8fafc", borderColor: colors.border }]}>
               <Ionicons name="search" size={16} color={colors.textSecondary} />
               <TextInput 
                 style={[styles.searchInput, { color: colors.text, outlineStyle: 'none' } as any]}
                 placeholder="Buscar por nombre..."
                 placeholderTextColor={colors.textSecondary}
                 value={searchAlumno}
                 onChangeText={setSearchAlumno}
               />
               {searchAlumno.length > 0 && (
                 <TouchableOpacity onPress={() => setSearchAlumno("")} style={{ padding: 4 }}>
                   <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                 </TouchableOpacity>
               )}
             </View>
           </View>

           <View style={[styles.inputGroup, { flex: 1.5 }]}>
             <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Estado</Text>
             <select 
               value={selectedEstado}
               onChange={(e) => setSelectedEstado(e.target.value)}
               style={{
                 height: 40,
                 borderRadius: 8,
                 border: `1px solid ${colors.border}`,
                 backgroundColor: isDark ? "#ffffff08" : "#f8fafc",
                 color: colors.text,
                 padding: "0 12px",
                 fontSize: 14,
                 outline: "none"
               }}
             >
               <option value="todos">Todos los estados</option>
               <option value="borrador">Borrador</option>
               <option value="completado">Completado</option>
               <option value="revisado">Revisado</option>
               <option value="devuelta">Devuelta</option>
             </select>
           </View>

           <View style={[styles.inputGroup, { flex: 1 }]}>
             <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Desde fecha</Text>
             <input 
               type="date"
               value={fechaInicio}
               onChange={(e) => setFechaInicio(e.target.value)}
               style={{
                 height: 40,
                 borderRadius: 8,
                 border: `1px solid ${colors.border}`,
                 backgroundColor: isDark ? "#ffffff08" : "#f8fafc",
                 color: colors.text,
                 padding: "0 12px",
                 fontSize: 14,
                 outline: "none"
               }}
             />
           </View>

           <View style={[styles.inputGroup, { flex: 1 }]}>
             <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Hasta fecha</Text>
             <input 
               type="date"
               value={fechaFin}
               onChange={(e) => setFechaFin(e.target.value)}
               style={{
                 height: 40,
                 borderRadius: 8,
                 border: `1px solid ${colors.border}`,
                 backgroundColor: isDark ? "#ffffff08" : "#f8fafc",
                 color: colors.text,
                 padding: "0 12px",
                 fontSize: 14,
                 outline: "none"
               }}
             />
           </View>
        </View>
        
        {(searchAlumno !== "" || selectedEstado !== "todos" || fechaInicio !== "" || fechaFin !== "") && (
          <TouchableOpacity 
            onPress={() => {
              setSearchAlumno("");
              setSelectedEstado("todos");
              setFechaInicio("");
              setFechaFin("");
            }} 
            style={{ alignSelf: "flex-end", marginTop: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Limpiar Filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredHistorial.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name={historial.length > 0 ? "search-outline" : "reader-outline"} size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {historial.length > 0 ? "No hay coincidencias" : "Sin registros aún"}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            {historial.length > 0 
              ? "Intenta ajustando los filtros de búsqueda." 
              : "Las sesiones registradas aparecerán aquí para tu consulta."}
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

          {filteredHistorial.map((item) => {
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
    marginBottom: 24,
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
  
  // Filters UI
  filtersContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  filterRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end"
  },
  inputGroup: {
    flexDirection: "column",
    gap: 6
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: "100%"
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
