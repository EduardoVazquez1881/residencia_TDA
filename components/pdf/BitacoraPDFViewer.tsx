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
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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

export function BitacoraPDFViewer({
  bitacoraId,
  visible,
  onClose,
}: BitacoraPDFViewerProps) {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfiguracionOrganizacion>({
    ...CONFIG_ORG_DEFAULT,
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const session = await getCurrentSession();
      if (!session?.user?.id) return;
      setUserId(session.user.id);
      const saved = await getConfiguracionOrganizacion(session.user.id);
      setConfig(saved);
    })();
  }, [visible]);

  const handleGenerarPDF = async () => {
    if (!config.nombre_organizacion.trim()) {
      Alert.alert(
        "Nombre requerido",
        "Por favor ingresa el nombre de la organización para continuar."
      );
      return;
    }

    setLoading(true);
    try {
      // Guardar config para la próxima vez
      if (userId) await guardarConfiguracionOrganizacion(userId, config);

      // Obtener datos de la bitácora
      const data = await getBitacoraPDFData(bitacoraId);
      if (!data) {
        Alert.alert("Error", "No se pudieron cargar los datos de la bitácora.");
        setLoading(false);
        return;
      }

      // Generar HTML
      const html = generarHTMLBitacora(data, config);

      // Usar expo-print para generar el PDF
      const { printToFileAsync } = await import("expo-print");
      const { shareAsync } = await import("expo-sharing");

      const { uri } = await printToFileAsync({ html, base64: false });

      // Abrir diálogo de compartir (guardar / enviar)
      await shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });

      onClose();
    } catch (e: any) {
      console.error("[BitacoraPDFViewer Mobile] Error generando PDF:", e);
      Alert.alert(
        "Error",
        "Ocurrió un error al generar el PDF. Por favor intenta de nuevo.\n" +
          (e?.message || "")
      );
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (
    field: keyof ConfiguracionOrganizacion,
    value: string
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const cardBg = isDark ? colors.backgroundSecondary : "#fff";
  const border = isDark ? "#ffffff15" : "#e2e8f0";
  const inputBg = isDark ? "#ffffff08" : "#f8fafc";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: isDark ? "#1a1a2e" : "#f8fafc" },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border, backgroundColor: cardBg }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Generar PDF
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Bitácora #{bitacoraId}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              ENCABEZADO DEL DOCUMENTO
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Esta información aparecerá en el encabezado del PDF generado. Se guarda automáticamente.
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
                placeholder: "https://...",
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
                placeholder: "contacto@org.com",
                icon: "mail-outline",
              },
            ].map(({ key, label, placeholder, icon }) => (
              <View key={key} style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name={icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
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
          </ScrollView>

          {/* Botón de acción */}
          <View style={[styles.footer, { borderTopColor: border, backgroundColor: cardBg }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleGenerarPDF}
              disabled={loading}
              style={[
                styles.generateBtn,
                {
                  backgroundColor: loading
                    ? colors.primary + "80"
                    : colors.primary,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.generateBtnText}>Generar PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  hint: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  fieldGroup: { marginBottom: 14 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  generateBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  generateBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
