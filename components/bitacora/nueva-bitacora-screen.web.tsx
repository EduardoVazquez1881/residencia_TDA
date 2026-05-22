import React from 'react';
import { WebDashboardLayout } from '@/components/ui/web/WebDashboardLayout';
import { NuevaBitacoraScreenContent as Content } from './nueva-bitacora-screen-content';

/**
 * Versión Web de NuevaBitacoraScreen.
 * Envuelve el componente original en el layout del dashboard para mantener el Sidebar.
 */
export function NuevaBitacoraScreen() {
  return (
    <WebDashboardLayout>
      <Content />
    </WebDashboardLayout>
  );
}
