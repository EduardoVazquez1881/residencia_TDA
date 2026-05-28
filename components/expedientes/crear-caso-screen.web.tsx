import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlumnoData, getAlumnos } from "@/services/alumnos.service";
import { getCurrentSession } from "@/services/auth.service";
import { crearCasoCompleto, getUsuarioPorCorreo } from "@/services/casos.service";
import { notificarCasoParticipantes } from "@/services/notificaciones.service";
import { getPlantillas, PlantillaData } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import { safeBack } from "@/utils/navigation";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { WebDashboardLayout } from "@/components/ui/web/WebDashboardLayout";

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
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);

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
      }
    };
    fetchData();
  }, []);

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
        alert("Error al crear:\n" + res.error);
        return;
      }

      // Enviar notificaciones a los participantes
      if (res.caso_id) {
        try {
          await notificarCasoParticipantes(
            res.caso_id,
            uid,
            "Nuevo Expediente Asignado",
            "Has sido añadido al equipo de trabajo de un nuevo expediente.",
            "caso_creado",
            res.caso_id.toString()
          );
        } catch (err) {
          console.error("Error al enviar notificaciones de caso:", err);
        }
      }

      alert("¡Éxito!\n\nEl caso fue creado y asignado exitosamente.");
      router.replace('/prueba' as any);
    } catch (e) {
      console.error(e);
      alert("Error: No se pudo crear el caso.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    ...Platform.select({
      web: {
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: isDark ? '#ffffff10' : '#f1f5f9',
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: isDark ? 0.15 : 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }
    })
  } as any;

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER INTEGRADO */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={safeBack}
            style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Crear Nuevo Expediente</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Configura el seguimiento del alumno y su equipo de trabajo</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
           <PrimaryButton
             title="Guardar Expediente"
             loading={loading}
             disabled={loading || !selectedAlumno || participantes.length === 0}
             onPress={handleCrearCaso}
             style={{ width: 'auto', paddingHorizontal: 24 }}
             icon={!loading ? <Ionicons name="save-outline" size={20} color="#fff" /> : undefined}
           />
        </View>
      </View>

      <View style={styles.mainGrid}>
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN BÁSICA */}
        <View style={styles.leftCol}>
          <View style={[styles.sectionCard, cardStyle]}>
            <SectionHeader icon="person-outline" label="Información General" color={colors.primary} bg={`${colors.primary}18`} />
            
            <View style={styles.field}>
              <FormLabel label="Fecha de Registro" helperText="El expediente se iniciará con fecha de hoy" />
              <View style={[styles.readonlyInputBase, { backgroundColor: isDark ? "#ffffff08" : "#f8fafc" }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: "600" }}>{formattedDate}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <FormLabel label="Seleccionar Alumno" required helperText="Selecciona al alumno para este expediente" />
              {alumnos.length === 0 ? (
                <View style={styles.emptyWarning}>
                  <Text style={{ color: colors.textSecondary }}>No tienes alumnos registrados. Registra uno primero.</Text>
                </View>
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

          <View style={[styles.sectionCard, cardStyle]}>
            <SectionHeader icon="document-text-outline" label="Configuración de Seguimiento" color="#10b981" bg="#ecfdf5" bgDark="#1a2e27" isDark={isDark} />
            
            <View style={styles.field}>
              <FormLabel label="Vincular Plantilla de Bitácora" helperText="Determina el formato que usará el equipo para registrar avances" />
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
                  >
                    {selectedPlantilla 
                      ? plantillas.find(p => p.plantilla_id === selectedPlantilla)?.nombre 
                      : "Seleccionar una plantilla..."}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.field, { marginTop: 15 }]}>
              <FormLabel label="Indicaciones y Notas" />
              <FormTextArea
                placeholder="Escribe indicaciones específicas para este caso..."
                value={notas}
                onChangeText={setNotas}
                minHeight={120}
              />
            </View>
          </View>
        </View>

        {/* COLUMNA DERECHA: EQUIPO DE TRABAJO */}
        <View style={styles.rightCol}>
          <View style={[styles.sectionCard, cardStyle, { flex: 1 }]}>
            <SectionHeader icon="people-outline" label="Equipo de Trabajo" color="#8b5cf6" bg="#f5f3ff" bgDark="#251e2d" isDark={isDark} />
            
            <Text style={[styles.helperInfo, { color: colors.textSecondary, marginBottom: 20 }]}>
              Asigna a los profesionales y familiares que tendrán acceso a este expediente.
            </Text>

            <View style={styles.addMemberBox}>
              <FormLabel label="Agregar por Correo" />
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
                    <Text style={{ color: colors.primary, fontWeight: "bold" }}>Añadir al Equipo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.listTitle, { color: colors.text }]}>Miembros del Equipo ({participantes.length})</Text>
            {participantes.length === 0 ? (
              <View style={styles.emptyList}>
                <Ionicons name="people-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>No has añadido a nadie todavía.</Text>
              </View>
            ) : (
                <ScrollView style={styles.participantesList} showsVerticalScrollIndicator={false}>
                  {participantes.map((p, index) => (
                    <View key={index} style={[styles.participanteRow, { backgroundColor: isDark ? "#ffffff05" : "#f8fafc", borderColor: colors.border }]}>
                      <View style={[styles.memberAvatar, { backgroundColor: `${colors.primary}10` }]}>
                         <Text style={{ color: colors.primary, fontWeight: '800' }}>{p.correo.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }} numberOfLines={1}>{p.correo}</Text>
                        <Text style={{ color: "#8b5cf6", fontSize: 11, fontWeight: "700", marginTop: 2 }}>{p.rol_en_caso.toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleEliminarParticipante(p.correo)} style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
            )}
          </View>
        </View>
      </View>

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

    </WebDashboardLayout>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    // Actions
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
  mainGrid: {
    flexDirection: 'row',
    gap: 32,
    flexWrap: 'wrap',
  },
  leftCol: {
    flex: 3,
    minWidth: 450,
  },
  rightCol: {
    flex: 2,
    minWidth: 350,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  field: {
    marginBottom: 20,
  },
  readonlyInputBase: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyWarning: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
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
  selectionItemCol: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  helperInfo: {
    fontSize: 14,
    lineHeight: 20,
  },
  addMemberBox: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleSelectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 16,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
  },
  participantesList: {
    maxHeight: 400,
  },
  participanteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 450,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  } as any,
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 8,
  }
});
