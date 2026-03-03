/**
 * Configuración de Supabase para React Native y Web
 * 
 * - En Web: usa localStorage nativo del navegador (automático)
 * - En Native (iOS/Android): usa AsyncStorage como fallback
 * 
 * Nota: NO usamos expo-sqlite/localStorage porque causa conflictos en web.
 * Para persistencia nativa, puedes usar @react-native-async-storage/async-storage
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Credenciales de Supabase
const supabaseUrl = "https://jkhyzfjwofgdhsrogwqe.supabase.co";
const supabasePublishableKey = "sb_publishable_pmRt-xUlGMkRXErNgiuFcA_UJdYqGAh";

/**
 * Cliente de Supabase configurado para múltiples plataformas
 * 
 * En Web: Supabase usa automáticamente window.localStorage
 * En Native: Usa el storage por defecto de Supabase (en memoria)
 * 
 * Para persistencia nativa completa, instala:
 * npx expo install @react-native-async-storage/async-storage
 * y configura un adapter personalizado
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // En web, Supabase detecta y usa window.localStorage automáticamente
    // En native, usamos el storage por defecto (en memoria, pero funcional)
    ...(Platform.OS === 'web' ? {} : { storage: undefined }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
