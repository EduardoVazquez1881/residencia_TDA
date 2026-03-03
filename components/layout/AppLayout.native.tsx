/**
 * Layout específico para MOBILE (iOS y Android)
 *
 * Este archivo se usa SOLO en iOS/Android (gracias a la extensión .native.tsx)
 *
 * CUÁNDO CREAR ARCHIVOS .native.tsx:
 * ✅ Navegación con tabs nativos
 * ✅ Gestos nativos (swipe, pull to refresh)
 * ✅ Headers nativos con botones de sistema
 * ✅ Componentes específicos de mobile
 *
 * En mobile, preferimos:
 * - Navegación por tabs (abajo)
 * - Headers nativos (arriba)
 * - Sin sidebar
 * - Contenido full-width
 */

import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
}

export default function AppLayout({
  children,
  scrollable = true,
}: AppLayoutProps) {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <Container
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        contentContainerClassName="px-4 py-4"
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
