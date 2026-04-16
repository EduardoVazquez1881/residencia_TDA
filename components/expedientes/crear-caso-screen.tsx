import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import { crearCasoCompleto, getUsuarioPorCorreo } from "@/services/casos.service";
import { getPlantillas, PlantillaData } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ParticipanteForm {
  correo: string;
  rol_en_caso: string;
}

const ROLES_DISPONIBLES = [
  { id: "Sombra", icon: "person-add-outline" },
  { id: "Tutor", icon: "home-outline" },
  { id: "Terapeuta", icon: "medical-outline" },
];

export function CrearCasoScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaData[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedAlumno, setSelectedAlumno] = useState<number | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<number | null>(null);
  const [modalPlantillaVisible, setModalPlantillaVisible] = useState(false);
  const [notas, setNotas] = useState("");
  
  // Participantes State
  const [participantes, setParticipantes] = useState<ParticipanteForm[]>([]);
  const [currentCorreo, setCurrentCorreo] = useState("");
  const [currentRol, setCurrentRol] = useState(ROLES_DISPONIBLES[0].id);

  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  // Fecha actual formateada
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          const [alumnosData, plantillasData] = await Promise.all([
            getAlumnos(session.user.id),
            getPlantillas(session.user.id),
          ]);
          setAlumnos(alumnosData);
          setPlantillas(plantillasData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingInitial(false);
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
      }
    };
    fetchData();
  }, [fadeAnim, slideAnim]);

  const [verificandoCorreo, setVerificandoCorreo] = useState(false);

  const handleAgregarParticipante = async () => {
    if (!currentCorreo.trim()) return;
    if (!currentCorreo.includes("@")) {
      Alert.alert("Error", "Por favor ingresa un correo válido.");
      return;
    }
    if (participantes.find((p) => p.correo.toLowerCase() === currentCorreo.trim().toLowerCase())) {
      Alert.alert("Error", "Este usuario ya está en la lista.");
      return;
    }

    setVerificandoCorreo(true);
    try {
      const uid = await getUsuarioPorCorreo(currentCorreo);
      if (!uid) {
        Alert.alert("No encontrado", `No existe ningún usuario registrado con el correo: ${currentCorreo}`);
        return;
      }
      setParticipantes([...participantes, { correo: currentCorreo.trim().toLowerCase(), rol_en_caso: currentRol }]);
      setCurrentCorreo("");
    } catch (e) {
      Alert.alert("Error", "Ocurrió un error al verificar el correo.");
    } finally {
      setVerificandoCorreo(false);
    }
  };

  const handleEliminarParticipante = (correo: string) => {
    setParticipantes(participantes.filter(p => p.correo !== correo));
  };

  const handleCrearCaso = async () => {
    if (!selectedAlumno) {
      Alert.alert("Falta información", "Por favor selecciona un alumno.");
      return;
    }
    if (participantes.length === 0) {
      Alert.alert("Falta información", "Por favor agrega al menos un usuario participante.");
      return;
    }

    setLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const uid = session.user.id;
      const res = await crearCasoCompleto({
        alumno_id: selectedAlumno,
        usuario_id: uid,
        plantilla_id: selectedPlantilla,
        notas_asignacion: notas.trim() || undefined,
        participantes,
      });

      if (res.error) {
        Alert.alert("Error al crear", res.error);
        return;
      }

      Alert.alert("¡Éxito!", "El caso fue creado y asignado exitosamente.", [
        { text: "Aceptar", onPress: () => router.back() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear el caso.");
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
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Nuevo Caso</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Asigna usuarios y plantillas</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="folder-open-outline" size={22} color={colors.primary} />
          </View>
        </View>

        {/* 1. SECCIÓN ALUMNO Y FECHA */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader icon="person-outline" label="Datos del Caso" color={colors.primary} bg={`${colors.primary}18`} />
          
          <View style={styles.field}>
            <FormLabel label="Fecha de Asignación" helperText="Automática (Hoy)" />
            <View style={[styles.readonlyInputBase, { backgroundColor: isDark ? "#ffffff08" : "#f1f5f9" }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: "600" }}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <FormLabel label="Seleccionar Alumno" required />
            {alumnos.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No tienes alumnos dados de alta.</Text>
            ) : (
              <View style={styles.selectionGrid}>
                {alumnos.map(a => {
                  const selected = selectedAlumno === a.alumno_id;
                  return (
                    <TouchableOpacity
                      key={a.alumno_id}
                      onPress={() => setSelectedAlumno(a.alumno_id)}
                      style={[
                        styles.selectionItem,
                        {
                          backgroundColor: selected ? `${colors.primary}20` : (isDark ? colors.background : "#f8fafc"),
                          borderColor: selected ? colors.primary : "transparent",
                          borderWidth: 1,
                        }
                      ]}
                    >
                      <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: selected ? "bold" : "500" }}>
                        {a.pseudonimo}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* 2. SECCIÓN PARTICIPANTES */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader icon="people-outline" label="Usuarios Asignados" color="#8b5cf6" bg="#f5f3ff" bgDark="#251e2d" isDark={isDark} />
          
          <Text style={[styles.helperInfo, { color: colors.textSecondary, marginBottom: 15 }]}>
            Escribe el correo del usuario (terapeuta, maestro sombra o tutor) y asígnale su rol en este caso específico.
          </Text>

          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
               <FormInput
                  placeholder="correo@ejemplo.com"
                  icon="mail-outline"
                  value={currentCorreo}
                  onChangeText={setCurrentCorreo}
                  autoCapitalize="none"
               />
            </View>
          </View>

          <View style={styles.roleSelectionRow}>
            {ROLES_DISPONIBLES.map(r => {
              const selected = currentRol === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setCurrentRol(r.id)}
                  style={[
                    styles.rolePill,
                    {
                      backgroundColor: selected ? "#8b5cf6" : (isDark ? "#ffffff10" : "#f1f5f9"),
                    }
                  ]}
                >
                  <Ionicons name={r.icon as any} size={14} color={selected ? "#fff" : colors.textSecondary} />
                  <Text style={[styles.rolePillText, { color: selected ? "#fff" : colors.textSecondary }]}>{r.id}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: `${colors.primary}20` }]}
            onPress={handleAgregarParticipante}
            disabled={verificandoCorreo}
          >
            {verificandoCorreo ? (
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>Verificando...</Text>
            ) : (
              <>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>Agregar Usuario</Text>
              </>
            )}
          </TouchableOpacity>

          {participantes.length > 0 && (
             <View style={styles.participantesList}>
                {participantes.map((p, index) => (
                  <View key={index} style={[styles.participanteRow, { backgroundColor: isDark ? "#ffffff05" : "#f8fafc", borderColor: isDark ? "#ffffff15" : "#e2e8f0" }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{p.correo}</Text>
                      <Text style={{ color: "#8b5cf6", fontSize: 11, fontWeight: "700", marginTop: 2 }}>{p.rol_en_caso.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleEliminarParticipante(p.correo)} style={{ padding: 4 }}>
                       <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
             </View>
          )}

        </View>

        {/* 3. SECCIÓN PLANTILLA */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader icon="document-text-outline" label="Vincular Plantilla" color="#10b981" bg="#ecfdf5" bgDark="#1a2e27" isDark={isDark} />
          
          <View style={styles.field}>
             <FormLabel label="Seleccionar Plantilla (Opcional)" helperText="Esta plantilla será rellenada por la sombra en sus bitácoras" />
             {plantillas.length === 0 ? (
                <Text style={{ color: colors.textSecondary }}>No hay plantillas disponibles.</Text>
             ) : (
                <TouchableOpacity
                  onPress={() => setModalPlantillaVisible(true)}
                  style={[
                    styles.selectionItemCol,
                    {
                      backgroundColor: isDark ? "#ffffff08" : "#f1f5f9",
                      borderColor: selectedPlantilla ? "#10b981" : "transparent",
                      borderWidth: selectedPlantilla ? 1 : 0,
                    }
                  ]}
                >
                  <Text 
                    style={{ 
                      color: selectedPlantilla ? "#10b981" : colors.text, 
                      fontWeight: selectedPlantilla ? "bold" : "500",
                      flex: 1,
                      marginRight: 10
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedPlantilla 
                      ? plantillas.find(p => p.plantilla_id === selectedPlantilla)?.nombre 
                      : "Toca para seleccionar plantilla..."}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
             )}
          </View>
          
          <View style={[styles.field, { marginTop: 15 }]}>
            <FormLabel label="Notas Adicionales" />
            <FormTextArea
              placeholder="Indicaciones rápidas sobre el caso o contexto inicial..."
              value={notas}
              onChangeText={setNotas}
              minHeight={90}
            />
          </View>
        </View>

        <PrimaryButton
          title="Crear Expediente / Caso"
          loading={loading}
          disabled={loading || !selectedAlumno || participantes.length === 0}
          onPress={handleCrearCaso}
          icon={!loading ? <Ionicons name="checkmark-circle-outline" size={20} color="#fff" /> : undefined}
        />

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* MODAL DE SELECCIÓN DE PLANTILLAS */}
      <Modal visible={modalPlantillaVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecciona una Plantilla</Text>
              <TouchableOpacity onPress={() => setModalPlantillaVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {plantillas.map((p) => (
                <TouchableOpacity
                  key={p.plantilla_id}
                  onPress={() => {
                    setSelectedPlantilla(p.plantilla_id);
                    setModalPlantillaVisible(false);
                  }}
                  style={[styles.modalItem, selectedPlantilla === p.plantilla_id && { backgroundColor: `${colors.primary}15` }]}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text 
                      style={{ 
                        color: selectedPlantilla === p.plantilla_id ? colors.primary : colors.text, 
                        fontWeight: selectedPlantilla === p.plantilla_id ? "bold" : "500", 
                        fontSize: 15 
                      }}
                    >
                      {p.nombre}
                    </Text>
                    {p.es_global && <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Plantilla Global</Text>}
                  </View>
                  {selectedPlantilla === p.plantilla_id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setSelectedPlantilla(null);
                  setModalPlantillaVisible(false);
                }}
                style={[styles.modalItem, selectedPlantilla === null && { backgroundColor: `${colors.primary}15` }]}
              >
                <Text style={{ color: selectedPlantilla === null ? colors.primary : colors.text, fontWeight: selectedPlantilla === null ? "bold" : "500", fontSize: 15, flex: 1, marginRight: 10 }}>
                  Ninguna / Sin plantilla
                </Text>
                {selectedPlantilla === null && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

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
      <View style={[styles.sectionIcon, { backgroundColor: isDark && bgDark ? bgDark : bg }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
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
  field: {
    marginBottom: 10,
  },
  readonlyInputBase: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  selectionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectionGridCol: {
    flexDirection: "column",
    gap: 10,
    marginTop: 5,
  },
  selectionItemCol: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  helperInfo: {
    fontSize: 12,
    lineHeight: 18,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleSelectionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 15,
  },
  participantesList: {
    gap: 10,
  },
  participanteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  }
});
