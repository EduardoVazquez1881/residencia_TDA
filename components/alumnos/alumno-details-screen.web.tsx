import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  actualizarAlumno,
  AlumnoData,
  getAlumno,
} from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

export function AlumnoDetailsScreen() {
  const { id } = useLocalSearchParams();
  const alumnoId = parseInt(id as string);

  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [alumno, setAlumno] = useState<AlumnoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State para la edición
  const [pseudonimo, setPseudonimo] = useState("");
  const [nivelTea, setNivelTea] = useState<number | null>(null);
  const [escuelaActual, setEscuelaActual] = useState("");
  const [grado, setGrado] = useState("");
  const [grupo, setGrupo] = useState("");
  const [horario, setHorario] = useState("");
  const [adecuacion, setAdecuacion] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setCurrentUid(session.user.id);

        const data = await getAlumno(alumnoId);
        if (data) {
          setAlumno(data);
          syncFormState(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [alumnoId]);

  const syncFormState = (data: AlumnoData) => {
    setPseudonimo(data.pseudonimo || "");
    setNivelTea(data.nivel_tea || null);
    setEscuelaActual(data.escuela_actual || "");
    setGrado(data.grado_escolar || "");
    setGrupo(data.grupo_escolar || "");
    setHorario(data.horario_habitual || "");
    setAdecuacion(data.adecuacion_curricular || "");
    setNotas(data.notas_generales || "");
  };

  const handleSave = async () => {
    if (!pseudonimo.trim()) {
      Alert.alert("Error", "El pseudónimo es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pseudonimo: pseudonimo.trim(),
        nivel_tea: nivelTea,
        escuela_actual: escuelaActual.trim() || null,
        grado_escolar: grado.trim() || null,
        grupo_escolar: grupo.trim() || null,
        horario_habitual: horario.trim() || null,
        adecuacion_curricular: adecuacion.trim() || null,
        notas_generales: notas.trim() || null,
      };

      const res = await actualizarAlumno(alumnoId, payload, currentUid);

      if (res.error) {
        Alert.alert("Error al actualizar", res.error);
        return;
      }

      if (alumno) {
        setAlumno({ ...alumno, ...payload });
      }
      setIsEditing(false);
      Alert.alert("¡Éxito!", "La información ha sido actualizada.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un error guardando la información.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (alumno) syncFormState(alumno);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!alumno) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No se encontró el alumno.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreator = currentUid === alumno.creado_por;
  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  } as const;

  return (
    <WebDashboardLayout>
      <>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (isEditing ? cancelEdit() : router.back())}
            style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
          >
            <Ionicons name={isEditing ? "close" : "arrow-back"} size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, flex: 1 }]}>
            {isEditing ? "Editar Alumno" : "Perfil del Alumno"}
          </Text>
          {isCreator && !isEditing && (
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: `${colors.primary}15` }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 6 }}>Editar Perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.avatarSection}>
          <View style={[styles.bigAvatar, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
            <Text style={[styles.bigAvatarText, { color: colors.primary }]}>{pseudonimo.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.topName, { color: colors.text }]}>{alumno.pseudonimo}</Text>
            <Text style={[styles.topDate, { color: colors.textSecondary }]}>
              Registrado el {new Date(alumno.creado_en).toLocaleDateString()}
            </Text>
          </View>
          {isEditing && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={cancelEdit} style={[styles.actionBtn, { backgroundColor: isDark ? '#ffffff10' : '#f1f5f9' }]}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <PrimaryButton title="Guardar Cambios" onPress={handleSave} loading={saving} style={{ height: 44, paddingHorizontal: 20 }} />
            </View>
          )}
        </View>

        <View style={styles.gridRow}>
          <View style={styles.col}>
            {/* INFORMACIÓN GENERAL */}
            <View style={[styles.sectionCard, cardStyle]}>
              <SectionHeader icon="information-circle-outline" label="Información General" color={colors.primary} />
              
              {isEditing ? (
                <View>
                  <View style={styles.field}>
                    <FormLabel label="Pseudónimo" required />
                    <FormInput placeholder="Ej. Leo, Dani..." value={pseudonimo} onChangeText={setPseudonimo} />
                  </View>
                  <View style={styles.field}>
                    <FormLabel label="Nivel TEA" />
                    <View style={styles.teaGrid}>
                      {[1, 2, 3].map((n) => {
                        const sel = nivelTea === n;
                        const nColor = n === 1 ? "#10b981" : n === 2 ? "#f59e0b" : "#ef4444";
                        return (
                          <TouchableOpacity
                            key={n}
                            onPress={() => setNivelTea(n)}
                            style={[styles.teaBtn, { backgroundColor: sel ? nColor : (isDark ? "#ffffff08" : "#f1f5f9") }]}
                          >
                            <Text style={{ color: sel ? "#fff" : colors.textSecondary, fontWeight: sel ? "bold" : "500" }}>Nivel {n}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        onPress={() => setNivelTea(null)}
                        style={[styles.teaBtn, { backgroundColor: nivelTea === null ? colors.primary : (isDark ? "#ffffff08" : "#f1f5f9") }]}
                      >
                        <Text style={{ color: nivelTea === null ? "#fff" : colors.textSecondary, fontWeight: nivelTea === null ? "bold" : "500" }}>Sin Nivel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.readonlyGrid}>
                  <ReadonlyItem label="Pseudónimo" value={alumno.pseudonimo} icon="person-outline" colors={colors} />
                  <ReadonlyItem label="Nivel TEA" value={alumno.nivel_tea ? `Nivel ${alumno.nivel_tea}` : "Sin clasificar"} icon="bar-chart-outline" colors={colors} />
                </View>
              )}
            </View>

            {/* ENTORNO EDUCATIVO */}
            <View style={[styles.sectionCard, cardStyle]}>
              <SectionHeader icon="school-outline" label="Entorno Educativo" color="#8b5cf6" />
              
              {isEditing ? (
                <View>
                  <View style={styles.field}>
                     <FormLabel label="Escuela Actual" />
                     <FormInput placeholder="Nombre de la escuela" value={escuelaActual} onChangeText={setEscuelaActual} />
                  </View>
                  <View style={styles.row}>
                     <View style={{ flex: 1 }}>
                       <FormLabel label="Grado" />
                       <FormInput placeholder="Ej. 3ro" value={grado} onChangeText={setGrado} />
                     </View>
                     <View style={{ width: 16 }} />
                     <View style={{ flex: 1 }}>
                       <FormLabel label="Grupo" />
                       <FormInput placeholder="Ej. B" value={grupo} onChangeText={setGrupo} />
                     </View>
                  </View>
                  <View style={styles.field}>
                    <FormLabel label="Horario Habitual" />
                    <FormInput placeholder="Ej. 8:00 AM - 1:00 PM" value={horario} onChangeText={setHorario} />
                  </View>
                </View>
              ) : (
                <View style={styles.readonlyGridVertical}>
                   <ReadonlyItem label="Escuela" value={alumno.escuela_actual || "No especificada"} icon="business-outline" colors={colors} />
                   <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <ReadonlyItem label="Grado" value={alumno.grado_escolar || "-"} colors={colors} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ReadonlyItem label="Grupo" value={alumno.grupo_escolar || "-"} colors={colors} />
                      </View>
                   </View>
                   <ReadonlyItem label="Horario" value={alumno.horario_habitual || "No especificado"} icon="time-outline" colors={colors} />
                </View>
              )}
            </View>
          </View>

          <View style={styles.col}>
            {/* ADECUACIONES Y NOTAS */}
            <View style={[styles.sectionCard, cardStyle, { flex: 1 }]}>
              <SectionHeader icon="document-text-outline" label="Observaciones y Adecuaciones" color="#10b981" />
              
              {isEditing ? (
                <View style={{ flex: 1 }}>
                  <View style={styles.field}>
                    <FormLabel label="Adecuación Curricular" />
                    <FormTextArea placeholder="Adaptaciones en el aula..." value={adecuacion} onChangeText={setAdecuacion} minHeight={120} />
                  </View>
                  <View style={styles.field}>
                    <FormLabel label="Notas Generales" />
                    <FormTextArea placeholder="Notas u observaciones médicas..." value={notas} onChangeText={setNotas} minHeight={120} />
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={{ marginBottom: 24 }}>
                    <Text style={[styles.readonlyLabel, { color: colors.textSecondary }]}>Adecuación Curricular</Text>
                    <Text style={[styles.longText, { color: alumno.adecuacion_curricular ? colors.text : colors.textSecondary }]}>
                      {alumno.adecuacion_curricular || "No hay adecuaciones registradas."}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.readonlyLabel, { color: colors.textSecondary }]}>Notas Generales</Text>
                    <Text style={[styles.longText, { color: alumno.notas_generales ? colors.text : colors.textSecondary }]}>
                      {alumno.notas_generales || "Sin notas adicionales."}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    </WebDashboardLayout>
  );
}

function SectionHeader({ icon, label, color }: any) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ReadonlyItem({ label, value, icon, colors }: any) {
  return (
    <View style={styles.readonlyCont}>
      <Text style={[styles.readonlyLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.readonlyValueRow}>
         {icon && <Ionicons name={icon} size={16} color={colors.text} style={{ marginRight: 8, opacity: 0.6 }} />}
         <Text style={[styles.readonlyValueText, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  avatarSection: { 
    flexDirection: 'row', 
    alignItems: "center", 
    marginBottom: 32,
    gap: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  bigAvatar: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 2,
  },
  bigAvatarText: { fontSize: 32, fontWeight: "800" },
  topName: { fontSize: 28, fontWeight: "800", marginBottom: 2 },
  topDate: { fontSize: 14 },
  gridRow: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  col: { flex: 1, minWidth: 400 },
  sectionCard: { borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: "800" },
  field: { marginBottom: 20 },
  row: { flexDirection: "row" },
  teaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  teaBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  readonlyGrid: { flexDirection: "row", gap: 32 },
  readonlyGridVertical: { flexDirection: "column", gap: 20 },
  readonlyCont: { flex: 1 },
  readonlyLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  readonlyValueRow: { flexDirection: "row", alignItems: "center" },
  readonlyValueText: { fontSize: 16, fontWeight: "600" },
  longText: { fontSize: 15, lineHeight: 24 },
});
