import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WebSplitLayoutProps {
  children: React.ReactNode;
  iconName: string;
  title: string;
  subtitle: string;
}

export const WebSplitLayout = ({ children, iconName, title, subtitle }: WebSplitLayoutProps) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Panel Izquierdo: Branding (Solo en Desktop) */}
      {isDesktop && (
        <View style={[styles.leftPanel, { backgroundColor: colors.primary }]}>
          <View style={styles.brandingContainer}>
            <Ionicons name={iconName as any} size={80} color="#fff" />
            <Text style={styles.brandingTitle}>{title}</Text>
            <Text style={styles.brandingSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.brandingFooter}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              © {new Date().getFullYear()} Residencia TDA. Todos los derechos reservados.
            </Text>
          </View>
        </View>
      )}

      {/* Panel Derecho: Formulario */}
      <View style={[styles.rightPanel, { backgroundColor: isDark ? colors.backgroundSecondary : '#fff' }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            
            {/* Header en Móvil si no hay Panel Izquierdo */}
            {!isDesktop && (
               <View style={{ alignItems: "center", marginBottom: 30 }}>
                  <View style={{ backgroundColor: `${colors.primary}15`, padding: 16, borderRadius: 24, marginBottom: 16 }}>
                    <Ionicons name={iconName as any} size={40} color={colors.primary} />
                  </View>
               </View>
            )}

            {children}
            
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh' as any,
  },
  leftPanel: {
    flex: 1.2,
    justifyContent: 'space-between',
    padding: 60,
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brandingTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: -1,
  },
  brandingSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 30,
    maxWidth: '80%',
  },
  brandingFooter: {
    paddingTop: 40,
  },
  rightPanel: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 32,
  },
});
