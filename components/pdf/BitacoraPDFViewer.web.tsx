import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import {
  getConfiguracionOrganizacion,
  guardarConfiguracionOrganizacion,
  ConfiguracionOrganizacion,
  CONFIG_ORG_DEFAULT,
} from "@/services/pdf.config.service";
import { getBitacoraPDFData, generarHTMLBitacora } from "@/services/pdf.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BitacoraPDFViewerProps {
  bitacoraId: number;
  visible: boolean;
  onClose: () => void;
}

type Step = "config" | "preview";

export function BitacoraPDFViewer({
  bitacoraId,
  visible,
  onClose,
}: BitacoraPDFViewerProps) {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [step, setStep] = useState<Step>("config");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfiguracionOrganizacion>({
    ...CONFIG_ORG_DEFAULT,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [incluirFirmas, setIncluirFirmas] = useState(true);

  // Cargar config al abrir
  useEffect(() => {
    if (!visible) return;
    setStep("config");
    setHtmlContent(null);
    (async () => {
      const session = await getCurrentSession();
      if (!session?.user?.id) return;
      setUserId(session.user.id);
      const saved = await getConfiguracionOrganizacion(session.user.id);
      setConfig(saved);
    })();
  }, [visible]);

  const handleGenerarVistaPrvia = async () => {
    setLoading(true);
    try {
      // Guardar config primero
      if (userId) await guardarConfiguracionOrganizacion(userId, config);

      const data = await getBitacoraPDFData(bitacoraId);
      if (!data) {
        alert("No se pudieron cargar los datos de la bitácora.");
        setLoading(false);
        return;
      }
      const html = generarHTMLBitacora(data, config, incluirFirmas);
      setHtmlContent(html);
      setStep("preview");
    } catch (e) {
      console.error("[BitacoraPDFViewer] Error generando HTML:", e);
      alert("Ocurrió un error al generar el documento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = () => {
    if (!htmlContent) return;
    // Abrir HTML en nueva ventana → el usuario puede usar Ctrl+P o el menú del navegador para guardar como PDF
    const win = (window as any).open("", "_blank");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      // Esperar a que cargue y lanzar diálogo de impresión
      setTimeout(() => {
        win.focus();
        win.print();
      }, 600);
    }
  };

  const updateConfig = (field: keyof ConfiguracionOrganizacion, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const cardBg = isDark ? colors.backgroundSecondary : "#fff";
  const border = isDark ? "#ffffff15" : "#e2e8f0";
  const inputBg = isDark ? "#ffffff08" : "#f8fafc";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: isDark ? "#1a1a2e" : "#f8fafc" },
          ]}
        >
          {/* Header del modal */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: border, backgroundColor: cardBg },
            ]}
          >
            <View style={styles.modalHeaderLeft}>
              <View
                style={[
                  styles.pdfIconCircle,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {step === "config" ? "Configurar Encabezado" : "Vista Previa del PDF"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Bitácora #{bitacoraId}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === "config" ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                INFORMACIÓN DE LA ORGANIZACIÓN
              </Text>
              <Text
                style={[styles.sectionHint, { color: colors.textSecondary }]}
              >
                Esta información aparecerá en el encabezado del PDF. Se
                guardará automáticamente para la próxima vez.
              </Text>

              {[
                {
                  key: "nombre_organizacion" as const,
                  label: "Nombre de la Organización *",
                  placeholder: "Ej. Centro de Apoyo TEA",
                  icon: "business-outline",
                },
                {
                  key: "logotipo_url" as const,
                  label: "URL del Logotipo (opcional)",
                  placeholder: "https://tu-dominio.com/logo.png",
                  icon: "image-outline",
                },
                {
                  key: "direccion" as const,
                  label: "Dirección (opcional)",
                  placeholder: "Calle, Colonia, Ciudad",
                  icon: "location-outline",
                },
                {
                  key: "telefono" as const,
                  label: "Teléfono (opcional)",
                  placeholder: "+52 33 0000 0000",
                  icon: "call-outline",
                },
                {
                  key: "correo_contacto" as const,
                  label: "Correo de Contacto (opcional)",
                  placeholder: "contacto@organización.com",
                  icon: "mail-outline",
                },
              ].map(({ key, label, placeholder, icon }) => (
                <View key={key} style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons
                      name={icon as any}
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.fieldLabel, { color: colors.text }]}
                    >
                      {label}
                    </Text>
                  </View>
                  <TextInput
                    value={config[key] ?? ""}
                    onChangeText={(v) => updateConfig(key, v)}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? "#4b5563" : "#94a3b8"}
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        borderColor: border,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              ))}

              {/* Opción para incluir firmas */}
              <View style={[styles.fieldGroup, { marginTop: 10, paddingBottom: 20 }]}>
                <View style={[styles.fieldLabelRow, { justifyContent: "space-between", alignItems: "center" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                    <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 0 }]}>Incluir espacios de firmas en el PDF</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIncluirFirmas(!incluirFirmas)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: incluirFirmas ? colors.primary : isDark ? "#4b5563" : "#cbd5e1",
                      justifyContent: "center",
                      paddingHorizontal: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#fff",
                        transform: [{ translateX: incluirFirmas ? 20 : 0 }],
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, marginLeft: 20 }}>
                  Si desmarcas esto, el PDF no generará los bloques inferiores para que el tutor y terapeuta firmen el documento impreso.
                </Text>
              </View>

            </ScrollView>
          ) : (
            <View style={{ flex: 1, padding: 24 }}>
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={40}
                  color="#10b981"
                  style={{ marginBottom: 10 }}
                />
                <Text style={[styles.previewTitle, { color: colors.text }]}>
                  Documento listo
                </Text>
                <Text
                  style={[
                    styles.previewDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  Se abrirá el cuadro de diálogo de impresión; selecciona{" "}
                  <Text style={{ fontWeight: "700" }}>'Guardar como PDF'</Text> para descargarlo en tu dispositivo.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleDescargar}
                style={[
                  styles.downloadBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadBtnText}>
                  Abrir y Descargar PDF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep("config")}
                style={[styles.backBtn, { borderColor: border }]}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.backBtnText, { color: colors.textSecondary }]}
                >
                  Editar configuración
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer con acciones */}
          {step === "config" && (
            <View
              style={[
                styles.footer,
                { borderTopColor: border, backgroundColor: cardBg },
              ]}
            >
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: border }]}
              >
                <Text
                  style={[styles.cancelBtnText, { color: colors.textSecondary }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGenerarVistaPrvia}
                disabled={loading || !config.nombre_organizacion.trim()}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor:
                      config.nombre_organizacion.trim()
                        ? colors.primary
                        : colors.primary + "60",
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="eye-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Vista Previa</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "90%",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pdfIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSubtitle: { fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 6 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionHint: { fontSize: 12, lineHeight: 18, marginBottom: 20 },
  fieldGroup: { marginBottom: 14 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  previewBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    marginBottom: 16,
  },
  previewTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  previewDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 340,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  downloadBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 13, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  primaryBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
