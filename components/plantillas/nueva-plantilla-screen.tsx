import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import {
  WizardCampo,
  WizardOpcion,
  WizardSeccion,
  crearPlantillaCompleta,
  generarClave,
} from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tipos de campo disponibles ───────────────────────────────────────────────
const TIPOS_CAMPO = [
  { tipo: "texto", label: "Texto", icon: "text-outline" as const, color: "#3b82f6" },
  { tipo: "textarea", label: "Párrafo", icon: "document-text-outline" as const, color: "#8b5cf6" },
  { tipo: "numero", label: "Número", icon: "calculator-outline" as const, color: "#06b6d4" },
  { tipo: "fecha", label: "Fecha", icon: "calendar-outline" as const, color: "#10b981" },
  { tipo: "radio", label: "Opción única", icon: "radio-button-on-outline" as const, color: "#f59e0b" },
  { tipo: "select", label: "Lista", icon: "chevron-down-circle-outline" as const, color: "#ef4444" },
  { tipo: "checkbox", label: "Casilla", icon: "checkbox-outline" as const, color: "#ec4899" },
];

const STEPS = [
  { num: 1, label: "Info" },
  { num: 2, label: "Secciones" },
  { num: 3, label: "Campos" },
  { num: 4, label: "Revisión" },
];

