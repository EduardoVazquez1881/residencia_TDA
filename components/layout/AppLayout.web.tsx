/**
 * Layout específico para WEB
 * 
 * Este archivo se usa SOLO en web (gracias a la extensión .web.tsx)
 * 
 * CUÁNDO CREAR ARCHIVOS .web.tsx:
 * ✅ UI completamente diferente (sidebar complejo, múltiples columnas)
 * ✅ Funcionalidades solo de web (drag & drop, file uploads)
 * ✅ SEO y meta tags
 * ✅ Navegación con menús desplegables complejos
 * 
 * En este ejemplo, mostramos un layout web completo con:
 * - Navbar horizontal
 * - Sidebar
 * - Área de contenido con max-width
 */

import { View, Text } from 'react-native';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header/Navbar - Solo en web */}
      <View className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex-row items-center justify-between shadow-sm">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {title || 'Mi App Web'}
        </Text>
        
        <View className="flex-row gap-4">
          <Text className="text-gray-600 dark:text-gray-300 hover:text-gray-900 cursor-pointer">
            Dashboard
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 hover:text-gray-900 cursor-pointer">
            Perfil
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 hover:text-gray-900 cursor-pointer">
            Configuración
          </Text>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Sidebar - Solo en web */}
        <View className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <View className="space-y-2">
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Navegación
            </Text>
            {/* Aquí irían tus links de navegación */}
          </View>
        </View>

        {/* Área de contenido principal */}
        <View className="flex-1 overflow-auto">
          <View className="max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}
