import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getPlantillas, PlantillaData, desactivarPlantilla } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
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

  const fetchPlantillas = async () => {
    try {
      const session = await getCurrentSession();
      if (!session?.user?.id) return;
      const data = await getPlantillas(session.user.id);
      // Solo mostrar las del usuario (no las globales de otros)
      const misPlantillas = data.filter(p => p.terapeuta_id === session.user.id);
      setPlantillas(misPlantillas);
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
        {item.es_global && (
          <View style={[styles.globalBadge, { backgroundColor: isDark ? "#064e3b" : "#d1fae5" }]}>
            <Text style={[styles.globalBadgeText, { color: isDark ? "#34d399" : "#059669" }]}>Global</Text>
          </View>
        )}
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
          <Ionicons name="create-outline" size={18} color={colors.text} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? "#450a0a" : "#fef2f2" }]}
          onPress={() => handleEliminar(item.plantilla_id, item.nombre)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Eliminar</Text>
        </TouchableOpacity>
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
