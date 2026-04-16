import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import {
  actualizarCasoBase,
  agregarParticipanteExistente,
  CasoDetalleData,
  getCasoDetalle,
} from "@/services/casos.service";
import { getPlantillas, getPlantillaEstructura, PlantillaData, PlantillaEstructura } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

export function CasoDetailsScreen() {
  const { id } = useLocalSearchParams();
  const casoId = parseInt(id as string, 10);

  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [caso, setCaso] = useState<CasoDetalleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [savingBase, setSavingBase] = useState(false);
  
  // Base details inputs
  const [plantillaId, setPlantillaId] = useState<number | null>(null);
  const [notas, setNotas] = useState("");
  const [listaPlantillas, setListaPlantillas] = useState<PlantillaData[]>([]);
  const [modalPlantillasVisible, setModalPlantillasVisible] = useState(false);

  // Derivación del texto seleccionado
  const plantillaSeleccionadaTexto = listaPlantillas.find((p) => p.plantilla_id === plantillaId)?.nombre || (plantillaId === null ? "Ninguna / Sin plantilla" : "Seleccione una plantilla");

  // Add Participant inputs
  const ROLES = ["Familiar/Tutor", "Maestro Sombra", "Terapeuta Principal", "Terapeuta de Apoyo"];
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoRol, setNuevoRol] = useState(ROLES[0]);
  const [addingParticipant, setAddingParticipant] = useState(false);

  // Template Structure Viewer state
  const [modalEstructuraVisible, setModalEstructuraVisible] = useState(false);
  const [loadingEstructura, setLoadingEstructura] = useState(false);
  const [estructuraData, setEstructuraData] = useState<PlantillaEstructura | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  const fetchDetalles = async (active: boolean) => {
    const session = await getCurrentSession();
    const uid = session?.user.id || "";
    if (session && active) setCurrentUid(uid);

    const [data, plantillasRes] = await Promise.all([
      getCasoDetalle(casoId),
      uid ? getPlantillas(uid) : Promise.resolve([])
    ]);
    
    if (active) {
      if (data) {
        setCaso(data);
        syncFormState(data);
      }
      setListaPlantillas(plantillasRes);
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fetchDetalles(active);
      return () => { active = false; };
    }, [casoId])
  );

  const syncFormState = (data: CasoDetalleData) => {
    setPlantillaId(data.plantilla_id || null);
    setNotas(data.notas_asignacion || "");
  };

  const handleSaveBase = async () => {
    setSavingBase(true);
    const res = await actualizarCasoBase(casoId, plantillaId, notas.trim() || null);
    setSavingBase(false);

    if (res.error) {
      Alert.alert("Error", res.error);
    } else {
      Alert.alert("Éxito", "La información del expediente se actualizó.");
      setIsEditing(false);
      fetchDetalles(true); // Refrescar info
    }
  };

  const handleAddParticipant = async () => {
    if (!nuevoCorreo.trim()) {
      Alert.alert("Requerido", "Escribe el correo electrónico.");
      return;
    }

    setAddingParticipant(true);
    const res = await agregarParticipanteExistente(casoId, nuevoCorreo.trim(), nuevoRol, currentUid);
    setAddingParticipant(false);

    if (res.error) {
      Alert.alert("Hubo un problema", res.error);
    } else {
      Alert.alert("Añadido", "El participante se agregó al caso correctamente.");
      setNuevoCorreo(""); // Limpiar
      fetchDetalles(true); // Refrescar lista de participantes
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!caso) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No se pudo cargar el expediente.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleVerEstructura = async () => {
    if (!caso?.plantilla_id) return;
    setModalEstructuraVisible(true);
    setLoadingEstructura(true);
    const data = await getPlantillaEstructura(caso.plantilla_id);
    setEstructuraData(data);
    setLoadingEstructura(false);
  };

  const isCreator = caso.usuario_id === currentUid || caso.creado_por === currentUid;
  const pseudonimo = caso.alumnos?.pseudonimo || "Alumno Desconocido";
  const inicial = pseudonimo.charAt(0).toUpperCase();
  const nivelTea = caso.alumnos?.nivel_tea;

  const cardStyle = {
    backgroundColor: isDark ? colors.backgroundSecondary : "#fff",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  } as const;

  const getRolIcon = (rol: string) => {
    switch (rol.toLowerCase()) {
      case "tutor principal":
      case "terapeuta principal": return "star";
      case "maestro sombra":
      case "sombra": return "body";
      case "terapeuta de apoyo": return "medkit";
      case "familiar/tutor": return "home";
      default: return "person";
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => (isEditing ? setIsEditing(false) : router.back())} style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}>
          <Ionicons name={isEditing ? "close" : "arrow-back"} size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? "Editar Expediente" : "Expediente / Caso"}</Text>
        <View style={{ flex: 1 }} />
        {isCreator && !isEditing && (
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: `${colors.primary}15` }]} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 4 }}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* AVATAR Y ESTADO */}
        {(!isEditing) && (
          <View style={styles.topSection}>
            <View style={[styles.bigAvatar, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40`, borderWidth: 2 }]}>
              <Text style={[styles.bigAvatarText, { color: colors.primary }]}>{inicial}</Text>
            </View>
            <Text style={[styles.titleName, { color: colors.text }]}>{pseudonimo}</Text>
            <View style={styles.pillsRow}>
              <View style={[styles.pill, { backgroundColor: caso.estado === "activo" ? "#10b98120" : "#64748b20" }]}>
                 <View style={[styles.pillDot, { backgroundColor: caso.estado === "activo" ? "#10b981" : "#64748b" }]} />
                 <Text style={[styles.pillText, { color: caso.estado === "activo" ? "#10b981" : "#64748b" }]}>{caso.estado.toUpperCase()}</Text>
              </View>
              {nivelTea ? (
                <View style={[styles.pill, { backgroundColor: "#f59e0b20" }]}><Text style={[styles.pillText, { color: "#f59e0b" }]}>Nivel TEA: {nivelTea}</Text></View>
              ) : null}
            </View>
          </View>
        )}

        {/* DETALLES GENERALES */}
        <View style={[styles.sectionCard, cardStyle]}>
          <SectionHeader icon="folder-open-outline" label="Información Base" color={colors.primary} />
          
          {isEditing ? (
             <View>
               <View style={styles.field}>
                 <FormLabel label="Plantilla Asignada" />
                 
                 {/* Botón que abre el selector modal */}
                 <TouchableOpacity
                    onPress={() => setModalPlantillasVisible(true)}
                    style={[styles.selectorBtn, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9", borderColor: isDark ? "#ffffff20" : "#cbd5e1" }]}
                 >
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500", flex: 1 }}>
                       {plantillaSeleccionadaTexto}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                 </TouchableOpacity>
                 
               </View>
               
               <View style={styles.field}>
                 <FormLabel label="Notas del Caso" />
                 <FormTextArea placeholder="Notas u objetivos compartidos..." value={notas} onChangeText={setNotas} minHeight={100} />
               </View>
               
               <PrimaryButton title="Guardar Cambios Base" onPress={handleSaveBase} loading={savingBase} />
             </View>
          ) : (
             <View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Plantilla Asignada:</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{caso.plantillas?.nombre || "Sin plantilla específica"}</Text>
                    {caso.plantilla_id && (
                      <TouchableOpacity onPress={handleVerEstructura} style={{ marginLeft: 8, padding: 4, backgroundColor: `${colors.primary}15`, borderRadius: 12 }}>
                        <Ionicons name="eye-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Fecha de Creación:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{new Date(caso.fecha_asignacion).toLocaleDateString()}</Text>
                </View>
                <View style={{ marginTop: 15 }}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary, marginBottom: 6 }]}>Notas u Objetivos Compartidos:</Text>
                  <View style={[styles.notesBox, { backgroundColor: isDark ? "#ffffff08" : "#f8fafc" }]}>
                    <Text style={[{ color: caso.notas_asignacion ? colors.text : colors.textSecondary, lineHeight: 22 }]}>
                      {caso.notas_asignacion || "No hay notas añadidas para este expediente."}
                    </Text>
                  </View>
                </View>
             </View>
          )}
        </View>

        {/* PARTICIPANTES Y EDICIÓN DE ADDITION */}
        {(!isEditing) ? (
          <View style={[styles.sectionCard, cardStyle]}>
             <SectionHeader icon="people-outline" label="Equipo de Trabajo" color="#8b5cf6" />
             {caso.participantes.length === 0 ? (
               <Text style={{ color: colors.textSecondary, fontStyle: "italic", textAlign: "center", marginVertical: 10 }}>No se encontraron participantes.</Text>
             ) : (
               caso.participantes.map((part, idx) => {
                 const inicialPart = part.usuario?.nombres ? part.usuario.nombres.charAt(0).toUpperCase() : "?";
                 const isLast = idx === caso.participantes.length - 1;
                 
                 return (
                   <View key={idx} style={[styles.participantRow, { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
                      <View style={[styles.partAvatar, { backgroundColor: `${colors.primary}15` }]}>
                        <Text style={[styles.partAvatarText, { color: colors.primary }]}>{inicialPart}</Text>
                        <View style={[styles.partIconBadge, { backgroundColor: isDark ? "#2d3748" : "#fff" }]}>
                           <Ionicons name={getRolIcon(part.rol_en_caso)} size={10} color="#8b5cf6" />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.partName, { color: colors.text }]}>{part.usuario?.nombres} {part.usuario?.apellidos}</Text>
                        <Text style={[styles.partEmail, { color: colors.textSecondary }]}>{part.usuario?.correo}</Text>
                      </View>
                      <View style={[styles.rolBadge, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
                         <Text style={[styles.rolText, { color: colors.textSecondary }]}>{part.rol_en_caso}</Text>
                      </View>
                   </View>
                 );
               })
             )}
          </View>
        ) : (
          <View style={[styles.sectionCard, cardStyle]}>
             <SectionHeader icon="person-add-outline" label="Añadir Participante" color="#8b5cf6" />
             <View style={styles.field}>
                <FormLabel label="Correo del empleado" />
                <FormInput placeholder="correo@ejemplo.com" value={nuevoCorreo} onChangeText={setNuevoCorreo} keyboardType="email-address" autoCapitalize="none" />
             </View>
             <View style={styles.field}>
               <FormLabel label="Rol en Caso" />
               <View style={styles.teaGrid}>
                  {ROLES.map((rolLabel) => (
                    <TouchableOpacity
                      key={rolLabel}
                      style={[styles.teaBtn, { backgroundColor: nuevoRol === rolLabel ? "#8b5cf6" : isDark ? "#ffffff10" : "#f1f5f9" }]}
                      onPress={() => setNuevoRol(rolLabel)}
                    >
                       <Text style={{ color: nuevoRol === rolLabel ? "#fff" : colors.textSecondary, fontWeight: nuevoRol === rolLabel ? "bold" : "500", fontSize: 13 }}>{rolLabel}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
             </View>
             
             <View style={{ marginTop: 10 }}>
               <PrimaryButton title="Invitar / Agregar" onPress={handleAddParticipant} loading={addingParticipant} icon={<Ionicons name="add" size={20} color="#fff" />} color="#8b5cf6" />
             </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* MODAL DE SELECCIÓN DE PLANTILLAS */}
      <Modal visible={modalPlantillasVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecciona una Plantilla</Text>
              <TouchableOpacity onPress={() => setModalPlantillasVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {listaPlantillas.map((p) => (
                <TouchableOpacity
                  key={p.plantilla_id}
                  onPress={() => {
                    setPlantillaId(p.plantilla_id);
                    setModalPlantillasVisible(false);
                  }}
                  style={[styles.modalItem, plantillaId === p.plantilla_id && { backgroundColor: `${colors.primary}15` }]}
                >
                  <Text style={{ color: plantillaId === p.plantilla_id ? colors.primary : colors.text, fontWeight: plantillaId === p.plantilla_id ? "bold" : "500", fontSize: 15 }}>
                    {p.nombre}
                  </Text>
                  {plantillaId === p.plantilla_id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setPlantillaId(null);
                  setModalPlantillasVisible(false);
                }}
                style={[styles.modalItem, plantillaId === null && { backgroundColor: `${colors.primary}15` }]}
              >
                <Text style={{ color: plantillaId === null ? colors.primary : colors.text, fontWeight: plantillaId === null ? "bold" : "500", fontSize: 15 }}>
                  Ninguna / Sin plantilla
                </Text>
                {plantillaId === null && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ESTRUCTURA DE PLANTILLA */}
      <Modal visible={modalEstructuraVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Estructura Asignada</Text>
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginTop: 2 }}>
                  {estructuraData?.nombre || "Cargando..."}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalEstructuraVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingEstructura ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                {estructuraData?.secciones.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontStyle: "italic", textAlign: "center" }}>La plantilla no tiene secciones.</Text>
                ) : (
                  estructuraData?.secciones.map((sec) => (
                    <View key={sec.seccion_id} style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "#ffffff20" : "#e2e8f0", paddingBottom: 6 }}>
                        {sec.nombre}
                      </Text>
                      {sec.descripcion ? <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{sec.descripcion}</Text> : null}
                      
                      <View style={{ paddingLeft: 12 }}>
                        {sec.campos.length === 0 ? (
                          <Text style={{ color: colors.textSecondary, fontStyle: "italic", fontSize: 13 }}>No hay campos.</Text>
                        ) : (
                          sec.campos.map((campo) => (
                            <View key={campo.campo_id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 8 }} />
                              <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>
                                {campo.etiqueta} <Text style={{ color: colors.textSecondary, fontSize: 12 }}>({campo.tipo})</Text>
                              </Text>
                              {campo.requerido && <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "bold" }}>*</Text>}
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
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
    paddingBottom: 10,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  editBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  
  topSection: { alignItems: "center", marginBottom: 20 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  bigAvatarText: { fontSize: 34, fontWeight: "bold" },
  titleName: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  pillsRow: { flexDirection: "row", gap: 10 },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: "700" },

  sectionCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  sectionLabel: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  infoLabel: { fontSize: 14, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600" },
  notesBox: { padding: 14, borderRadius: 12 },

  participantRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  partAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 },
  partAvatarText: { fontSize: 16, fontWeight: "bold" },
  partIconBadge: { position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  partName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  partEmail: { fontSize: 12 },
  rolBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  rolText: { fontSize: 11, fontWeight: "700" },
  
  field: { marginBottom: 15 },
  teaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 },
  teaBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },

  selectorBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", borderRadius: 10 },
});
