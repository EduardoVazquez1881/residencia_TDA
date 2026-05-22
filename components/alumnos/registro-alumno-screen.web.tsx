import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import {
  crearAlumno,
  pseudonimoExisteParaUsuario,
} from "@/services/alumnos.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

// ─── Niveles TEA ──────────────────────────────────────────────────────────────
const NIVELES_TEA = [
  { id: 1, label: "Nivel 1", desc: "Requiere apoyo" },
  { id: 2, label: "Nivel 2", desc: "Apoyo sustancial" },
  { id: 3, label: "Nivel 3", desc: "Apoyo muy sustancial" },
];

export function RegistroAlumnoScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  // — Estado del formulario —
  const [pseudonimo, setPseudonimo] = useState("");
  const [fechaNacStr, setFechaNacStr] = useState(""); // Usaremos string para web input date
  
  const [nivelTea, setNivelTea] = useState<number | null>(null);
  const [escuela, setEscuela] = useState("");
  const [grado, setGrado] = useState("");
  const [grupo, setGrupo] = useState("");
  const [horario, setHorario] = useState("");
  const [adecuacion, setAdecuacion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ pseudonimo: "" });

  const validate = () => {
    const newErrors = { pseudonimo: "" };
    if (!pseudonimo.trim()) {
      newErrors.pseudonimo = "El pseudónimo es requerido";
    }
    setErrors(newErrors);
    return !newErrors.pseudonimo;
  };

  const handleGuardar = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        Alert.alert("Error", "No hay sesión activa. Inicia sesión nuevamente.");
        return;
      }

      const uid = session.user.id;

      const existe = await pseudonimoExisteParaUsuario(pseudonimo.trim(), uid);
      if (existe) {
        setLoading(false);
        Alert.alert(
          "Pseudónimo ya registrado",
          `Ya tienes un alumno con el pseudónimo "${pseudonimo.trim()}" en tus registros.\n\n¿Deseas continuar de todas formas?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Continuar",
              style: "destructive",
              onPress: () => doGuardar(uid),
            },
          ],
        );
        return;
      }

      await doGuardar(uid);
    } catch {
      Alert.alert("Error", "Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const doGuardar = async (uid: string) => {
    setLoading(true);
    try {
      const result = await crearAlumno({
        pseudonimo: pseudonimo.trim(),
        fecha_nacimiento: fechaNacStr || null,
        nivel_tea: nivelTea,
        escuela_actual: escuela.trim() || null,
        grado_escolar: grado.trim() || null,
        grupo_escolar: grupo.trim() || null,
        horario_habitual: horario.trim() || null,
        adecuacion_curricular: adecuacion.trim() || null,
        notas_generales: notas.trim() || null,
        creado_por: uid,
      });

      if (result.error) {
        alert("Error al guardar: " + result.error);
        return;
      }

      alert(`¡Alumno registrado!\n\nEl alumno "${pseudonimo.trim()}" ha sido registrado exitosamente.`);
      router.replace("/alumnos" as any);
    } catch {
      alert("Error: No se pudo guardar el alumno.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  } as const;

  return (
    <WebDashboardLayout>
      <>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Nuevo Alumno</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Registra un nuevo seguimiento</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.gridRow}>
          {/* COLUMNA IZQUIERDA: DATOS BÁSICOS */}
          <View style={styles.col}>
            <View style={[styles.sectionCard, cardStyle]}>
              <SectionHeader icon="id-card-outline" label="Datos Básicos" color={colors.primary} bg={`${colors.primary}18`} />
              
              <View style={styles.field}>
                <FormLabel label="Pseudónimo" required error={errors.pseudonimo} helperText="Identificador único (no usar nombre real)" />
                <FormInput
                  placeholder="Ej. Delfín, Águila..."
                  icon="at-outline"
                  value={pseudonimo}
                  onChangeText={(t) => {
                    setPseudonimo(t);
                    if (errors.pseudonimo) setErrors({ ...errors, pseudonimo: "" });
                  }}
                />
              </View>

              <View style={styles.field}>
                <FormLabel label="Fecha de Nacimiento" helperText="Opcional" />
                <input 
                  type="date"
                  value={fechaNacStr}
                  onChange={(e) => setFechaNacStr(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: isDark ? '#ffffff08' : '#f8fafc',
                    color: colors.text,
                    fontSize: '16px',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </View>

              <View style={styles.field}>
                <FormLabel label="Nivel TEA" />
                <View style={styles.nivelRow}>
                  {NIVELES_TEA.map((n) => {
                    const selected = nivelTea === n.id;
                    return (
                      <TouchableOpacity
                        key={n.id}
                        onPress={() => setNivelTea(n.id)}
                        style={[
                          styles.nivelCard,
                          {
                            backgroundColor: selected ? `${colors.primary}20` : (isDark ? colors.background : "#f8fafc"),
                            borderColor: selected ? colors.primary : "transparent",
                          },
                        ]}
                      >
                        <Text style={[styles.nivelBadge, { backgroundColor: selected ? colors.primary : (isDark ? "#ffffff10" : "#e2e8f0"), color: selected ? "#fff" : colors.textSecondary }]}>
                          {n.id}
                        </Text>
                        <Text style={[styles.nivelLabel, { color: selected ? colors.primary : colors.text }]}>{n.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, cardStyle]}>
              <SectionHeader icon="school-outline" label="Datos Escolares" color="#8b5cf6" bg="#f5f3ff" bgDark="#251e2d" isDark={isDark} />
              <View style={styles.field}>
                <FormLabel label="Escuela Actual" />
                <FormInput placeholder="Nombre de la escuela" icon="business-outline" value={escuela} onChangeText={setEscuela} />
              </View>
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <FormLabel label="Grado" />
                  <FormInput placeholder="3°" value={grado} onChangeText={setGrado} />
                </View>
                <View style={{ flex: 1 }}>
                  <FormLabel label="Grupo" />
                  <FormInput placeholder="B" value={grupo} onChangeText={setGrupo} />
                </View>
              </View>
              <View style={styles.field}>
                <FormLabel label="Horario Habitual" />
                <FormInput placeholder="Lunes a viernes 8:00 - 13:00" icon="time-outline" value={horario} onChangeText={setHorario} />
              </View>
            </View>
          </View>

          {/* COLUMNA DERECHA: INFORMACIÓN ADICIONAL */}
          <View style={styles.col}>
            <View style={[styles.sectionCard, cardStyle, { flex: 1 }]}>
              <SectionHeader icon="document-text-outline" label="Información Adicional" color="#10b981" bg="#ecfdf5" bgDark="#1a2e27" isDark={isDark} />
              
              <View style={styles.field}>
                <FormLabel label="Adecuación Curricular" />
                <FormTextArea placeholder="Describe los apoyos específicos..." value={adecuacion} onChangeText={setAdecuacion} minHeight={120} />
              </View>

              <View style={styles.field}>
                <FormLabel label="Notas Generales" />
                <FormTextArea placeholder="Observaciones relevantes..." value={notas} onChangeText={setNotas} minHeight={120} />
              </View>
            </View>

            <View style={{ marginTop: 20 }}>
              <PrimaryButton
                title="Registrar Alumno"
                loading={loading}
                disabled={loading || !pseudonimo.trim()}
                onPress={handleGuardar}
                icon={!loading ? <Ionicons name="checkmark-circle-outline" size={20} color="#fff" /> : undefined}
              />
            </View>
          </View>
        </View>
      </>
    </WebDashboardLayout>
  );
}

function SectionHeader({ icon, label, color, bg, bgDark, isDark = false }: any) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionIcon, { backgroundColor: isDark && bgDark ? bgDark : bg }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 16,
    marginTop: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  gridRow: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  col: {
    flex: 1,
    minWidth: 350,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  field: {
    marginBottom: 20,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  nivelRow: {
    flexDirection: "row",
    gap: 12,
  },
  nivelCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  nivelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: "800",
    fontSize: 16,
  },
  nivelLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});
