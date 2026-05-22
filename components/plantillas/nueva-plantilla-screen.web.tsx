import React from 'react';
import { WebDashboardLayout } from '@/components/ui/web/WebDashboardLayout';
import { NuevaPlantillaScreenContent as Content } from './nueva-plantilla-screen-content';

/**
 * Versión Web de NuevaPlantillaScreen.
 * Envuelve el componente original en el layout del dashboard para mantener el Sidebar.
 */
export function NuevaPlantillaScreen() {
  return (
    <WebDashboardLayout>
      <Content />
    </WebDashboardLayout>
  );
}