function getTipoInfo(tipo: string) {
  return TIPOS_CAMPO.find((t) => t.tipo === tipo) ?? TIPOS_CAMPO[0];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function NuevaPlantillaScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  // ── Session & alumnos ──
  const [sessionUid, setSessionUid] = useState<string | null>(null);
  const [alumnosList, setAlumnosList] = useState<AlumnoData[]>([]);

  // ── Steps ──
  const [step, setStep] = useState(1);

  // ── Step 1 ──
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esGlobal, setEsGlobal] = useState(false);
  const [alumnoId, setAlumnoId] = useState<number | null>(null);

  // ── Step 2 — secciones ──
  const [secciones, setSecciones] = useState<WizardSeccion[]>([]);
  const [showAddSeccion, setShowAddSeccion] = useState(false);
  const [newSecNombre, setNewSecNombre] = useState("");
  const [newSecDesc, setNewSecDesc] = useState("");

  // ── Step 3 — campos ──
  const [activeSeccionId, setActiveSeccionId] = useState<string | null>(null);
  const [newCampoEtiqueta, setNewCampoEtiqueta] = useState("");
  const [newCampoTipo, setNewCampoTipo] = useState("texto");
  const [newCampoRequerido, setNewCampoRequerido] = useState(false);
  const [newCampoPlaceholder, setNewCampoPlaceholder] = useState("");
  const [newCampoAyuda, setNewCampoAyuda] = useState("");
  const [newCampoOpciones, setNewCampoOpciones] = useState<WizardOpcion[]>([]);
  const [newOpcionEtiqueta, setNewOpcionEtiqueta] = useState("");

  // ── Saving ──
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Totales
  const totalCampos = useMemo(
    () => secciones.reduce((acc, s) => acc + s.campos.length, 0),
    [secciones],
  );

  useEffect(() => {
    const init = async () => {
      const session = await getCurrentSession();
      if (!session) { router.replace("/"); return; }
      setSessionUid(session.user.id);
      const list = await getAlumnos(session.user.id);
      setAlumnosList(list);
    };
    init();
  }, []);

  // Scroll al inicio cuando cambia el paso
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  // ─── Validación por paso ─────────────────────────────────────────────────
  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return nombre.trim().length > 0;
      case 2:
        return secciones.length >= 1 && !showAddSeccion;
      case 3:
        return (
          secciones.every((s) => s.campos.length >= 1) &&
          activeSeccionId === null
        );
      default:
        return true;
    }
  };

  // ─── Helpers — Secciones ─────────────────────────────────────────────────
  const addSeccion = () => {
    if (!newSecNombre.trim()) return;
    setSecciones((prev) => [
      ...prev,
      {
        localId: Date.now().toString(),
        nombre: newSecNombre.trim(),
        descripcion: newSecDesc.trim(),
        orden: prev.length,
        campos: [],
      },
    ]);
    setNewSecNombre("");
    setNewSecDesc("");
    setShowAddSeccion(false);
  };

  const removeSeccion = (localId: string) => {
    setSecciones((prev) => prev.filter((s) => s.localId !== localId));
  };

  // ─── Helpers — Campos ────────────────────────────────────────────────────
  const resetCampoForm = () => {
    setActiveSeccionId(null);
    setNewCampoEtiqueta("");
    setNewCampoTipo("texto");
    setNewCampoRequerido(false);
    setNewCampoPlaceholder("");
    setNewCampoAyuda("");
    setNewCampoOpciones([]);
    setNewOpcionEtiqueta("");
  };

  const openCampoForm = (seccionLocalId: string) => {
    resetCampoForm();
    setActiveSeccionId(seccionLocalId);
  };

  const addCampo = (seccionLocalId: string) => {
    if (!newCampoEtiqueta.trim()) return;
    const needsOpciones = newCampoTipo === "radio" || newCampoTipo === "select";
    if (needsOpciones && newCampoOpciones.length === 0) {
      Alert.alert(
        "Opciones requeridas",
        "Agrega al menos una opción para este tipo de campo.",
      );
      return;
    }
    const campo: WizardCampo = {
      localId: Date.now().toString(),
      etiqueta: newCampoEtiqueta.trim(),
      clave: generarClave(newCampoEtiqueta.trim()),
      tipo: newCampoTipo,
      requerido: newCampoRequerido,
      placeholder: newCampoPlaceholder.trim(),
      ayuda: newCampoAyuda.trim(),
      orden:
        secciones.find((s) => s.localId === seccionLocalId)?.campos.length ?? 0,
      opciones: newCampoOpciones,
    };
    setSecciones((prev) =>
      prev.map((s) =>
        s.localId === seccionLocalId
          ? { ...s, campos: [...s.campos, campo] }
          : s,
      ),
    );
    resetCampoForm();
  };

  const removeCampo = (seccionLocalId: string, campoLocalId: string) => {
    setSecciones((prev) =>
      prev.map((s) =>
        s.localId === seccionLocalId
          ? { ...s, campos: s.campos.filter((c) => c.localId !== campoLocalId) }
          : s,
      ),
    );
  };

  const addOpcion = () => {
    if (!newOpcionEtiqueta.trim()) return;
    setNewCampoOpciones((prev) => [
      ...prev,
      {
        localId: Date.now().toString(),
        etiqueta: newOpcionEtiqueta.trim(),
        valor: generarClave(newOpcionEtiqueta.trim()),
        orden: prev.length,
      },
    ]);
    setNewOpcionEtiqueta("");
  };

  const removeOpcion = (localId: string) => {
    setNewCampoOpciones((prev) => prev.filter((o) => o.localId !== localId));
  };

  // ─── Guardar ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!sessionUid) return;
    setSaving(true);
    try {
      const result = await crearPlantillaCompleta({
        terapeuta_id: sessionUid,
        alumno_id: esGlobal ? null : alumnoId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        es_global: esGlobal,
        secciones: secciones.map((s, si) => ({
          ...s,
          orden: si,
          campos: s.campos.map((c, ci) => ({ ...c, orden: ci })),
        })),
      });
      if (result.error) {
        Alert.alert("Error al guardar", result.error);
        return;
      }
      Alert.alert(
        "¡Plantilla creada!",
        `La plantilla "${nombre.trim()}" fue creada exitosamente.`,
        [{ text: "Aceptar", onPress: () => router.replace("/prueba" as any) }],
      );
    } catch {
      Alert.alert("Error", "No se pudo crear la plantilla. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Estilos compartidos ─────────────────────────────────────────────────
  const card = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.12 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as const;

  // ─── RENDER PASO 1 — Información ─────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Datos básicos */}
      <View style={[styles.card, card]}>
        <StepSectionHeader
          icon="document-outline"
          label="Datos de la Plantilla"
          color={colors.primary}
          bg={`${colors.primary}18`}
        />
        <View style={styles.fieldGap}>
          <FormLabel label="Nombre" required helperText="Identifica esta plantilla" />
          <FormInput
            placeholder="Ej. Bitácora de seguimiento conductual"
            icon="bookmark-outline"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>
        <View style={styles.fieldGap}>
          <FormLabel label="Descripción" helperText="Opcional — propósito de la plantilla" />
          <FormTextArea
            placeholder="¿Para qué se usa esta plantilla?"
            value={descripcion}
            onChangeText={setDescripcion}
            minHeight={80}
          />
        </View>
      </View>

      {/* Configuración */}
      <View style={[styles.card, card]}>
        <StepSectionHeader
          icon="settings-outline"
          label="Configuración"
          color="#8b5cf6"
          bg={isDark ? "#251e2d" : "#f5f3ff"}
        />

        {/* Toggle global */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Plantilla global
            </Text>
            <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
              Disponible para todos los usuarios
            </Text>
          </View>
          <ToggleSwitch
            value={esGlobal}
            onValueChange={(v) => {
              setEsGlobal(v);
              if (v) setAlumnoId(null);
            }}
          />
        </View>

        {/* Selector de alumno — solo si no es global */}
        {!esGlobal && (
          <View style={{ marginTop: 18 }}>
            <FormLabel
              label="Alumno asociado"
              required
              helperText="La plantilla será para este alumno específicamente"
            />
            {alumnosList.length === 0 ? (
              <View
                style={[
                  styles.emptyAlumnos,
                  { backgroundColor: isDark ? colors.input : "#f8fafc" },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={26}
                  color={colors.textSecondary}
                  style={{ opacity: 0.45, marginBottom: 8 }}
                />
                <Text style={[styles.emptyAlumnosText, { color: colors.textSecondary }]}>
                  No tienes alumnos registrados.{"\n"}Regístralos primero desde Expedientes.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {alumnosList.map((alumno) => {
                  const sel = alumnoId === alumno.alumno_id;
                  return (
                    <TouchableOpacity
                      key={alumno.alumno_id}
                      onPress={() => setAlumnoId(alumno.alumno_id)}
                      activeOpacity={0.75}
                      style={[
                        styles.alumnoOption,
                        {
                          backgroundColor: sel
                            ? isDark
                              ? `${colors.primary}22`
                              : "#e0f2fe"
                            : colors.input,
                          borderColor: sel ? colors.primary : "transparent",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.alumnoAvatar,
                          { backgroundColor: `${colors.primary}1a` },
                        ]}
                      >
                        <Text style={[styles.alumnoInicial, { color: colors.primary }]}>
                          {alumno.pseudonimo.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.alumnoNombre,
                          { color: sel ? colors.primary : colors.text },
                        ]}
                      >
                        {alumno.pseudonimo}
                      </Text>
                      {alumno.nivel_tea ? (
                        <Text
                          style={[styles.alumnoNivel, { color: colors.textSecondary }]}
                        >
                          N{alumno.nivel_tea}
                        </Text>
                      ) : null}
                      {sel && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => setAlumnoId(null)}
                  activeOpacity={0.75}
                  style={[
                    styles.alumnoOption,
                    {
                      backgroundColor: alumnoId === null
                        ? isDark
                          ? `${colors.primary}22`
                          : "#e0f2fe"
                        : colors.input,
                      borderColor: alumnoId === null ? colors.primary : "transparent",
                      marginTop: 4
                    },
                  ]}
                >
                  <View style={[styles.alumnoAvatar, { backgroundColor: isDark ? "#374151" : "#e2e8f0" }]}>
                    <Ionicons name="help-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alumnoNombre, { color: alumnoId === null ? colors.primary : colors.text }]}>
                      Sin asociar alumno
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Podrás asignarlo después al usar la plantilla</Text>
                  </View>
                  {alumnoId === null && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  // ─── RENDER PASO 2 — Secciones ────────────────────────────────────────────
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {secciones.length === 0 && !showAddSeccion && (
        <View style={[styles.emptyState, card]}>
          <Ionicons
            name="albums-outline"
            size={38}
            color={colors.textSecondary}
            style={{ opacity: 0.4, marginBottom: 10 }}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin secciones
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Las secciones agrupan campos relacionados dentro del formulario
          </Text>
        </View>
      )}

      {secciones.map((s, i) => (
        <View key={s.localId} style={[styles.seccionItem, card]}>
          <View style={[styles.seccionNum, { backgroundColor: `${colors.primary}18` }]}>
            <Text style={[styles.seccionNumText, { color: colors.primary }]}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.seccionNombre, { color: colors.text }]}>
              {s.nombre}
            </Text>
            {s.descripcion ? (
              <Text
                style={[styles.seccionDescText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {s.descripcion}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Eliminar sección",
                `¿Eliminar "${s.nombre}"?\nSe perderán los campos que agregues en el paso siguiente.`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => removeSeccion(s.localId),
                  },
                ],
              )
            }
            style={styles.trashBtn}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Formulario inline — nueva sección */}
      {showAddSeccion ? (
        <View style={[styles.card, card]}>
          <Text style={[styles.addFormTitle, { color: colors.text }]}>
            Nueva Sección
          </Text>
          <View style={styles.fieldGap}>
            <FormLabel label="Nombre de la sección" required />
            <FormInput
              placeholder="Ej. Información General"
              icon="albums-outline"
              value={newSecNombre}
              onChangeText={setNewSecNombre}
              autoFocus
            />
          </View>
          <View style={styles.fieldGap}>
            <FormLabel label="Descripción" helperText="Opcional" />
            <FormTextArea
              placeholder="¿Qué información recoge esta sección?"
              value={newSecDesc}
              onChangeText={setNewSecDesc}
              minHeight={70}
            />
          </View>
          <View style={styles.addFormBtns}>
            <TouchableOpacity
              onPress={() => {
                setShowAddSeccion(false);
                setNewSecNombre("");
                setNewSecDesc("");
              }}
              style={[styles.cancelBtn, { borderColor: colors.inputBorder }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Agregar"
                disabled={!newSecNombre.trim()}
                onPress={addSeccion}
              />
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.addRowBtn,
            {
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}08`,
            },
          ]}
          onPress={() => setShowAddSeccion(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.addRowBtnText, { color: colors.primary }]}>
            Agregar Sección
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── RENDER PASO 3 — Campos ───────────────────────────────────────────────
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {secciones.map((s) => {
        const isActive = activeSeccionId === s.localId;
        return (
          <View key={s.localId} style={[styles.card, card]}>
            {/* Header de sección */}
            <View style={styles.seccionCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.seccionNombre, { color: colors.text }]}>
                  {s.nombre}
                </Text>
                <Text style={[styles.seccionCamposCount, { color: colors.textSecondary }]}>
                  {s.campos.length === 0
                    ? "Sin campos — agrega al menos uno"
                    : `${s.campos.length} campo${s.campos.length !== 1 ? "s" : ""}`}
                </Text>
              </View>
              <View
                style={[
                  styles.seccionNum,
                  {
                    backgroundColor:
                      s.campos.length > 0
                        ? isDark
                          ? "#1a2e27"
                          : "#ecfdf5"
                        : `${colors.primary}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.seccionNumText,
                    {
                      color:
                        s.campos.length > 0 ? "#10b981" : colors.primary,
                    },
                  ]}
                >
                  {s.campos.length > 0 ? "✓" : "!"}
                </Text>
              </View>
            </View>

            {/* Lista de campos */}
            {s.campos.map((c) => {
              const tipoInfo = getTipoInfo(c.tipo);
              return (
                <View
                  key={c.localId}
                  style={[
                    styles.campoRow,
                    {
                      backgroundColor: isDark ? "#ffffff08" : "#f8fafc",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.campoTipoIcon,
                      { backgroundColor: `${tipoInfo.color}18` },
                    ]}
                  >
                    <Ionicons
                      name={tipoInfo.icon}
                      size={13}
                      color={tipoInfo.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.campoLabel, { color: colors.text }]}>
                      {c.etiqueta}
                      {c.requerido ? (
                        <Text style={{ color: colors.error }}> *</Text>
                      ) : null}
                    </Text>
                    <Text style={[styles.campoTipoText, { color: tipoInfo.color }]}>
                      {tipoInfo.label}
                      {c.opciones.length > 0
                        ? ` · ${c.opciones.length} opciones`
                        : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeCampo(s.localId, c.localId)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} style={{ opacity: 0.7 }} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Formulario de nuevo campo */}
            {isActive ? (
              <View
                style={[
                  styles.campoForm,
                  {
                    backgroundColor: isDark ? "#ffffff06" : "#f8fafc",
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.campoFormTitle, { color: colors.primary }]}>
                  Nuevo Campo
                </Text>

                {/* Etiqueta */}
                <View style={styles.fieldGap}>
                  <FormLabel label="Etiqueta del campo" required />
                  <FormInput
                    placeholder="Ej. Nivel de atención"
                    value={newCampoEtiqueta}
                    onChangeText={setNewCampoEtiqueta}
                    autoFocus
                  />
                </View>

                {/* Tipo — pills horizontales */}
                <View style={styles.fieldGap}>
                  <FormLabel label="Tipo de respuesta" />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 7, paddingVertical: 4 }}
                  >
                    {TIPOS_CAMPO.map((t) => {
                      const sel = newCampoTipo === t.tipo;
                      return (
                        <TouchableOpacity
                          key={t.tipo}
                          onPress={() => {
                            setNewCampoTipo(t.tipo);
                            if (t.tipo !== "radio" && t.tipo !== "select") {
                              setNewCampoOpciones([]);
                            }
                          }}
                          style={[
                            styles.tipoPill,
                            {
                              backgroundColor: sel
                                ? t.color
                                : isDark
                                ? colors.input
                                : "#f0f4f8",
                              borderColor: sel ? t.color : "transparent",
                            },
                          ]}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={t.icon}
                            size={13}
                            color={sel ? "#fff" : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.tipoPillText,
                              {
                                color: sel ? "#fff" : colors.textSecondary,
                              },
                            ]}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Requerido */}
                <View style={[styles.toggleRow, { marginBottom: 12 }]}>
                  <Text style={[styles.toggleLabel, { color: colors.text, flex: 1 }]}>
                    Campo requerido
                  </Text>
                  <ToggleSwitch
                    value={newCampoRequerido}
                    onValueChange={setNewCampoRequerido}
                  />
                </View>

                {/* Placeholder (opcional) */}
                <View style={styles.fieldGap}>
                  <FormLabel label="Placeholder" helperText="Texto de ayuda dentro del campo (opcional)" />
                  <FormInput
                    placeholder="Ej. Describe brevemente..."
                    value={newCampoPlaceholder}
                    onChangeText={setNewCampoPlaceholder}
                  />
                </View>

                {/* Opciones — solo para radio/select */}
                {(newCampoTipo === "radio" || newCampoTipo === "select") && (
                  <View
                    style={[
                      styles.opcionesBox,
                      {
                        backgroundColor: isDark ? "#ffffff05" : "#f0f4f8",
                        borderColor: isDark ? "#ffffff10" : "#e5e7eb",
                      },
                    ]}
                  >
                    <Text style={[styles.opcionesTitle, { color: colors.text }]}>
                      Opciones
                    </Text>
                    {newCampoOpciones.length === 0 ? (
                      <Text
                        style={[
                          styles.opcionesEmpty,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Agrega al menos una opción
                      </Text>
                    ) : (
                      newCampoOpciones.map((op) => (
                        <View
                          key={op.localId}
                          style={styles.opcionRow}
                        >
                          <View
                            style={[
                              styles.opcionDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                          <Text
                            style={[
                              styles.opcionLabel,
                              { color: colors.text, flex: 1 },
                            ]}
                          >
                            {op.etiqueta}
                          </Text>
                          <TouchableOpacity onPress={() => removeOpcion(op.localId)}>
                            <Ionicons
                              name="close-circle"
                              size={17}
                              color={colors.error}
                              style={{ opacity: 0.7 }}
                            />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                    <View style={styles.addOpcionRow}>
                      <TextInput
                        value={newOpcionEtiqueta}
                        onChangeText={setNewOpcionEtiqueta}
                        placeholder="Nombre de la opción"
                        placeholderTextColor={colors.textSecondary}
                        onSubmitEditing={addOpcion}
                        returnKeyType="done"
                        style={[
                          styles.addOpcionInput,
                          {
                            backgroundColor: colors.input,
                            color: colors.text,
                            borderColor: colors.inputBorder,
                          },
                        ]}
                      />
                      <TouchableOpacity
                        onPress={addOpcion}
                        disabled={!newOpcionEtiqueta.trim()}
                        style={[
                          styles.addOpcionBtn,
                          {
                            backgroundColor: newOpcionEtiqueta.trim()
                              ? colors.primary
                              : colors.inputBorder,
                          },
                        ]}
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Botones del formulario */}
                <View style={styles.addFormBtns}>
                  <TouchableOpacity
                    onPress={resetCampoForm}
                    style={[
                      styles.cancelBtn,
                      { borderColor: colors.inputBorder },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cancelBtnText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Guardar Campo"
                      disabled={!newCampoEtiqueta.trim()}
                      onPress={() => addCampo(s.localId)}
                    />
                  </View>
                </View>
              </View>
            ) : (
              /* Botón abrir formulario */
              <TouchableOpacity
                style={[
                  styles.addRowBtn,
                  {
                    borderColor: colors.primary,
                    backgroundColor: `${colors.primary}08`,
                    marginTop: s.campos.length > 0 ? 10 : 12,
                  },
                ]}
                onPress={() => openCampoForm(s.localId)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.addRowBtnText, { color: colors.primary }]}>
                  Agregar Campo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );

  // ─── RENDER PASO 4 — Revisión ─────────────────────────────────────────────
  const renderStep4 = () => {
    const alumnoAsociado = alumnosList.find((a) => a.alumno_id === alumnoId);
    return (
      <View style={styles.stepContent}>
        {/* Resumen general */}
        <View style={[styles.card, card]}>
          <View style={styles.revisionHeader}>
            <View
              style={[styles.revisionIcon, { backgroundColor: `${colors.primary}18` }]}
            >
              <Ionicons name="document-text-outline" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.revisionNombre, { color: colors.text }]}>
                {nombre}
              </Text>
              {descripcion ? (
                <Text
                  style={[styles.revisionDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {descripcion}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Badges */}
          <View style={styles.revisionBadges}>
            <View
              style={[
                styles.revisionBadge,
                {
                  backgroundColor: esGlobal
                    ? isDark
                      ? "#1e2d3d"
                      : "#eff6ff"
                    : isDark
                    ? "#251e2d"
                    : "#f5f3ff",
                },
              ]}
            >
              <Ionicons
                name={esGlobal ? "globe-outline" : "person-outline"}
                size={13}
                color={esGlobal ? "#3b82f6" : "#8b5cf6"}
              />
              <Text
                style={[
                  styles.revisionBadgeText,
                  { color: esGlobal ? "#3b82f6" : "#8b5cf6" },
                ]}
              >
                {esGlobal
                  ? "Plantilla global"
                  : alumnoAsociado
                  ? alumnoAsociado.pseudonimo
                  : "Sin alumno"}
              </Text>
            </View>

            <View
              style={[styles.revisionBadge, { backgroundColor: isDark ? "#1a2e27" : "#ecfdf5" }]}
            >
              <Ionicons name="albums-outline" size={13} color="#10b981" />
              <Text style={[styles.revisionBadgeText, { color: "#10b981" }]}>
                {secciones.length} sección{secciones.length !== 1 ? "es" : ""}
              </Text>
            </View>

            <View
              style={[
                styles.revisionBadge,
                { backgroundColor: isDark ? "#2e1515" : "#fef2f2" },
              ]}
            >
              <Ionicons name="list-outline" size={13} color="#ef4444" />
              <Text style={[styles.revisionBadgeText, { color: "#ef4444" }]}>
                {totalCampos} campo{totalCampos !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Secciones detalladas */}
        {secciones.map((s, i) => (
          <View key={s.localId} style={[styles.card, card]}>
            <View style={styles.revisionSeccionHeader}>
              <View
                style={[
                  styles.seccionNum,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Text style={[styles.seccionNumText, { color: colors.primary }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.revisionSeccionNombre, { color: colors.text }]}>
                {s.nombre}
              </Text>
            </View>

            {s.campos.map((c) => {
              const tipoInfo = getTipoInfo(c.tipo);
              return (
                <View key={c.localId} style={styles.revisionCampoRow}>
                  <View
                    style={[
                      styles.campoTipoIcon,
                      { backgroundColor: `${tipoInfo.color}18` },
                    ]}
                  >
                    <Ionicons name={tipoInfo.icon} size={12} color={tipoInfo.color} />
                  </View>
                  <Text style={[styles.campoLabel, { color: colors.text, flex: 1 }]}>
                    {c.etiqueta}
                    {c.requerido ? (
                      <Text style={{ color: colors.error }}> *</Text>
                    ) : null}
                  </Text>
                  <Text style={[styles.campoTipoText, { color: tipoInfo.color }]}>
                    {tipoInfo.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // ─── JSX principal ────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Cabecera fija: barra de progreso ── */}
      <View
        style={[
          styles.wizardHeader,
          {
            backgroundColor: colors.background,
            borderBottomColor: isDark ? "#ffffff10" : "#f0f0f0",
          },
        ]}
      >
        {/* Botón atrás & título */}
        <View style={styles.wizardHeaderTop}>
          <TouchableOpacity
            onPress={() => {
              if (step === 1) {
                if (nombre.trim() || secciones.length > 0) {
                  Alert.alert(
                    "¿Salir?",
                    "Se perderán los datos ingresados.",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Salir", style: "destructive", onPress: () => router.back() },
                    ],
                  );
                } else {
                  router.back();
                }
              } else {
                setStep((s) => s - 1);
              }
            }}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.wizardTitle, { color: colors.text }]}>
              Nueva Plantilla
            </Text>
            <Text style={[styles.wizardSubtitle, { color: colors.textSecondary }]}>
              Paso {step} de {STEPS.length} —{" "}
              {
                [
                  "Información básica",
                  "Secciones",
                  "Campos por sección",
                  "Revisión final",
                ][step - 1]
              }
            </Text>
          </View>
        </View>

        {/* Barra de progreso unificada */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 16 }}>
          {/* Líneas absolutas de fondo */}
          <View style={{ position: "absolute", top: 13, left: 33, right: 33, height: 2, flexDirection: "row" }}>
            {STEPS.map((s, i) => {
              if (i === STEPS.length - 1) return null;
              return (
                <View
                  key={`line-${s.num}`}
                  style={{
                    flex: 1,
                    backgroundColor: step > s.num ? colors.primary : isDark ? "#374151" : "#e5e7eb",
                  }}
                />
              );
            })}
          </View>

          {/* Dots y Labels */}
          {STEPS.map((s) => (
            <View key={s.num} style={{ alignItems: "center", width: 66 }}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      step > s.num
                        ? colors.primary
                        : step === s.num
                        ? colors.primary
                        : isDark
                        ? "#374151"
                        : "#e5e7eb",
                    borderWidth: step === s.num ? 2 : 0,
                    borderColor: step === s.num ? `${colors.primary}40` : "transparent",
                  },
                ]}
              >
                {step > s.num ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.progressDotText,
                      { color: step >= s.num ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {s.num}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color: step === s.num ? colors.primary : colors.textSecondary,
                    fontWeight: step === s.num ? "700" : "400",
                    marginTop: 6,
                    textAlign: "center"
                  },
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Contenido scrolleable ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* ── Pie de navegación fijo ── */}
      <View
        style={[
          styles.navFooter,
          {
            backgroundColor: colors.background,
            borderTopColor: isDark ? "#ffffff10" : "#f0f0f0",
          },
        ]}
      >
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep((s) => s - 1)}
            style={[
              styles.backStepBtn,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" },
            ]}
          >
            <Ionicons name="arrow-back" size={17} color={colors.text} />
            <Text style={[styles.backStepText, { color: colors.text }]}>Atrás</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: step > 1 ? 12 : 0 }}>
          {step < 4 ? (
            <PrimaryButton
              title="Continuar"
              disabled={!canGoNext()}
              onPress={() => setStep((s) => s + 1)}
            />
          ) : (
            <PrimaryButton
              title="Crear Plantilla"
              loading={saving}
              disabled={saving}
              onPress={handleSave}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-componente: encabezado de sección dentro de card ─────────────────────
function StepSectionHeader({
  icon,
  label,
  color,
  bg,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionHeaderIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={[styles.sectionHeaderLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Wizard header
  wizardHeader: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  wizardHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  wizardTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  wizardSubtitle: { fontSize: 12, marginTop: 1 },

  // Progress bar
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotText: { fontSize: 11, fontWeight: "700" },
  progressLine: { flex: 1, height: 2, marginHorizontal: 2 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  progressLabel: { fontSize: 10, textAlign: "center" },

  // Step content
  stepContent: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  card: { borderRadius: 20, padding: 18 },
  fieldGap: { marginBottom: 14 },

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeaderLabel: { fontSize: 13, fontWeight: "700" },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  toggleSub: { fontSize: 12, marginTop: 2 },

  // Alumno selector (step 1)
  emptyAlumnos: {
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  emptyAlumnosText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 4,
  },
  alumnoOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1.5,
  },
  alumnoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  alumnoInicial: { fontSize: 15, fontWeight: "800" },
  alumnoNombre: { flex: 1, fontSize: 14, fontWeight: "600" },
  alumnoNivel: { fontSize: 12, fontWeight: "500" },

  // Empty state (secciones)
  emptyState: { borderRadius: 20, padding: 32, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },

  // Seccion item (step 2)
  seccionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  seccionNum: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  seccionNumText: { fontSize: 13, fontWeight: "800" },
  seccionNombre: { fontSize: 14, fontWeight: "700" },
  seccionDescText: { fontSize: 12, marginTop: 2 },
  trashBtn: { padding: 6 },

  // Add section form
  addFormTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  addFormBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "500" },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    justifyContent: "center",
  },
  addRowBtnText: { fontSize: 14, fontWeight: "600" },

  // Campo row (step 3)
  seccionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  seccionCamposCount: { fontSize: 12, marginTop: 2 },
  campoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  campoTipoIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  campoLabel: { fontSize: 13, fontWeight: "600" },
  campoTipoText: { fontSize: 11, fontWeight: "500", marginTop: 1 },

  // Campo form
  campoForm: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  campoFormTitle: { fontSize: 13, fontWeight: "700", marginBottom: 12 },

  // Tipo pills
  tipoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
  },
  tipoPillText: { fontSize: 12, fontWeight: "600" },

  // Opciones manager
  opcionesBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  opcionesTitle: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  opcionesEmpty: { fontSize: 12, marginBottom: 8 },
  opcionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  opcionDot: { width: 6, height: 6, borderRadius: 3 },
  opcionLabel: { fontSize: 13 },
  addOpcionRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 6,
  },
  addOpcionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  addOpcionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // Revision (step 4)
  revisionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14 },
  revisionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  revisionNombre: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  revisionDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  revisionBadges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  revisionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  revisionBadgeText: { fontSize: 12, fontWeight: "600" },
  revisionSeccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  revisionSeccionNombre: { fontSize: 14, fontWeight: "700", flex: 1 },
  revisionCampoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 5,
  },

  // Navigation footer
  navFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: 1,
  },
  backStepBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  backStepText: { fontSize: 14, fontWeight: "600" },
});
