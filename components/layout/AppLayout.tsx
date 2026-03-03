/**
 * Layout principal compartido
 * 
 * Este componente usa un enfoque híbrido:
 * - Estructura compartida entre plataformas
 * - Ajustes específicos con Platform.select()
 * - Responsive en web con Tailwind breakpoints
 * 
 * ESTRATEGIA RECOMENDADA:
 * - 80% código compartido (lógica, estados, datos)
 * - 20% ajustes de UI específicos por plataforma
 */

import { View, ScrollView, Platform } from 'react-native';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean; // Sidebar solo en web
}

export default function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  // Clase base compartida
  const containerClass = "flex-1 bg-white dark:bg-gray-900";
  
  // Ajustes específicos por plataforma
  const contentClass = Platform.select({
    // En web: layout con sidebar opcional y responsive
    web: showSidebar 
      ? "flex-1 md:flex-row" // Sidebar a la izquierda en pantallas medianas+
      : "flex-1",
    // En mobile: siempre full width
    default: "flex-1"
  });

  return (
    <View className={containerClass}>
      {/* Sidebar solo en web y pantallas grandes */}
      {Platform.OS === 'web' && showSidebar && (
        <View className="hidden md:flex w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200">
          {/* Contenido del sidebar */}
          <View className="p-4">
            {/* Aquí irían tus menús de navegación para web */}
          </View>
        </View>
      )}

      {/* Contenido principal - compartido entre plataformas */}
      <ScrollView 
        className={contentClass}
        contentContainerClassName={Platform.select({
          web: "max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8",
          default: "px-4"
        })}
      >
        {children}
      </ScrollView>
    </View>
  );
}
