import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CasoDetailsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalles del Caso</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="construct-outline" size={48} color={colors.primary} style={{ marginBottom: 20 }} />
          <Text style={[styles.title, { color: colors.text }]}>Próximamente...</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Este es el espacio donde se cargará toda la información detallada del Expediente o Caso ID: {id}.
          </Text>
          
          <TouchableOpacity
             style={[styles.btn, { backgroundColor: `${colors.primary}20` }]}
             onPress={() => router.back()}
          >
             <Text style={{ color: colors.primary, fontWeight: "bold" }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    alignItems: "center",
    padding: 30,
    borderRadius: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  btn: {
     paddingHorizontal: 20,
     paddingVertical: 12,
     borderRadius: 14,
  }
});
