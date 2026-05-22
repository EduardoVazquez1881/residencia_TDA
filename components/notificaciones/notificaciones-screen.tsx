import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificacionesContext } from "@/context/notificaciones-context";
import { router, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

// Auxiliar para formatear tiempo transcurrido
function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Hace un momento";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    
    return date.toLocaleDateString();
  } catch (e) {
    return "";
  }
}

export function NotificacionesScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const {
    notifications,
    unreadCount,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
    refrescar,
  } = useNotificacionesContext();

  const handleNotificationPress = async (item: any) => {
    // Marcar como leída
    if (!item.leido) {
      await marcarComoLeida(item.id);
    }

    // Redireccionar de acuerdo al tipo
    if (item.tipo === "bitacora_creada" || item.tipo === "caso_asignado") {
      router.push("/expedientes");
    } else if (item.tipo === "bitacora_revisada") {
      router.push("/reportes");
    } else {
      router.push("/prueba");
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "bitacora_creada":
        return { name: "document-text-outline" as const, color: colors.success };
      case "caso_asignado":
        return { name: "person-add-outline" as const, color: colors.primary };
      case "bitacora_revisada":
        return { name: "checkmark-circle-outline" as const, color: colors.info };
      default:
        return { name: "information-circle-outline" as const, color: colors.info };
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notificaciones",
          headerTitleStyle: { fontWeight: "700" },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {/* Cabecera de Acciones Rápidas */}
      {notifications.length > 0 && (
        <View style={[styles.actionsRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.unreadCountText, { color: colors.textSecondary }]}>
            {unreadCount} no leídas
          </Text>
          <TouchableOpacity onPress={marcarTodasComoLeidas} activeOpacity={0.7}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Marcar todo como leído
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refrescar} tintColor={colors.primary} />
        }
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listEmptyContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? "#1f2937" : "#f0f4f8" }]}>
              <Ionicons name="notifications-off-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No hay notificaciones
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Te avisaremos cuando haya novedades en tus expedientes o bitácoras.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const iconConfig = getNotificationIcon(item.tipo);
          return (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.7}
              style={[
                styles.card,
                {
                  backgroundColor: !item.leido
                    ? (isDark ? "#1e293b" : "#f0f7ff")
                    : (isDark ? colors.backgroundSecondary : "#fff"),
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Unread indicator */}
              {!item.leido && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}

              {/* Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? "#1e293b" : "#f8fafc" },
                ]}
              >
                <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
              </View>

              {/* Text content */}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>
                    {formatTimeAgo(item.creado_en)}
                  </Text>
                </View>
                <Text style={[styles.cardMessage, { color: colors.textSecondary }]}>
                  {item.mensaje}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  unreadCountText: {
    fontSize: 13,
    fontWeight: "500",
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  listEmptyContent: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 11,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
