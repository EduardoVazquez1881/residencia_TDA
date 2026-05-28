import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getHistorialBitacoras, HistorialBitacoraData } from "@/services/bitacoras.service";
import { supabase } from "@/supabaseconfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { safeBack } from "@/utils/navigation";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Platform,
  Modal
} from "react-native";
import { BitacoraPDFViewer } from "@/components/pdf/BitacoraPDFViewer";

export function ReportesScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [historial, setHistorial] = useState<HistorialBitacoraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [casosTerapeuta, setCasosTerapeuta] = useState<Set<number>>(new Set());
  const [pdfBitacoraId, setPdfBitacoraId] = useState<number | null>(null);

  // Filters State
  const [searchAlumno, setSearchAlumno] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<"inicio" | "fin" | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
      let isActive = true;
      fetchHistorial().finally(() => {
        if (isActive) {
          setLoading(false);
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
        }
      });
      return () => { isActive = false; };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistorial();
    setRefreshing(false);
  };

  const filteredHistorial = useMemo(() => {
    return historial.filter(item => {
      // 1. Filtrar por Alumno
      if (searchAlumno.trim()) {
        const pseudonimo = item.casos?.alumnos?.pseudonimo || "";
        if (!pseudonimo.toLowerCase().includes(searchAlumno.toLowerCase().trim())) {
          return false;
        }
      }

      // 2. Filtrar por Estado
      if (selectedEstado !== "todos") {
        if (item.estado !== selectedEstado) {
          return false;
        }
      }

      // 3. Filtrar por Fechas
      const itemDate = new Date(item.fecha + "T00:00:00");
      if (fechaInicio) {
        const startCompare = new Date(fechaInicio);
        startCompare.setHours(0, 0, 0, 0);
        if (itemDate < startCompare) return false;
      }
      if (fechaFin) {
        const endCompare = new Date(fechaFin);
        endCompare.setHours(23, 59, 59, 999);
        if (itemDate > endCompare) return false;
      }

      return true;
    });
  }, [historial, searchAlumno, selectedEstado, fechaInicio, fechaFin]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === "inicio") setFechaInicio(selectedDate);
      else if (showDatePicker === "fin") setFechaFin(selectedDate);
    }
  };

  const handleCloseDatePicker = () => {
    if (showDatePicker === "inicio" && !fechaInicio) setFechaInicio(new Date());
    if (showDatePicker === "fin" && !fechaFin) setFechaFin(new Date());
    setShowDatePicker(null);
  };

  const renderBitacoraItem = ({ item }: { item: HistorialBitacoraData }) => {
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
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: "/nueva-bitacora",
          params: { casoId: item.caso_id, plantillaId: item.plantilla_id, editId: item.bitacora_id }
        })}
        style={[
          styles.itemCard,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.2 : 0.05,
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: item.estado === "revisado" 
                ? "#3b82f620" 
                : item.estado === "devuelta"
                ? "#ef444420"
                : (item.estado === "completado" ? "#10b98120" : "#f59e0b20") 
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
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{fechaPretty}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.alumnoIcon, { backgroundColor: colors.primary + "15" }]}>
            <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 16 }}>{pseudonimo[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alumnoName, { color: colors.text }]}>{pseudonimo}</Text>
            <View style={styles.plantillaRow}>
              <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.plantillaName, { color: colors.textSecondary }]} numberOfLines={1}>{plantilla}</Text>
            </View>
          </View>
          <View style={styles.editBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
          <View style={styles.footerItem}>
             <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
             <Text style={[styles.footerText, { color: colors.textSecondary }]}>
               {item.hora_entrada?.slice(0, 5) || "--:--"} - {item.hora_salida?.slice(0, 5) || "--:--"}
             </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Botón PDF — solo para bitácoras revisadas */}
            {item.estado === "revisado" && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  setPdfBitacoraId(item.bitacora_id);
                }}
                style={[styles.btnModificar, { backgroundColor: "#ef444415", paddingHorizontal: 8 }]}
              >
                <Ionicons name="document-text-outline" size={14} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700", marginLeft: 4 }}>PDF</Text>
              </TouchableOpacity>
            )}
            <View style={[styles.btnModificar, { backgroundColor: isTerapeuta ? "#3b82f615" : colors.primary + "15" }]}>
               <Ionicons name={isTerapeuta ? "eye-outline" : "pencil-outline"} size={14} color={isTerapeuta ? "#3b82f6" : colors.primary} />
               <Text style={{ color: isTerapeuta ? "#3b82f6" : colors.primary, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>
                 {isTerapeuta ? "Revisar" : "Modificar"}
               </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={safeBack}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Historial de Bitácoras</Text>
      </View>

      {/* FILTER UI */}
      <View style={[styles.filtersContainer, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", shadowOpacity: isDark ? 0.2 : 0.05 }]}>
         {/* Search Bar */}
         <View style={[styles.searchBox, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput 
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por alumno..."
              placeholderTextColor={colors.textSecondary}
              value={searchAlumno}
              onChangeText={setSearchAlumno}
            />
            {searchAlumno.length > 0 && (
              <TouchableOpacity onPress={() => setSearchAlumno("")} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
         </View>

         {/* Status Chips */}
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            {["todos", "borrador", "completado", "revisado", "devuelta"].map(est => {
              const isSelected = selectedEstado === est;
              return (
                <TouchableOpacity 
                  key={est} 
                  onPress={() => setSelectedEstado(est)}
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: isSelected ? colors.primary : (isDark ? "#ffffff10" : "#f1f5f9"),
                      borderColor: isSelected ? colors.primary : "transparent",
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? "#fff" : colors.textSecondary }]}>
                    {est.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )
            })}
         </ScrollView>

         {/* Date Range */}
         <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Desde</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker("inicio")}
                  style={[styles.dateBtn, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9" }]}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={{ color: fechaInicio ? colors.text : colors.textSecondary, marginLeft: 6, fontSize: 13, fontWeight: "500" }}>
                    {fechaInicio ? fechaInicio.toLocaleDateString("es-ES") : "Seleccionar"}
                  </Text>
                </TouchableOpacity>
                {fechaInicio && (
                  <TouchableOpacity onPress={() => setFechaInicio(null)} style={{ padding: 4, marginLeft: 4 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Hasta</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker("fin")}
                  style={[styles.dateBtn, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9" }]}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={{ color: fechaFin ? colors.text : colors.textSecondary, marginLeft: 6, fontSize: 13, fontWeight: "500" }}>
                    {fechaFin ? fechaFin.toLocaleDateString("es-ES") : "Seleccionar"}
                  </Text>
                </TouchableOpacity>
                {fechaFin && (
                  <TouchableOpacity onPress={() => setFechaFin(null)} style={{ padding: 4, marginLeft: 4 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
         </View>

         {/* Limpiar Filtros */}
         {(searchAlumno || selectedEstado !== "todos" || fechaInicio || fechaFin) && (
            <TouchableOpacity 
              onPress={() => {
                setSearchAlumno("");
                setSelectedEstado("todos");
                setFechaInicio(null);
                setFechaFin(null);
              }} 
              style={{ alignSelf: "flex-end", marginTop: 10 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>Limpiar filtros</Text>
            </TouchableOpacity>
         )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={filteredHistorial}
          keyExtractor={(item) => item.bitacora_id.toString()}
          contentContainerStyle={[styles.listContent, filteredHistorial.length === 0 && styles.centerContainerList]}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={historial.length > 0 ? "search-outline" : "reader-outline"} size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {historial.length > 0 ? "No hay coincidencias" : "Sin bitácoras registradas"}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {historial.length > 0 
                  ? "Intenta ajustando los filtros de búsqueda para encontrar lo que buscas." 
                  : "Todas tus informaciones de sesiones aparecerán aquí para que las consultes o modifiques."}
              </Text>
              {historial.length === 0 && (
                <TouchableOpacity 
                  style={[styles.btnCrear, { backgroundColor: colors.primary }]}
                  onPress={() => router.navigate("/seleccion-bitacora" as any)}
                >
                   <Text style={{ color: "#fff", fontWeight: "700" }}>Registrar mi primera sesión</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={renderBitacoraItem}
        />
      )}
      
      {/* Modal generación PDF */}
      {pdfBitacoraId !== null && (
        <BitacoraPDFViewer
          bitacoraId={pdfBitacoraId}
          visible={pdfBitacoraId !== null}
          onClose={() => setPdfBitacoraId(null)}
        />
      )}

      {/* Date/Time Pickers natively */}
      {showDatePicker && Platform.OS === "ios" && (
         <Modal transparent animationType="slide" visible={!!showDatePicker}>
           <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
             <View style={{ backgroundColor: "#fff", paddingBottom: 40, paddingTop: 20, borderRadius: 20 }}>
               <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                 <Text style={{ fontSize: 18, fontWeight: "700", textAlign: "center", color: "#333" }}>
                   Seleccionar Fecha
                 </Text>
               </View>
               <DateTimePicker
                 value={showDatePicker === "inicio" ? (fechaInicio || new Date()) : (fechaFin || new Date())}
                 mode="date"
                 display="spinner"
                 onChange={onDateChange}
                 textColor="#000"
                 style={{ alignSelf: "center", width: "100%", height: 200 }}
               />
               <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
                 <TouchableOpacity onPress={handleCloseDatePicker} style={[styles.btnCrear, { backgroundColor: colors.primary, alignItems: "center" }]}>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Confirmar</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         </Modal>
      )}
      
      {showDatePicker && Platform.OS === "android" && (
         <DateTimePicker
           value={showDatePicker === "inicio" ? (fechaInicio || new Date()) : (fechaFin || new Date())}
           mode="date"
           display="default"
           onChange={onDateChange}
         />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: "700" },

  // Filters UI
  filtersContainer: { marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: 18, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontWeight: "500" },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "700" },
  filterLabel: { fontSize: 12, marginBottom: 4, fontWeight: "600", marginLeft: 2 },
  dateBtn: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 40, borderRadius: 10 },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerContainerList: { flexGrow: 1, justifyContent: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  itemCard: { borderRadius: 18, padding: 16, marginBottom: 16, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  dateText: { fontSize: 12, fontWeight: "600" },

  cardBody: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  alumnoIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 12 },
  alumnoName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  plantillaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  plantillaName: { fontSize: 12, fontWeight: "500" },
  editBtn: { padding: 4 },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 12 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12, fontWeight: "600" },
  btnModificar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },

  emptyState: { alignItems: "center", justifyContent: "center", padding: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  btnCrear: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }
});
