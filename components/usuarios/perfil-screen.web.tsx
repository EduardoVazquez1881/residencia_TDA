import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession, logout } from "@/services/auth.service";
import { getUsuario, UsuarioData } from "@/services/usuarios.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function PerfilScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const session = await getCurrentSession();
      if (!session) return;
      const data = await getUsuario(session.user.id);
      setUsuario(data);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      await logout();
      router.replace("/");
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mi Perfil (WEB)</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Gestiona tu información personal y cuenta
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.leftCol}>
          <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {usuario?.nombres?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {usuario?.nombres} {usuario?.apellidos}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {usuario?.correo}
                </Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}10` }]}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{usuario?.rol}</Text>
              </View>
            </View>

            <View style={[styles.infoGrid, { borderTopColor: colors.border }]}>
               <InfoItem label="Institución" value={usuario?.institucion || "No especificada"} icon="business-outline" />
               <InfoItem label="ID de Usuario" value={usuario?.usuario_id || "-"} icon="id-card-outline" />
               <InfoItem label="Miembro desde" value={new Date(usuario?.creado_en || "").toLocaleDateString()} icon="calendar-outline" />
            </View>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Seguridad y Cuenta</Text>
            
            <TouchableOpacity style={styles.menuItem}>
               <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
                 <Ionicons name="key-outline" size={20} color="#3b82f6" />
               </View>
               <Text style={[styles.menuText, { color: colors.text }]}>Cambiar Contraseña</Text>
               <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
               <View style={[styles.menuIcon, { backgroundColor: '#f5f3ff' }]}>
                 <Ionicons name="notifications-outline" size={20} color="#8b5cf6" />
               </View>
               <Text style={[styles.menuText, { color: colors.text }]}>Notificaciones</Text>
               <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
               <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
                 <Ionicons name="log-out-outline" size={20} color="#ef4444" />
               </View>
               <Text style={[styles.menuText, { color: "#ef4444" }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </WebDashboardLayout>
  );
}

function InfoItem({ label, value, icon }: any) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme as 'light' | 'dark'];
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={{ width: 24 }} />
      <View>
        <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  grid: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  leftCol: { flex: 2, minWidth: 400 },
  rightCol: { flex: 1, minWidth: 350 },
  card: { borderRadius: 24, padding: 32, borderWidth: 1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 15 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  infoGrid: { paddingTop: 32, borderTopWidth: 1, gap: 24 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
