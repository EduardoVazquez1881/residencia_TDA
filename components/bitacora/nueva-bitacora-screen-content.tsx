import { FormInput } from "@/components/ui/form-input";
import { FormLabel } from "@/components/ui/form-label";
import { FormTextArea } from "@/components/ui/form-textarea";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { crearBitacoraCompleta, getBitacoraConRespuestas, actualizarBitacoraCompleta, revisarBitacora } from "@/services/bitacoras.service";
import { getCasoDetalle, CasoDetalleData } from "@/services/casos.service";
import { getPlantillaEstructura, PlantillaEstructura } from "@/services/plantillas.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function NuevaBitacoraScreenContent() {
  const { casoId, plantillaId, editId } = useLocalSearchParams();
  const cid = parseInt(casoId as string, 10);
  const pid = parseInt(plantillaId as string, 10);
  const bid = editId ? parseInt(editId as string, 10) : null;

  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  // Data states
  const [caso, setCaso] = useState<CasoDetalleData | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaEstructura | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form base states
  const [fecha, setFecha] = useState(new Date());
  const [horaEntrada, setHoraEntrada] = useState<Date | null>(null);
  const [horaSalida, setHoraSalida] = useState<Date | null>(null);
  const [contexto, setContexto] = useState("");

  // Respuestas del motor dinámico
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});

  // DateTimePicker modals state
  const [showPicker, setShowPicker] = useState<string | number | null>(null);

  // Revision / Evaluation states
  const [isTerapeuta, setIsTerapeuta] = useState(false);
  const [notasRevision, setNotasRevision] = useState("");
  const [revisadoPorName, setRevisadoPorName] = useState<string | null>(null);
  const [fechaRevision, setFechaRevision] = useState<string | null>(null);
  const [savingRevision, setSavingRevision] = useState(false);
  const [estadoBitacora, setEstadoBitacora] = useState<string>("borrador");
  const [creadoPorId, setCreadoPorId] = useState<string | null>(null);

  const shouldLockForm = estadoBitacora === 'revisado' || (isTerapeuta && bid !== null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cData, pData, session] = await Promise.all([
          getCasoDetalle(cid),
          getPlantillaEstructura(pid),
          getCurrentSession()
        ]);
        setCaso(cData);
        setPlantilla(pData);

        const currentUserId = session?.user?.id || null;
        if (cData && currentUserId) {
          const isOwner = cData.usuario_id === currentUserId;
          const isCreator = cData.creado_por === currentUserId;
          const isPartTerapeuta = cData.participantes?.some(
            (p: any) => p.usuario?.usuario_id === currentUserId && p.rol_en_caso?.toLowerCase().includes("terapeuta")
          ) || false;
          setIsTerapeuta(isOwner || isCreator || isPartTerapeuta);
        }

        // Si es edición, cargar datos guardados
        if (bid) {
          const bitData = await getBitacoraConRespuestas(bid);
          if (bitData) {
            // Sincronizar estados base
            if (bitData.fecha) {
              const [y, m, d] = bitData.fecha.split('-').map(Number);
              setFecha(new Date(y, m - 1, d));
            }
            if (bitData.hora_entrada) {
              const d = new Date();
              const [h, min] = bitData.hora_entrada.split(':').map(Number);
              d.setHours(h, min, 0);
              setHoraEntrada(d);
            }
            if (bitData.hora_salida) {
              const d = new Date();
              const [h, min] = bitData.hora_salida.split(':').map(Number);
              d.setHours(h, min, 0);
              setHoraSalida(d);
            }
            setContexto(bitData.contexto || "");
            
            // Sincronizar respuestas dinámicas
            const hashResp: Record<number, string> = {};
            bitData.respuestas.forEach((r: any) => {
              hashResp[r.campo_id] = r.valor;
            });
            setRespuestas(hashResp);

            // Sincronizar revisión
            setNotasRevision(bitData.notas_revision || "");
            setEstadoBitacora(bitData.estado || "borrador");
            setCreadoPorId(bitData.creado_por || bitData.sombra_id || null);
            
            if (bitData.revisado_por_user) {
              const revName = `${bitData.revisado_por_user.nombres} ${bitData.revisado_por_user.apellidos}`;
              setRevisadoPorName(revName);
            } else {
              setRevisadoPorName(null);
            }
            if (bitData.fecha_revision) {
              setFechaRevision(new Date(bitData.fecha_revision).toLocaleDateString());
            } else {
              setFechaRevision(null);
            }
          }
        }
      } catch (err) {
        console.error("Error loading for bitacora:", err);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    };
    if (cid && pid) fetchData();
  }, [cid, pid, bid, fadeAnim]);

  const updateRespuesta = (campoId: number, valor: string) => {
    setRespuestas(prev => ({ ...prev, [campoId]: valor }));
  };

  const formatearTiempo = (d: Date | null) => {
    if (!d) return null;
    return d.toTimeString().split(' ')[0]; // Returns HH:MM:SS
  };

  const formatearFecha = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const fixedDate = new Date(d.getTime() - offset * 60 * 1000);
    return fixedDate.toISOString().split('T')[0];
  };

  const handleGuardar = async () => {
    if (!plantilla) return;

    // Validación de obligatorios
    for (const sec of plantilla.secciones) {
      for (const campo of sec.campos) {
        if (campo.requerido) {
          const val = respuestas[campo.campo_id];
          if (!val || val.trim() === "") {
            Alert.alert("Campos obligatorios", `La sección '${sec.nombre}' requiere respuesta en '${campo.etiqueta}'.`);
            return;
          }
        }
      }
    }

    const session = await getCurrentSession();
    if (!session?.user?.id) {
      Alert.alert("Error", "No se detectó sesión de usuario activa.");
      return;
    }

    setSaving(true);
    const payload = {
      caso_id: cid,
      plantilla_id: pid,
      sombra_id: session.user.id,
      creado_por: session.user.id,
      fecha: formatearFecha(fecha),
      hora_entrada: formatearTiempo(horaEntrada) || undefined,
      hora_salida: formatearTiempo(horaSalida) || undefined,
      contexto: contexto.trim() || undefined,
    };

    let res;
    if (bid) {
      res = await actualizarBitacoraCompleta(bid, payload, respuestas);
    } else {
      res = await crearBitacoraCompleta(payload, respuestas);
    }
    setSaving(false);

    if (res.error) {
      if (Platform.OS === 'web') {
        alert("Error guardando: " + res.error);
      } else {
        Alert.alert("Error guardando", res.error);
      }
    } else {
      if (Platform.OS === 'web') {
        alert(bid ? "Cambios guardados correctamente." : "Bitácora creada y registrada exitosamente.");
        router.replace("/reportes" as any);
      } else {
        Alert.alert("Éxito", bid ? "Cambios guardados correctamente." : "Bitácora creada y registrada exitosamente.", [
          { text: "Entendido", onPress: () => router.navigate(bid ? "/reportes" : "/prueba" as any) }
        ]);
      }
    }
  };

  const handleRevisar = async (nuevoEstado: 'revisado' | 'devuelta') => {
    if (!bid) return;
    
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      if (Platform.OS === 'web') {
        alert("Error: No se detectó sesión de usuario activa.");
      } else {
        Alert.alert("Error", "No se detectó sesión de usuario activa.");
      }
      return;
    }

    setSavingRevision(true);
    const { error } = await revisarBitacora(bid, {
      revisado_por: session.user.id,
      notas_revision: notasRevision.trim(),
      estado: nuevoEstado
    });
    setSavingRevision(false);

    if (error) {
      if (Platform.OS === 'web') {
        alert("Error al guardar revisión: " + error);
      } else {
        Alert.alert("Error", "Error al guardar revisión: " + error);
      }
    } else {
      // Enviar notificaciones por roles
      try {
        const { notificarRevisionBitacora } = await import("@/services/notificaciones.service");
        await notificarRevisionBitacora(
          cid,
          bid,
          creadoPorId || "",
          session.user.id,
          nuevoEstado,
          notasRevision
        );
      } catch (e) {
        console.error("Error al enviar notificaciones de revisión:", e);
      }

      const msg = nuevoEstado === 'revisado' 
        ? "La bitácora ha sido revisada y aprobada." 
        : "La bitácora ha sido devuelta a la sombra.";
      
      if (Platform.OS === 'web') {
        alert(msg);
        router.replace("/reportes" as any);
      } else {
        Alert.alert("Éxito", msg, [
          { text: "Entendido", onPress: () => router.navigate("/reportes" as any) }
        ]);
      }
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedDate) {
      if (showPicker === "fecha") setFecha(selectedDate);
      else if (showPicker === "entrada") setHoraEntrada(selectedDate);
      else if (showPicker === "salida") setHoraSalida(selectedDate);
      else if (typeof showPicker === "number") {
        updateRespuesta(showPicker, selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const renderPickerBtn = (label: string, isSet: boolean, valStr: string, mode: "fecha" | "entrada" | "salida", clear: boolean = false) => (
    <View style={styles.pickerBox}>
      <Text style={[styles.microLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity 
          style={[styles.pickerBtn, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9" }]} 
          onPress={() => {
            if (!shouldLockForm) setShowPicker(mode);
          }}
          disabled={shouldLockForm}
        >
          <Ionicons name={mode === "fecha" ? "calendar-outline" : "time-outline"} size={16} color={colors.primary} />
          <Text style={{ color: isSet ? colors.text : colors.textSecondary, marginLeft: 6, fontWeight: "500", fontSize: 13 }}>
            {valStr}
          </Text>
        </TouchableOpacity>
        {clear && isSet && (
          <TouchableOpacity 
            style={{ padding: 8, marginLeft: 4 }} 
            onPress={() => {
              if (!shouldLockForm) {
                mode === "entrada" ? setHoraEntrada(null) : setHoraSalida(null);
              }
            }}
            disabled={shouldLockForm}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const handleClosePicker = () => {
    if (showPicker === "entrada" && !horaEntrada) setHoraEntrada(new Date());
    if (showPicker === "salida" && !horaSalida) setHoraSalida(new Date());
    setShowPicker(null);
  };

  if (loading || !plantilla || !caso) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? colors.backgroundSecondary : "#f0f4f8" }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{bid ? "Modificar Bitácora" : "Registrar Bitácora"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
        
        {/* INFO CABECERA */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", shadowOpacity: isDark ? 0.15 : 0.05 }]}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>Expediente Asociado</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{caso.alumnos?.pseudonimo}</Text>
          <View style={{ height: 1, backgroundColor: isDark ? "#ffffff20" : "#e2e8f0", marginVertical: 12 }} />
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            {renderPickerBtn("Fecha", true, fecha.toLocaleDateString(), "fecha", false)}
            {renderPickerBtn("Cita (Entrada)", horaEntrada !== null, horaEntrada ? horaEntrada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Seleccionar", "entrada", true)}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
            {renderPickerBtn("Cita (Salida)", horaSalida !== null, horaSalida ? horaSalida.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Seleccionar", "salida", true)}
          </View>

          <FormLabel label="Contexto Adicional (Opcional)" />
          <FormTextArea 
            placeholder="Ej. El día estuvo muy lluvioso..." 
            value={contexto} 
            onChangeText={setContexto} 
            minHeight={60} 
            editable={!shouldLockForm} 
          />
        </View>

        {/* MOTOR DINÁMICO */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", shadowOpacity: isDark ? 0.15 : 0.05 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary, marginBottom: 15 }}>Cuestionario</Text>
          
          {plantilla.secciones.map((sec) => (
            <View key={sec.seccion_id} style={{ marginBottom: 25 }}>
              <View style={[styles.secTitleBox, { backgroundColor: `${colors.primary}10` }]}>
                <Text style={[styles.secTitle, { color: colors.primary }]}>{sec.nombre}</Text>
                {sec.descripcion && <Text style={{ color: colors.primary, opacity: 0.7, fontSize: 12, marginTop: 2 }}>{sec.descripcion}</Text>}
              </View>

              {sec.campos.map(campo => {
                const currentVal = respuestas[campo.campo_id] || "";
                
                return (
                  <View key={campo.campo_id} style={styles.dinamicField}>
                    <View style={{ flexDirection: "row", marginBottom: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{campo.etiqueta}</Text>
                      {campo.requerido && <Text style={{ color: "#ef4444", marginLeft: 4 }}>*</Text>}
                    </View>

                    {campo.tipo === "texto" && (
                      <FormInput 
                        placeholder={campo.placeholder || "Escribe aquí..."} 
                        value={currentVal} 
                        onChangeText={(t) => updateRespuesta(campo.campo_id, t)} 
                        editable={!shouldLockForm}
                      />
                    )}

                    {campo.tipo === "textarea" && (
                      <FormTextArea 
                        placeholder={campo.placeholder || "Escribe aquí..."} 
                        value={currentVal} 
                        onChangeText={(t) => updateRespuesta(campo.campo_id, t)} 
                        minHeight={80} 
                        editable={!shouldLockForm}
                      />
                    )}

                    {campo.tipo === "numero" && (
                      <FormInput 
                        placeholder={campo.placeholder || "0"} 
                        value={currentVal} 
                        onChangeText={(t) => updateRespuesta(campo.campo_id, t)} 
                        keyboardType="numeric" 
                        editable={!shouldLockForm}
                      />
                    )}

                    {campo.tipo === "fecha" && (
                      <TouchableOpacity 
                        onPress={() => {
                          if (!shouldLockForm) setShowPicker(campo.campo_id);
                        }}
                        disabled={shouldLockForm}
                        style={[styles.pickerBtn, { backgroundColor: isDark ? "#ffffff10" : "#f1f5f9", flex: 0, width: "100%" }]}
                      >
                        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                        <Text style={{ color: currentVal ? colors.text : colors.textSecondary, marginLeft: 10 }}>
                          {currentVal || "Seleccionar fecha"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {campo.tipo === "checkbox" && (
                      <TouchableOpacity 
                        onPress={() => {
                          if (!shouldLockForm) {
                            updateRespuesta(campo.campo_id, currentVal === "true" ? "false" : "true");
                          }
                        }}
                        disabled={shouldLockForm}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 }}
                      >
                        <Ionicons 
                          name={currentVal === "true" ? "checkbox" : "square-outline"} 
                          size={24} 
                          color={currentVal === "true" ? colors.primary : colors.textSecondary} 
                        />
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Marcar casilla</Text>
                      </TouchableOpacity>
                    )}

                    {(campo.tipo === "radio" || campo.tipo === "select") && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {(campo as any).campo_opciones?.map((op: any) => {
                          const isSelected = currentVal === op.valor;
                          return (
                            <TouchableOpacity
                              key={op.opcion_id}
                              onPress={() => {
                                if (!shouldLockForm) updateRespuesta(campo.campo_id, op.valor);
                              }}
                              disabled={shouldLockForm}
                              style={{
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: isSelected ? colors.primary : (isDark ? "#ffffff10" : "#f1f5f9"),
                                borderWidth: 1,
                                borderColor: isSelected ? colors.primary : "transparent",
                                opacity: (shouldLockForm && !isSelected) ? 0.5 : 1
                              }}
                            >
                              <Text style={{ color: isSelected ? "#fff" : colors.textSecondary, fontWeight: isSelected ? "bold" : "500", fontSize: 13 }}>
                                {op.etiqueta}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* VISTA DE REVISIÓN PARA NO-TERAPEUTAS O COMO LECTURA */}
        {bid !== null && !isTerapeuta && (estadoBitacora === 'revisado' || estadoBitacora === 'devuelta' || notasRevision || revisadoPorName) && (
          <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", shadowOpacity: isDark ? 0.15 : 0.05 }]}>
            <Text style={[styles.revisionTitle, { color: colors.text }]}>Revisión del Terapeuta</Text>
            
            <View style={[
              styles.revisionBadge, 
              { 
                backgroundColor: estadoBitacora === 'revisado' 
                  ? (isDark ? "#3b82f620" : "#eff6ff") 
                  : estadoBitacora === 'devuelta'
                  ? (isDark ? "#ef444420" : "#fef2f2")
                  : (isDark ? "#e2e8f010" : "#f1f5f9"), 
                borderColor: estadoBitacora === 'revisado' 
                  ? (isDark ? "#3b82f650" : "#bfdbfe") 
                  : estadoBitacora === 'devuelta'
                  ? (isDark ? "#ef444450" : "#fee2e2")
                  : "transparent", 
                borderWidth: (estadoBitacora === 'revisado' || estadoBitacora === 'devuelta') ? 1 : 0 
              }
            ]}>
              <Text style={{ 
                color: estadoBitacora === 'revisado' 
                  ? (isDark ? "#93c5fd" : "#2563eb") 
                  : estadoBitacora === 'devuelta'
                  ? (isDark ? "#fca5a5" : "#ef4444")
                  : colors.textSecondary, 
                fontWeight: "700", 
                fontSize: 11 
              }}>
                {estadoBitacora === 'revisado' 
                  ? "REVISADO Y APROBADO" 
                  : estadoBitacora === 'devuelta' 
                  ? "DEVUELTA / OBSERVADA" 
                  : "PENDIENTE DE REVISIÓN"}
              </Text>
            </View>

            {revisadoPorName && (
              <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
                <Text style={{ fontWeight: "700" }}>Revisado por:</Text> {revisadoPorName}
              </Text>
            )}

            {fechaRevision && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                <Text style={{ fontWeight: "700" }}>Fecha de revisión:</Text> {fechaRevision}
              </Text>
            )}

            <FormLabel label="Notas de Evaluación / Observaciones" />
            <View style={{ 
              padding: 14, 
              borderRadius: 12, 
              backgroundColor: isDark ? "#ffffff05" : "#f8fafc", 
              borderWidth: 1, 
              borderColor: isDark ? "#ffffff10" : "#e2e8f0" 
            }}>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                {notasRevision || "Sin observaciones registradas."}
              </Text>
            </View>
          </View>
        )}

        {/* TARJETA DE REVISIÓN DEL TERAPEUTA */}
        {bid !== null && isTerapeuta && (
          <View style={[styles.card, { backgroundColor: isDark ? colors.backgroundSecondary : "#fff", shadowOpacity: isDark ? 0.15 : 0.05 }]}>
            <Text style={[styles.revisionTitle, { color: colors.text }]}>Evaluación / Revisión de Terapeuta</Text>
            
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 15, alignItems: "center" }}>
              <View style={[
                styles.revisionBadge, 
                { 
                  backgroundColor: estadoBitacora === 'revisado' 
                    ? (isDark ? "#3b82f620" : "#eff6ff") 
                    : estadoBitacora === 'devuelta'
                    ? (isDark ? "#ef444420" : "#fef2f2")
                    : (isDark ? "#e2e8f010" : "#f1f5f9"), 
                  borderColor: estadoBitacora === 'revisado' 
                    ? (isDark ? "#3b82f650" : "#bfdbfe") 
                    : estadoBitacora === 'devuelta'
                    ? (isDark ? "#ef444450" : "#fee2e2")
                    : "transparent",
                  borderWidth: (estadoBitacora === 'revisado' || estadoBitacora === 'devuelta') ? 1 : 0,
                  marginBottom: 0
                }
              ]}>
                <Text style={{ 
                  color: estadoBitacora === 'revisado' 
                    ? (isDark ? "#93c5fd" : "#2563eb") 
                    : estadoBitacora === 'devuelta'
                    ? (isDark ? "#fca5a5" : "#ef4444")
                    : colors.textSecondary, 
                  fontWeight: "700", 
                  fontSize: 11 
                }}>
                  {estadoBitacora === 'revisado' 
                    ? "REVISADO Y APROBADO" 
                    : estadoBitacora === 'devuelta' 
                    ? "DEVUELTA / OBSERVADA" 
                    : "PENDIENTE DE REVISIÓN"}
                </Text>
              </View>

              {revisadoPorName && (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Por: {revisadoPorName}
                </Text>
              )}
            </View>

            <FormLabel label="Notas de Evaluación / Observaciones" />
            <FormTextArea 
              placeholder="Escribe aquí las observaciones, notas de revisión o retroalimentación..." 
              value={notasRevision} 
              onChangeText={setNotasRevision} 
              minHeight={100} 
            />

            <View style={styles.revisionRow}>
              {/* Devolver a Borrador */}
              <TouchableOpacity 
                style={[
                  styles.revisionBtn, 
                  { 
                    backgroundColor: isDark ? "#ef444420" : "#fef2f2",
                    borderColor: isDark ? "#ef444450" : "#fee2e2",
                    borderWidth: 1
                  }
                ]} 
                onPress={() => handleRevisar('devuelta')}
                disabled={savingRevision}
              >
                {savingRevision ? (
                  <ActivityIndicator size="small" color={isDark ? "#fca5a5" : "#ef4444"} />
                ) : (
                  <>
                    <Ionicons name="arrow-undo-outline" size={18} color={isDark ? "#fca5a5" : "#ef4444"} />
                    <Text style={[styles.revisionBtnText, { color: isDark ? "#fca5a5" : "#ef4444" }]}>Devolver Bitácora</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Aprobar / Revisado */}
              <TouchableOpacity 
                style={[
                  styles.revisionBtn, 
                  { 
                    backgroundColor: colors.primary 
                  }
                ]} 
                onPress={() => handleRevisar('revisado')}
                disabled={savingRevision}
              >
                {savingRevision ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.revisionBtnText}>Aprobar / Revisado</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isTerapeuta && bid !== null ? null : estadoBitacora !== 'revisado' ? (
          <PrimaryButton title={bid ? "Guardar Cambios" : "Guardar Bitácora"} onPress={handleGuardar} loading={saving} />
        ) : (
          <View style={[styles.infoBanner, { backgroundColor: isDark ? "#1e3a8a30" : "#eff6ff", borderColor: isDark ? "#1e40af" : "#bfdbfe" }]}>
            <Ionicons name="checkmark-circle" size={20} color={isDark ? "#60a5fa" : "#2563eb"} />
            <Text style={[styles.infoBannerText, { color: isDark ? "#93c5fd" : "#1d4ed8" }]}>
              Esta bitácora ya ha sido revisada y aprobada. No se permiten más modificaciones en las respuestas.
            </Text>
          </View>
        )}
        <View style={{ height: 60 }} />

      </Animated.ScrollView>

      {/* Date/Time Pickers natively */}
      {showPicker && Platform.OS === "ios" && (
         <Modal transparent animationType="slide" visible={!!showPicker}>
           <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
             <View style={{ backgroundColor: "#fff", paddingBottom: 40, paddingTop: 20, borderRadius: 20 }}>
               
               <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                 <Text style={{ fontSize: 18, fontWeight: "700", textAlign: "center", color: "#333" }}>
                   {showPicker === "fecha" || typeof showPicker === "number" ? "Seleccionar Fecha" : "Seleccionar Hora"}
                 </Text>
               </View>

               <DateTimePicker
                 value={
                   typeof showPicker === "number" 
                     ? (respuestas[showPicker] ? new Date(respuestas[showPicker]) : new Date())
                     : (showPicker === "fecha" ? fecha : (showPicker === "entrada" ? (horaEntrada || new Date()) : (horaSalida || new Date())))
                 }
                 mode={showPicker === "fecha" || typeof showPicker === "number" ? "date" : "time"}
                 display="spinner"
                 onChange={onDateChange}
                 textColor="#000"
                 style={{ alignSelf: "center", width: "100%", height: 200 }}
               />
               
               <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
                 <PrimaryButton title="Confirmar" onPress={handleClosePicker} />
               </View>
             </View>
           </View>
         </Modal>
      )}
      
      {showPicker && Platform.OS === "android" && (
         <DateTimePicker
           value={
             typeof showPicker === "number" 
               ? (respuestas[showPicker] ? new Date(respuestas[showPicker]) : new Date())
               : (showPicker === "fecha" ? fecha : (showPicker === "entrada" ? (horaEntrada || new Date()) : (horaSalida || new Date())))
           }
           mode={showPicker === "fecha" || typeof showPicker === "number" ? "date" : "time"}
           display="default"
           onChange={onDateChange}
         />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  card: { 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20, 
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      },
      default: {
        elevation: 3, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 }, 
        shadowRadius: 10,
        shadowOpacity: 0.1
      }
    })
  },
  
  pickerBox: { width: "48%" },
  microLabel: { fontSize: 12, marginBottom: 4, fontWeight: "600" },
  pickerBtn: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  
  secTitleBox: { padding: 12, borderRadius: 12, marginBottom: 15 },
  secTitle: { fontSize: 16, fontWeight: "800" },
  dinamicField: { marginBottom: 20 },

  revisionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  revisionBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 15 },
  revisionRow: { flexDirection: "row", gap: 12, marginTop: 15 },
  revisionBtn: { flex: 1, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 },
  revisionBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  infoBanner: { padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  infoBannerText: { flex: 1, fontSize: 14, fontWeight: "500", lineHeight: 20 },
});
