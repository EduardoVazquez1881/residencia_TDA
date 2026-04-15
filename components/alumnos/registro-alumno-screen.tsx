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
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Niveles TEA ──────────────────────────────────────────────────────────────
const NIVELES_TEA = [
  { id: 1, label: "Nivel 1", desc: "Requiere\napoyo" },
  { id: 2, label: "Nivel 2", desc: "Apoyo\nsustancial" },
  { id: 3, label: "Nivel 3", desc: "Apoyo muy\nsustancial" },
];

// ─── Helper: convertir DD/MM/AAAA → YYYY-MM-DD ───────────────────────────────
function parseFechaISO(
  dia: string,
  mes: string,
  anio: string,
): string | null {
  const d = parseInt(dia, 10);
  const m = parseInt(mes, 10);
  const y = parseInt(anio, 10);
  const now = new Date().getFullYear();

  if (
    isNaN(d) || isNaN(m) || isNaN(y) ||
    d < 1 || d > 31 ||
    m < 1 || m > 12 ||
    y < 1900 || y > now
  ) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}`;
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export function RegistroAlumnoScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  // — Estado del formulario —
  const [pseudonimo, setPseudonimo] = useState("");
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [nivelTea, setNivelTea] = useState<number | null>(null);
  const [escuela, setEscuela] = useState("");
  const [grado, setGrado] = useState("");
  const [grupo, setGrupo] = useState("");
  const [horario, setHorario] = useState("");
  const [adecuacion, setAdecuacion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ pseudonimo: "", fecha: "" });

  // — Refs para fecha —
  const mesRef = useRef<TextInput>(null);
  const anioRef = useRef<TextInput>(null);

  // — Animación de entrada —
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // — Validación básica —
  const validate = () => {
    const newErrors = { pseudonimo: "", fecha: "" };
    if (!pseudonimo.trim()) {
      newErrors.pseudonimo = "El pseudónimo es requerido";
    }
    // Validar fecha solo si alguno de los campos fue llenado
    const fechaIngresada = dia || mes || anio;
    if (fechaIngresada) {
      if (!parseFechaISO(dia, mes, anio)) {
        newErrors.fecha = "Fecha inválida (DD / MM / AAAA)";
      }
    }
    setErrors(newErrors);
    return !newErrors.pseudonimo && !newErrors.fecha;
  };

  // — Guardar alumno —
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

      // Verificar duplicado por usuario
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
      const fechaISO =
        dia || mes || anio ? parseFechaISO(dia, mes, anio) : null;

      const result = await crearAlumno({
        pseudonimo: pseudonimo.trim(),
        fecha_nacimiento: fechaISO,
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
        Alert.alert("Error al guardar", result.error);
        return;
      }

      Alert.alert(
        "¡Alumno registrado!",
        `El alumno "${pseudonimo.trim()}" ha sido registrado exitosamente.`,
        [{ text: "Aceptar", onPress: () => router.back() }],
      );
    } catch {
      Alert.alert("Error", "No se pudo guardar el alumno.");
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Nuevo Alumno
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Completa los datos del alumno
            </Text>
          </View>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: `${colors.primary}18` },
            ]}
          >
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            SECCIÓN 1 — DATOS BÁSICOS
        ══════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader
            icon="id-card-outline"
            label="Datos Básicos"
            color={colors.primary}
            bg={`${colors.primary}18`}
          />

          {/* Pseudónimo */}
          <View style={styles.field}>
            <FormLabel
              label="Pseudónimo"
              required
              error={errors.pseudonimo}
              helperText="Identificador único para el alumno (no se usa el nombre real)"
            />
            <FormInput
              placeholder="Ej. Delfín, Águila, Cometa..."
              icon="at-outline"
              value={pseudonimo}
              onChangeText={(t) => {
                setPseudonimo(t);
                if (errors.pseudonimo) setErrors({ ...errors, pseudonimo: "" });
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Fecha de nacimiento */}
          <View style={styles.field}>
            <FormLabel
              label="Fecha de Nacimiento"
              error={errors.fecha}
              helperText="Opcional — Día / Mes / Año"
            />
            <View style={styles.dateRow}>
              {/* Día */}
              <View style={styles.dateFieldSmall}>
                <Text style={[styles.dateSublabel, { color: colors.textSecondary }]}>
                  Día
                </Text>
                <TextInput
                  value={dia}
                  onChangeText={(t) => {
                    const clean = t.replace(/\D/g, "").slice(0, 2);
                    setDia(clean);
                    if (errors.fecha) setErrors({ ...errors, fecha: "" });
                    if (clean.length === 2) mesRef.current?.focus();
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="DD"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: errors.fecha ? colors.error : colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.dateSep, { color: colors.textSecondary }]}>/</Text>

              {/* Mes */}
              <View style={styles.dateFieldSmall}>
                <Text style={[styles.dateSublabel, { color: colors.textSecondary }]}>
                  Mes
                </Text>
                <TextInput
                  ref={mesRef}
                  value={mes}
                  onChangeText={(t) => {
                    const clean = t.replace(/\D/g, "").slice(0, 2);
                    setMes(clean);
                    if (errors.fecha) setErrors({ ...errors, fecha: "" });
                    if (clean.length === 2) anioRef.current?.focus();
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: errors.fecha ? colors.error : colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.dateSep, { color: colors.textSecondary }]}>/</Text>

              {/* Año */}
              <View style={styles.dateFieldLarge}>
                <Text style={[styles.dateSublabel, { color: colors.textSecondary }]}>
                  Año
                </Text>
                <TextInput
                  ref={anioRef}
                  value={anio}
                  onChangeText={(t) => {
                    const clean = t.replace(/\D/g, "").slice(0, 4);
                    setAnio(clean);
                    if (errors.fecha) setErrors({ ...errors, fecha: "" });
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="AAAA"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: errors.fecha ? colors.error : colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </View>

              {/* Limpiar fecha */}
              {(dia || mes || anio) ? (
                <TouchableOpacity
                  onPress={() => { setDia(""); setMes(""); setAnio(""); setErrors({ ...errors, fecha: "" }); }}
                  style={styles.clearDate}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Nivel TEA */}
          <View style={styles.field}>
            <FormLabel
              label="Nivel TEA"
              helperText="Clasificación según DSM-5"
            />
            <View style={styles.nivelRow}>
              {NIVELES_TEA.map((n) => {
                const selected = nivelTea === n.id;
                return (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => setNivelTea(n.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.nivelCard,
                      {
                        backgroundColor: selected
                          ? isDark ? `${colors.primary}28` : "#e0f2fe"
                          : colors.input,
                        borderColor: selected ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.nivelBadge,
                        { backgroundColor: selected ? colors.primary : colors.inputBorder },
                      ]}
                    >
                      <Text style={styles.nivelBadgeText}>{n.id}</Text>
                    </View>
                    <Text
                      style={[
                        styles.nivelLabel,
                        { color: selected ? colors.primary : colors.text },
                      ]}
                    >
                      {n.label}
                    </Text>
                    <Text
                      style={[
                        styles.nivelDesc,
                        {
                          color: selected ? colors.primary : colors.textSecondary,
                          opacity: selected ? 0.85 : 0.8,
                        },
                      ]}
                    >
                      {n.desc}
                    </Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primary}
                        style={{ marginTop: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            SECCIÓN 2 — DATOS ESCOLARES
        ══════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader
            icon="school-outline"
            label="Datos Escolares"
            color="#8b5cf6"
            bg="#f5f3ff"
            bgDark="#251e2d"
            isDark={isDark}
          />

          <View style={styles.field}>
            <FormLabel label="Escuela Actual" />
            <FormInput
              placeholder="Ej. Escuela Primaria Benito Juárez"
              icon="business-outline"
              value={escuela}
              onChangeText={setEscuela}
            />
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FormLabel label="Grado" />
              <FormInput
                placeholder="Ej. 3°"
                icon="ribbon-outline"
                value={grado}
                onChangeText={setGrado}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormLabel label="Grupo" />
              <FormInput
                placeholder="Ej. B"
                icon="people-outline"
                value={grupo}
                onChangeText={setGrupo}
              />
            </View>
          </View>

          <View style={styles.field}>
            <FormLabel
              label="Horario Habitual"
              helperText="Ej. Lunes a viernes 8:00–13:00"
            />
            <FormInput
              placeholder="Ej. Lunes a viernes 8:00–13:00"
              icon="time-outline"
              value={horario}
              onChangeText={setHorario}
            />
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            SECCIÓN 3 — INFORMACIÓN ADICIONAL
        ══════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader
            icon="document-text-outline"
            label="Información Adicional"
            color="#10b981"
            bg="#ecfdf5"
            bgDark="#1a2e27"
            isDark={isDark}
          />

          <View style={styles.field}>
            <FormLabel
              label="Adecuación Curricular"
              helperText="Ajustes o apoyos específicos en el ámbito escolar"
            />
            <FormTextArea
              placeholder="Describe las adecuaciones curriculares..."
              value={adecuacion}
              onChangeText={setAdecuacion}
              minHeight={110}
            />
          </View>

          <View style={styles.field}>
            <FormLabel
              label="Notas Generales"
              helperText="Observaciones adicionales relevantes"
            />
            <FormTextArea
              placeholder="Notas relevantes sobre el alumno..."
              value={notas}
              onChangeText={setNotas}
              minHeight={110}
            />
          </View>
        </View>

        {/* ── Botón guardar ── */}
        <PrimaryButton
          title="Registrar Alumno"
          loading={loading}
          disabled={loading || !pseudonimo.trim()}
          onPress={handleGuardar}
          icon={
            !loading ? (
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            ) : undefined
          }
        />

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-componente: encabezado de sección ────────────────────────────────────
function SectionHeader({
  icon,
  label,
  color,
  bg,
  bgDark,
  isDark = false,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  bgDark?: string;
  isDark?: boolean;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: isDark && bgDark ? bgDark : bg },
        ]}
      >
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // Sección card
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // Campo
  field: {
    marginBottom: 18,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  // Fecha
  dateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  dateFieldSmall: {
    flex: 2,
  },
  dateFieldLarge: {
    flex: 3,
  },
  dateSublabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 5,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  dateSep: {
    fontSize: 20,
    fontWeight: "300",
    marginBottom: 10,
  },
  clearDate: {
    marginBottom: 8,
    padding: 4,
  },

  // Nivel TEA
  nivelRow: {
    flexDirection: "row",
    gap: 10,
  },
  nivelCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  nivelBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  nivelBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  nivelLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  nivelDesc: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
