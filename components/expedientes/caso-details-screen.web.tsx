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
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

  // Add Participant inputs
  const ROLES = ["Familiar/Tutor", "Maestro Sombra", "Terapeuta Principal", "Terapeuta de Apoyo"];
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoRol, setNuevoRol] = useState(ROLES[0]);
  const [addingParticipant, setAddingParticipant] = useState(false);

  // Template Structure Viewer state
  const [modalEstructuraVisible, setModalEstructuraVisible] = useState(false);
  const [loadingEstructura, setLoadingEstructura] = useState(false);
  const [estructuraData, setEstructuraData] = useState<PlantillaEstructura | null>(null);

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
      fetchDetalles(true);
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
      setNuevoCorreo("");
      fetchDetalles(true);
    }
  };

  const handleVerEstructura = async () => {
    if (!caso?.plantilla_id) return;
    setModalEstructuraVisible(true);
    setLoadingEstructura(true);
    const data = await getPlantillaEstructura(caso.plantilla_id);
    setEstructuraData(data);
    setLoadingEstructura(false);
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

  const isCreator = caso.usuario_id === currentUid || caso.creado_por === currentUid;
  const pseudonimo = caso.alumnos?.pseudonimo || "Alumno Desconocido";
  const inicial = pseudonimo.charAt(0).toUpperCase();

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
        shadowOpacity: isDark ? 0.15 : 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }
    })
  } as any;

  return (
    <WebDashboardLayout>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER PRINCIPAL */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => (isEditing ? setIsEditing(false) : router.back())} 
            style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", borderColor: colors.border }]}
          >
            <Ionicons name={isEditing ? "close" : "arrow-back"} size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? "Editar Expediente" : "Detalle del Expediente"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {isEditing ? `Modificando caso de ${pseudonimo}` : `Información completa y equipo de trabajo`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {isCreator && !isEditing && (
            <TouchableOpacity 
              style={[styles.editBtn, { backgroundColor: `${colors.primary}15` }]} 
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "700", marginLeft: 8 }}>Editar</Text>
            </TouchableOpacity>
          )}
          {!isEditing && (
            <PrimaryButton 
              title="Nueva Bitácora"
              onPress={() => router.push({ pathname: "/bitacora/nueva", params: { casoId: casoId } } as any)}
              style={{ width: 'auto', paddingHorizontal: 20, marginLeft: 12 }}
              icon={<Ionicons name="add" size={20} color="#fff" />}
            />
          )}
          {isEditing && (
            <PrimaryButton 
              title="Guardar Cambios" 
              onPress={handleSaveBase} 
              loading={savingBase}
              style={{ width: 'auto', paddingHorizontal: 20 }}
            />
          )}
        </View>
      </View>

      {/* SECCIÓN HERO / ALUMNO */}
      <View style={[styles.heroCard, cardStyle]}>
        <View style={[styles.bigAvatar, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
          <Text style={[styles.bigAvatarText, { color: colors.primary }]}>{inicial}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 24 }}>
          <Text style={[styles.titleName, { color: colors.text }]}>{pseudonimo}</Text>
          <View style={styles.pillsRow}>
            <View style={[styles.pill, { backgroundColor: caso.estado === "activo" ? "#10b98115" : "#64748b15" }]}>
              <View style={[styles.pillDot, { backgroundColor: caso.estado === "activo" ? "#10b981" : "#64748b" }]} />
              <Text style={[styles.pillText, { color: caso.estado === "activo" ? "#10b981" : "#64748b" }]}>{caso.estado.toUpperCase()}</Text>
            </View>
            {caso.alumnos?.nivel_tea ? (
              <View style={[styles.pill, { backgroundColor: "#f59e0b15" }]}>
                <Ionicons name="alert-circle-outline" size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                <Text style={[styles.pillText, { color: "#f59e0b" }]}>Nivel TEA: {caso.alumnos.nivel_tea}</Text>
              </View>
            ) : null}
            <View style={[styles.pill, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9" }]}>
               <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
               <Text style={[styles.pillText, { color: colors.textSecondary }]}>Creado: {new Date(caso.fecha_asignacion).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.gridRow}>
        {/* COLUMNA IZQUIERDA: INFORMACIÓN BASE */}
        <View style={styles.col}>
          <View style={[styles.sectionCard, cardStyle]}>
            <SectionHeader icon="folder-open-outline" label="Configuración del Caso" color={colors.primary} bg={`${colors.primary}10`} />
            
            {isEditing ? (
              <View style={{ gap: 20 }}>
                <View style={styles.field}>
                  <FormLabel label="Plantilla de Bitácora" helperText="Determina el formato de los reportes diarios" />
                  <TouchableOpacity
                    onPress={() => setModalPlantillasVisible(true)}
                    style={[styles.selectorBtn, { backgroundColor: isDark ? "#ffffff08" : "#f8fafc", borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>
                      {listaPlantillas.find(p => p.plantilla_id === plantillaId)?.nombre || "Sin plantilla asignada"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.field}>
                  <FormLabel label="Notas u Objetivos Compartidos" />
                  <FormTextArea placeholder="Escribe los objetivos del caso..." value={notas} onChangeText={setNotas} minHeight={150} />
                </View>
              </View>
            ) : (
              <View style={{ gap: 24 }}>
                <View style={styles.readonlyItem}>
                  <Text style={[styles.readonlyLabel, { color: colors.textSecondary }]}>Plantilla de Seguimiento</Text>
                  <View style={styles.valueRow}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? "#ffffff08" : "#f8fafc" }]}>
                       <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.readonlyValue, { color: colors.text, flex: 1 }]}>
                      {caso.plantillas?.nombre || "Sin plantilla específica"}
                    </Text>
                    {caso.plantilla_id && (
                      <TouchableOpacity onPress={handleVerEstructura} style={styles.viewBtn}>
                        <Ionicons name="eye-outline" size={18} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 6, fontSize: 13 }}>Ver estructura</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.readonlyItem}>
                  <Text style={[styles.readonlyLabel, { color: colors.textSecondary }]}>Notas y Contexto</Text>
                  <View style={[styles.notesContainer, { backgroundColor: isDark ? '#ffffff05' : '#f8fafc', borderColor: colors.border }]}>
                    <Text style={{ color: caso.notas_asignacion ? colors.text : colors.textSecondary, lineHeight: 24, fontSize: 15 }}>
                      {caso.notas_asignacion || "No se han definido notas u objetivos para este caso."}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* COLUMNA DERECHA: EQUIPO Y PARTICIPANTES */}
        <View style={styles.col}>
          <View style={[styles.sectionCard, cardStyle]}>
            <SectionHeader icon="people-outline" label={isEditing ? "Gestionar Colaboradores" : "Equipo de Trabajo"} color="#8b5cf6" bg="#f5f3ff" />
            
            {!isEditing ? (
              <View style={{ gap: 4 }}>
                {caso.participantes.map((part, idx) => (
                  <View key={idx} style={[styles.participantRow, { borderBottomWidth: idx === caso.participantes.length - 1 ? 0 : 1, borderBottomColor: isDark ? '#ffffff05' : '#f1f5f9' }]}>
                    <View style={[styles.partAvatar, { backgroundColor: `${colors.primary}15` }]}>
                      <Text style={{ color: colors.primary, fontWeight: '800' }}>{part.usuario?.nombres?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={[styles.partName, { color: colors.text }]}>{part.usuario?.nombres} {part.usuario?.apellidos}</Text>
                      <Text style={[styles.partEmail, { color: colors.textSecondary }]}>{part.usuario?.correo}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: isDark ? '#8b5cf620' : '#f5f3ff' }]}>
                      <Text style={{ color: "#8b5cf6", fontSize: 11, fontWeight: '800' }}>{part.rol_en_caso.toUpperCase()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ gap: 20 }}>
                <View style={styles.addSection}>
                  <FormLabel label="Añadir Colaborador" helperText="Ingresa el correo del profesional" />
                  <FormInput placeholder="profesional@ejemplo.com" value={nuevoCorreo} onChangeText={setNuevoCorreo} autoCapitalize="none" icon="mail-outline" />
                  
                  <View style={{ marginTop: 16 }}>
                    <FormLabel label="Asignar Rol" />
                    <View style={styles.teaGrid}>
                      {ROLES.map(r => (
                        <TouchableOpacity 
                          key={r} 
                          onPress={() => setNuevoRol(r)}
                          style={[styles.teaBtn, { backgroundColor: nuevoRol === r ? "#8b5cf6" : (isDark ? "#ffffff08" : "#f1f5f9"), borderColor: nuevoRol === r ? "#8b5cf6" : colors.border, borderWidth: 1 }]}
                        >
                          <Text style={{ color: nuevoRol === r ? "#fff" : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <PrimaryButton 
                    title="Agregar al Equipo" 
                    onPress={handleAddParticipant} 
                    loading={addingParticipant} 
                    style={{ marginTop: 24, backgroundColor: "#8b5cf6" }}
                    icon={<Ionicons name="person-add-outline" size={20} color="#fff" />}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* MODALES REUTILIZADOS */}
      <Modal visible={modalPlantillasVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar Plantilla</Text>
              <TouchableOpacity onPress={() => setModalPlantillasVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {listaPlantillas.map(p => (
                <TouchableOpacity 
                  key={p.plantilla_id} 
                  onPress={() => { setPlantillaId(p.plantilla_id); setModalPlantillasVisible(false); }}
                  style={[styles.modalItem, plantillaId === p.plantilla_id && { backgroundColor: `${colors.primary}15` }]}
                >
                  <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>{p.nombre}</Text>
                  {plantillaId === p.plantilla_id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={() => { setPlantillaId(null); setModalPlantillasVisible(false); }}
                style={[styles.modalItem, plantillaId === null && { backgroundColor: `${colors.primary}15` }]}
              >
                <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>Sin plantilla</Text>
                {plantillaId === null && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalEstructuraVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", width: 600 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Estructura de Bitácora</Text>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>{estructuraData?.nombre}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalEstructuraVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {loadingEstructura ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {estructuraData?.secciones.map(sec => (
                  <View key={sec.seccion_id} style={styles.structureSection}>
                    <Text style={[styles.structureSecTitle, { color: colors.text, borderBottomColor: colors.border }]}>
                      {sec.nombre}
                    </Text>
                    {sec.campos.map(campo => (
                      <View key={campo.campo_id} style={styles.structureField}>
                        <View style={[styles.fieldDot, { backgroundColor: colors.primary }]} />
                        <Text style={{ color: colors.text, fontWeight: '600', flex: 1 }}>{campo.etiqueta}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: isDark ? '#ffffff08' : '#f8fafc' }]}>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{campo.tipo.toUpperCase()}</Text>
                        </View>
                        {campo.requerido && <Ionicons name="star" size={10} color={colors.error} />}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </WebDashboardLayout>
  );
}

function SectionHeader({ icon, label, color, bg }: any) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionIconBox, { backgroundColor: bg || `${color}10` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerSub: { fontSize: 16, marginTop: 4 },
  editBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 44, borderRadius: 12 },
  heroCard: { flexDirection: 'row', alignItems: 'center', padding: 32, borderRadius: 24, marginBottom: 32 },
  bigAvatar: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center", borderWidth: 2 },
  bigAvatarText: { fontSize: 36, fontWeight: "800" },
  titleName: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  pillsRow: { flexDirection: "row", gap: 12, flexWrap: 'wrap' },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24 },
  pillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  pillText: { fontSize: 13, fontWeight: "800" },
  gridRow: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  col: { flex: 1, minWidth: 450 },
  sectionCard: { borderRadius: 24, padding: 32, marginBottom: 24 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 18, fontWeight: "800" },
  readonlyItem: { marginBottom: 24 },
  readonlyLabel: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  readonlyValue: { fontSize: 17, fontWeight: '600' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.02)' },
  notesContainer: { padding: 24, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed' },
  participantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  partAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  partName: { fontSize: 16, fontWeight: '700' },
  partEmail: { fontSize: 13 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  field: { marginBottom: 20 },
  addSection: { padding: 20, backgroundColor: 'rgba(0,0,0,0.015)', borderRadius: 20 },
  teaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  teaBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  selectorBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56, borderRadius: 14, borderWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 450, borderRadius: 24, padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' } as any,
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 14, marginBottom: 6 },
  structureSection: { marginBottom: 28 },
  structureSecTitle: { fontSize: 19, fontWeight: '800', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 16 },
  structureField: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  fieldDot: { width: 6, height: 6, borderRadius: 3 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
