import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getPlantillas, PlantillaData, desactivarPlantilla, getPlantillaEstructura, PlantillaEstructura } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function MisPlantillasScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [plantillas, setPlantillas] = useState<PlantillaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionUid, setSessionUid] = useState<string | null>(null);

  // Preview structure states
  const [modalEstructuraVisible, setModalEstructuraVisible] = useState(false);
  const [loadingEstructura, setLoadingEstructura] = useState(false);
  const [estructuraData, setEstructuraData] = useState<PlantillaEstructura | null>(null);

  const fetchPlantillas = async () => {
    try {
      const session = await getCurrentSession();
      if (!session?.user?.id) return;
      setSessionUid(session.user.id);
      const data = await getPlantillas(session.user.id);
      setPlantillas(data);
    } catch (error) {
      console.error("Error fetching plantillas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantillas();
  }, []);

  const filteredPlantillas = useMemo(() => {
    return plantillas.filter((p) =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plantillas, searchQuery]);

  const handleVerEstructura = async (id: number) => {
    setModalEstructuraVisible(true);
    setLoadingEstructura(true);
    const data = await getPlantillaEstructura(id);
    setEstructuraData(data);
    setLoadingEstructura(false);
  };

  const handleEliminar = (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
      (async () => {
        const { error } = await desactivarPlantilla(id);
        if (error) {
          alert("Error: No se pudo eliminar la plantilla.");
        } else {
          setPlantillas((prev) => prev.filter((p) => p.plantilla_id !== id));
        }
      })();
    }
  };

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Plantillas (WEB)</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Gestiona los formatos de tus sesiones
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/nueva-plantilla" as any)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>Nueva Plantilla</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          placeholder="Buscar plantilla..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredPlantillas.map((item) => (
            <View
              key={item.plantilla_id}
              style={[
                styles.card,
                { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    {new Date(item.creado_en).toLocaleDateString()}
                  </Text>
                </View>
                {item.es_global && (
                  <View style={[styles.globalBadge, { backgroundColor: isDark ? "#064e3b" : "#ecfdf5" }]}>
                    <Text style={[styles.globalBadgeText, { color: isDark ? "#34d399" : "#059669" }]}>Global</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                {item.descripcion || "Sin descripción disponible."}
              </Text>

              <View style={styles.cardFooter}>
                <TouchableOpacity 
                   onPress={() => handleVerEstructura(item.plantilla_id)}
                   style={[styles.actionBtn, { backgroundColor: isDark ? '#ffffff08' : '#f8fafc' }]}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Vista Previa</Text>
                </TouchableOpacity>
                
                <View style={{ flex: 1 }} />
                
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => router.push({ pathname: "/nueva-plantilla", params: { editId: item.plantilla_id } } as any)}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                    {item.terapeuta_id === sessionUid ? "Editar" : "Clonar"}
                  </Text>
                </TouchableOpacity>

                {item.terapeuta_id === sessionUid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
                    onPress={() => handleEliminar(item.plantilla_id, item.nombre)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* MODAL ESTRUCTURA */}
      <Modal visible={modalEstructuraVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Estructura de Plantilla</Text>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>{estructuraData?.nombre}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalEstructuraVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {loadingEstructura ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 500 }}>
                {estructuraData?.secciones.map(sec => (
                  <View key={sec.seccion_id} style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 12 }}>
                      {sec.nombre}
                    </Text>
                    {sec.campos.map(campo => (
                      <View key={campo.campo_id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                        <Text style={{ color: colors.text, fontWeight: '500' }}>{campo.etiqueta}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>({campo.tipo})</Text>
                        {campo.requerido && <Text style={{ color: colors.error }}>*</Text>}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 48,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
    maxWidth: 400,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, outlineStyle: 'none' as any },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  card: {
    width: 'calc(50% - 12px)' as any,
    minWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardDate: { fontSize: 13, marginTop: 2 },
  globalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  globalBadgeText: { fontSize: 11, fontWeight: "800" },
  cardDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  cardFooter: { flexDirection: "row", gap: 12, alignItems: 'center' },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 300 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 600, borderRadius: 24, padding: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
});
