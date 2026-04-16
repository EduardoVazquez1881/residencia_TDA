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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

      // Actualizar vista
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
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
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 4 }}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AVATAR Y METADATOS BÁSICOS */}
        <View style={styles.avatarSection}>
           <View style={[styles.bigAvatar, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40`, borderWidth: 2 }]}>
             <Text style={[styles.bigAvatarText, { color: colors.primary }]}>{pseudonimo.charAt(0).toUpperCase()}</Text>
           </View>
           {!isEditing && (
             <>
               <Text style={[styles.topName, { color: colors.text }]}>{alumno.pseudonimo}</Text>
               <Text style={[styles.topDate, { color: colors.textSecondary }]}>Registrado el {new Date(alumno.creado_en).toLocaleDateString()}</Text>
             </>
           )}
        </View>

        {/* 1. INFORMACIÓN PRINCIPAL */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader icon="information-circle-outline" label="Información General" color={colors.primary} />
          
          {isEditing ? (
            <View>
              <View style={styles.field}>
                <FormLabel label="Pseudónimo" required />
                <FormInput
                  placeholder="Ej. Leo, Dani..."
                  value={pseudonimo}
                  onChangeText={setPseudonimo}
                />
              </View>
              <View style={styles.field}>
                <FormLabel label="Nivel TEA (Requeridos apoyos)" />
                <View style={styles.teaGrid}>
                  {[1, 2, 3].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setNivelTea(n)}
                      style={[
                        styles.teaBtn,
                        {
                          backgroundColor:
                            nivelTea === n
                              ? n === 1 ? "#10b981" : n === 2 ? "#f59e0b" : "#ef4444"
                              : isDark ? "#ffffff10" : "#f1f5f9",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: nivelTea === n ? "#fff" : colors.textSecondary,
                          fontWeight: nivelTea === n ? "bold" : "500",
                        }}
                      >
                        Nivel {n}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setNivelTea(null)}
                    style={[
                      styles.teaBtn,
                      {
                        backgroundColor: nivelTea === null ? `${colors.primary}` : isDark ? "#ffffff10" : "#f1f5f9",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: nivelTea === null ? "#fff" : colors.textSecondary,
                        fontWeight: nivelTea === null ? "bold" : "500",
                      }}
                    >
                      Sin Nivel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.readonlyGrid}>
              <ReadonlyItem label="Pseudónimo" value={alumno.pseudonimo} icon="person-outline" colors={colors} isDark={isDark} />
              <ReadonlyItem label="Nivel TEA" value={alumno.nivel_tea ? `Grado ${alumno.nivel_tea}` : "Sin clasificar"} icon="bar-chart-outline" colors={colors} isDark={isDark} />
            </View>
          )}
        </View>

        {/* 2. ENTORNO EDUCATIVO */}
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
                 <View style={{ width: 15 }} />
                 <View style={{ flex: 1 }}>
                   <FormLabel label="Grupo" />
                   <FormInput placeholder="Ej. B" value={grupo} onChangeText={setGrupo} />
                 </View>
              </View>
              <View style={styles.field}>
                <FormLabel label="Horario Habitual" />
                <FormInput placeholder="Ej. 8:00 AM - 1:00 PM" value={horario} onChangeText={setHorario} />
              </View>
              <View style={styles.field}>
                <FormLabel label="Adecuación Curricular" />
                <FormTextArea placeholder="Adaptaciones en el aula..." value={adecuacion} onChangeText={setAdecuacion} minHeight={80} />
              </View>
            </View>
          ) : (
            <View style={styles.readonlyGridVertical}>
               <ReadonlyItem label="Escuela" value={alumno.escuela_actual || "No especificada"} icon="business-outline" colors={colors} isDark={isDark} />
               <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <ReadonlyItem label="Grado" value={alumno.grado_escolar || "-"} colors={colors} isDark={isDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ReadonlyItem label="Grupo" value={alumno.grupo_escolar || "-"} colors={colors} isDark={isDark} />
                  </View>
               </View>
               <ReadonlyItem label="Horario" value={alumno.horario_habitual || "No especificado"} icon="time-outline" colors={colors} isDark={isDark} />
               {alumno.adecuacion_curricular ? (
                   <View style={{ marginTop: 10 }}>
                     <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 5 }}>Adecuación Curricular</Text>
                     <Text style={{ fontSize: 14, color: colors.text }}>{alumno.adecuacion_curricular}</Text>
                   </View>
               ) : null}
            </View>
          )}
        </View>

        {/* 3. NOTAS */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader icon="document-text-outline" label="Notas Generales" color="#f59e0b" />
          {isEditing ? (
            <View style={styles.field}>
              <FormTextArea placeholder="Notas u observaciones médicas..." value={notas} onChangeText={setNotas} minHeight={100} />
            </View>
          ) : (
            <Text style={{ color: alumno.notas_generales ? colors.text : colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
              {alumno.notas_generales || "No hay notas u observaciones guardadas."}
            </Text>
          )}
        </View>

        <View style={{ height: 20 }} />

        {isEditing && (
           <PrimaryButton
             title="Guardar Cambios"
             onPress={handleSave}
             loading={saving}
             icon={<Ionicons name="save-outline" size={20} color="#fff" />}
           />
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Subcomponente de estilo
function SectionHeader({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ReadonlyItem({ label, value, icon, colors, isDark }: any) {
  return (
    <View style={styles.readonlyCont}>
      <Text style={[styles.readonlyLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.readonlyValueRow}>
         {icon && <Ionicons name={icon} size={16} color={colors.text} style={{ marginRight: 6, opacity: 0.6 }} />}
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
  headerTitle: { fontSize: 20, fontWeight: "700" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  bigAvatarText: { fontSize: 34, fontWeight: "bold" },
  topName: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  topDate: { fontSize: 13 },
  sectionCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  sectionLabel: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  field: { marginBottom: 15 },
  row: { flexDirection: "row" },
  teaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 },
  teaBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  readonlyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  readonlyGridVertical: { flexDirection: "column", gap: 15 },
  readonlyCont: { flex: 1, minWidth: "40%" },
  readonlyLabel: { fontSize: 12, marginBottom: 4 },
  readonlyValueRow: { flexDirection: "row", alignItems: "center" },
  readonlyValueText: { fontSize: 15, fontWeight: "500" },
});
