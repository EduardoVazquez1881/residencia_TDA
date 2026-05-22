import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificacionesContext } from "@/context/notificaciones-context";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";
import { Stack, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

// Auxiliar para formatear tiempo transcurrido
function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Hace un momento";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return "";
  }
}

interface NotificationItemProps {
  item: any;
  isLast: boolean;
  colors: any;
  isDark: boolean;
  onPress: (item: any) => void;
  onMarkAsRead: (id: string) => Promise<void> | void;
  getNotificationIcon: (tipo: string) => { name: any; color: string; bg: string };
  isCompact?: boolean;
}

function NotificationItem({
  item,
  isLast,
  colors,
  isDark,
  onPress,
  onMarkAsRead,
  getNotificationIcon,
  isCompact = false,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const iconConfig = getNotificationIcon(item.tipo);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      {...({
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } as any)}
      style={[
        styles.notificationItem,
        isCompact && { padding: 14 },
        !item.leido && { backgroundColor: isDark ? "#1e293b50" : "#f0f7ff80" },
        isHovered && { backgroundColor: isDark ? "#ffffff05" : "#f8fafc" },
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
      ]}
    >
      {/* Unread indicator */}
      {!item.leido && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}

      {/* Icon Circle */}
      <View style={[styles.iconCircle, isCompact && { width: 36, height: 36, borderRadius: 10, marginRight: 12 }, { backgroundColor: iconConfig.bg }]}>
        <Ionicons name={iconConfig.name} size={isCompact ? 16 : 20} color={iconConfig.color} />
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <View style={[styles.itemHeader, isCompact && { flexDirection: "column", alignItems: "flex-start", gap: 2 }]}>
          <Text style={[styles.itemTitle, isCompact && { fontSize: 14 }, { color: colors.text }]}>{item.titulo}</Text>
          <Text style={[styles.itemTime, isCompact && { fontSize: 11 }, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.creado_en)}
          </Text>
        </View>
        <Text style={[styles.itemMessage, isCompact && { fontSize: 13, lineHeight: 18 }, { color: colors.textSecondary }]}>
          {item.mensaje}
        </Text>
      </View>

      {/* Checkmark mark as read button */}
      {!item.leido && (
        <TouchableOpacity
          style={[styles.markReadBtn, isCompact && { marginLeft: 8, padding: 6 }]}
          onPress={(e) => {
            e.stopPropagation();
            onMarkAsRead(item.id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle-outline" size={isCompact ? 18 : 20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export function NotificacionesScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();
  const isCompact = width < 640;

  const {
    notifications,
    unreadCount,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
    refrescar,
  } = useNotificacionesContext();

  const handleNotificationPress = async (item: any) => {
    if (!item.leido) {
      await marcarComoLeida(item.id);
    }
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
        return { name: "document-text-outline" as const, color: colors.success, bg: `${colors.success}12` };
      case "caso_asignado":
        return { name: "person-add-outline" as const, color: colors.primary, bg: `${colors.primary}12` };
      case "bitacora_revisada":
        return { name: "checkmark-circle-outline" as const, color: colors.info, bg: `${colors.info}12` };
      default:
        return { name: "information-circle-outline" as const, color: colors.info, bg: `${colors.info}12` };
    }
  };

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false, title: "Notificaciones - Residencia TDA" }} />

      {/* Cabecera */}
      <View style={[styles.header, isCompact && { marginBottom: 20 }]}>
        <View style={isCompact && { width: "100%" }}>
          <Text style={[styles.headerTitle, isCompact && { fontSize: 26 }, { color: colors.text }]}>Centro de Notificaciones</Text>
          <Text style={[styles.headerSubtitle, isCompact && { fontSize: 14 }, { color: colors.textSecondary }]}>
            Entérate de cualquier cambio, asignación o subida de bitácoras en tiempo real.
          </Text>
        </View>
        <View style={[{ flexDirection: "row", gap: 10, alignItems: "center" }, isCompact && { width: "100%", justifyContent: "space-between", marginTop: 8 }]}>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={marcarTodasComoLeidas}
              style={[styles.btnSecondary, isCompact && { flex: 1, justifyContent: "center", paddingVertical: 8, paddingHorizontal: 10 }, { borderColor: colors.border, backgroundColor: isDark ? "#1e293b" : "#fff" }]}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: colors.primary }]}>Marcar todo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={refrescar}
            style={[styles.btnSecondary, isCompact && { flex: notifications.length > 0 ? 1 : 0, width: notifications.length > 0 ? undefined : "100%", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 10 }, { borderColor: colors.border, backgroundColor: isDark ? "#1e293b" : "#fff" }]}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.text }]}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando notificaciones...</Text>
        </View>
      ) : (
        <View style={styles.scrollContent}>
          {notifications.length === 0 ? (
            <View style={[styles.emptyContainer, isCompact && { padding: 32 }, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}>
              <View style={[styles.emptyIconCircle, isCompact && { width: 56, height: 56, marginBottom: 16 }, { backgroundColor: `${colors.primary}10` }]}>
                <Ionicons name="notifications-off-outline" size={isCompact ? 28 : 36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, isCompact && { fontSize: 16 }, { color: colors.text }]}>No tienes notificaciones pendientes</Text>
              <Text style={[styles.emptySubtitle, isCompact && { fontSize: 13, lineHeight: 18 }, { color: colors.textSecondary }]}>
                Cuando ocurran eventos importantes relacionados con tus alumnos, plantillas o bitácoras, aparecerán en este espacio.
              </Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}>
              {notifications.map((item, index) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  isLast={index === notifications.length - 1}
                  colors={colors}
                  isDark={isDark}
                  onPress={handleNotificationPress}
                  onMarkAsRead={marcarComoLeida}
                  getNotificationIcon={getNotificationIcon}
                  isCompact={isCompact}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    cursor: "pointer" as any,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: {
    gap: 16,
  },
  emptyContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  } as any,
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    maxWidth: 450,
    textAlign: "center",
    lineHeight: 22,
  },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  notificationItem: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    position: "relative",
    cursor: "pointer" as any,
    transitionProperty: "background-color",
    transitionDuration: "0.15s",
  } as any,
  unreadDot: {
    position: "absolute",
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemTime: {
    fontSize: 12,
  },
  itemMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  markReadBtn: {
    padding: 8,
    marginLeft: 16,
    cursor: "pointer" as any,
  } as any,
});
