import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getPlantillas, PlantillaData, desactivarPlantilla, getPlantillaEstructura, PlantillaEstructura } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export function MisPlantillasScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [plantillas, setPlantillas] = useState<PlantillaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
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
      // Ahora mostramos todas las que devuelve el servicio (Propias + Globales)
      setPlantillas(data);
    } catch (error) {
      console.error("Error fetching plantillas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    Alert.alert(
      "Eliminar Plantilla",
      `¿Estás seguro de que deseas eliminar "${nombre}"? Las bitácoras existentes no se perderán, pero ya no podrás usar esta plantilla para nuevos registros.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await desactivarPlantilla(id);
            if (error) {
              Alert.alert("Error", "No se pudo eliminar la plantilla.");
            } else {
              setPlantillas((prev) => prev.filter((p) => p.plantilla_id !== id));
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PlantillaData }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
            Creada el {new Date(item.creado_en).toLocaleDateString()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            onPress={() => handleVerEstructura(item.plantilla_id)}
            style={{ padding: 4, backgroundColor: `${colors.primary}15`, borderRadius: 12 }}
          >
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          {item.es_global && (
            <View style={[styles.globalBadge, { backgroundColor: isDark ? "#064e3b" : "#d1fae5" }]}>
              <Text style={[styles.globalBadgeText, { color: isDark ? "#34d399" : "#059669" }]}>Global</Text>
            </View>
          )}
        </View>
      </View>

      {item.descripcion ? (
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.descripcion}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
          onPress={() => router.push({ pathname: "/nueva-plantilla", params: { editId: item.plantilla_id } } as any)}
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>
            {item.terapeuta_id === sessionUid ? "Editar" : "Ver / Clonar"}
          </Text>
        </TouchableOpacity>

        {item.terapeuta_id === sessionUid && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? "#450a0a" : "#fef2f2" }]}
            onPress={() => handleEliminar(item.plantilla_id, item.nombre)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Plantillas</Text>
        <TouchableOpacity
          onPress={() => router.push("/nueva-plantilla" as any)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: isDark ? colors.backgroundSecondary : "#f1f5f9" }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          placeholder="Buscar plantilla..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPlantillas}
          keyExtractor={(item) => item.plantilla_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={fetchPlantillas}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? "No se encontraron plantillas." : "Aún no has creado ninguna plantilla."}
              </Text>
              {!searchQuery && (
                <PrimaryButton
                  title="Crear Primera Plantilla"
                  onPress={() => router.push("/nueva-plantilla" as any)}
                  style={{ marginTop: 20 }}
                />
              )}
            </View>
          }
        />
      )}

      {/* MODAL DE ESTRUCTURA DE PLANTILLA (REUTILIZADO) */}
      <Modal visible={modalEstructuraVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", maxHeight: "80%" }]}>
            <View style={styles.modalHeaderModal}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Resumen de Estructura</Text>
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginTop: 2 }}>
                  {estructuraData?.nombre || "Cargando..."}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalEstructuraVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingEstructura ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                {estructuraData?.secciones.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontStyle: "italic", textAlign: "center", paddingVertical: 20 }}>
                    Esta plantilla no tiene secciones definidas aún.
                  </Text>
                ) : (
                  estructuraData?.secciones.map((sec) => (
                    <View key={sec.seccion_id} style={{ marginBottom: 20 }}>
                      <Text style={[styles.seccionTitle, { color: colors.text, borderBottomColor: isDark ? "#ffffff20" : "#e2e8f0" }]}>
                        {sec.nombre}
                      </Text>
                      {sec.descripcion ? <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{sec.descripcion}</Text> : null}
                      
                      <View style={{ paddingLeft: 12 }}>
                        {sec.campos.length === 0 ? (
                          <Text style={{ color: colors.textSecondary, fontStyle: "italic", fontSize: 13 }}>No hay campos en esta sección.</Text>
                        ) : (
                          sec.campos.map((campo) => (
                            <View key={campo.campo_id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 8 }} />
                              <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>
                                {campo.etiqueta} <Text style={{ color: colors.textSecondary, fontSize: 12 }}>({campo.tipo})</Text>
                              </Text>
                              {campo.requerido && <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "bold" }}>*</Text>}
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardDate: { fontSize: 12, marginTop: 2 },
  globalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  globalBadgeText: { fontSize: 10, fontWeight: "700" },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 15, maxWidth: "80%", lineHeight: 22 },

  // Estilos Modal Preview
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeaderModal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  seccionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, borderBottomWidth: 1, paddingBottom: 6 },
});

// Importación dummy para evitar errores si no existe
const PrimaryButton = (props: any) => (
  <TouchableOpacity
    {...props}
    style={[{ backgroundColor: "#3b82f6", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }, props.style]}
  >
    <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{props.title}</Text>
  </TouchableOpacity>
);
