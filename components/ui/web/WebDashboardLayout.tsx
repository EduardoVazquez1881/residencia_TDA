import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WebSidebar } from './WebSidebar';

interface WebDashboardLayoutProps {
  children: React.ReactNode;
}

export const WebDashboardLayout = ({ children }: WebDashboardLayoutProps) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const { width } = useWindowDimensions();
  // En web, siempre queremos el sidebar a menos que sea una pantalla muy pequeña
  const isDesktop = Platform.OS === 'web' || width >= 768;
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}>
      {isDesktop ? <WebSidebar /> : null}
      
      <View style={styles.contentArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Constrain width for very large screens so content doesn't stretch infinitely */}
          <View style={styles.maxWidthContainer}>
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
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center', // Centers the max-width container
    padding: 32,
  },
  maxWidthContainer: {
    width: '100%',
    maxWidth: 1200, // Standard max width for dashboard content
    flex: 1,
  },
});
