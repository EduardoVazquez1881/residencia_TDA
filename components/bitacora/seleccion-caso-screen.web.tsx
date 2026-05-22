import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { getCasosListosParaBitacora } from "@/services/bitacoras.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function SeleccionCasoScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCasos = async (active: boolean) => {
    const session = await getCurrentSession();
    if (session && active) {
      const res = await getCasosListosParaBitacora(session.user.id);
      setCasos(res);
    }
    if (active) setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fetchCasos(active);
      return () => { active = false; };
    }, [])
  );

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  };

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nueva Bitácora</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Selecciona un expediente para comenzar el registro de sesión
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>Cargando expedientes disponibles...</Text>
        </View>
      ) : casos.length === 0 ? (
        <View style={[styles.emptyBox, cardStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin casos configurados</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            No tienes casos activos con una plantilla asignada. Asegúrate de que el expediente tenga un formato de bitácora definido.
          </Text>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
            onPress={() => router.push("/expedientes" as any)}
          >
            <Text style={{ color: "#fff", fontWeight: '700' }}>Ir a Expedientes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {casos.map((caso) => {
            const pseudonimo = caso.alumnos?.pseudonimo || "Desconocido";
            const inicial = pseudonimo.charAt(0).toUpperCase();

            return (
              <TouchableOpacity
                key={caso.caso_id}
                style={[styles.casoCard, cardStyle]}
                onPress={() => router.push(`/nueva-bitacora?casoId=${caso.caso_id}&plantillaId=${caso.plantilla_id}` as any)}
              >
                <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{inicial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.casoName, { color: colors.text }]}>{pseudonimo}</Text>
                  <Text style={[styles.casoDesc, { color: colors.textSecondary }]}>
                    {caso.plantillas?.nombre || "Plantilla asignada"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  casoCard: {
    width: 'calc(33.333% - 16px)' as any,
    minWidth: 320,
    maxWidth: '100%',
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 20,
  },
  avatar: { width: 56, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 24, fontWeight: "800" },
  casoName: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  casoDesc: { fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400 },
  emptyBox: { 
    maxWidth: 600, 
    padding: 60, 
    borderRadius: 32, 
    alignItems: "center", 
    alignSelf: 'center',
    borderWidth: 1,
  },
  iconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12 },
  emptyDesc: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  actionBtn: { paddingHorizontal: 24, height: 48, borderRadius: 12, justifyContent: 'center' },
});
