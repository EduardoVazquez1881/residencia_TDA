# 📱 Guía de Arquitectura Multiplataforma

## Estrategias y Cuándo Usar Cada Una

### ✅ OPCIÓN 1: Archivos Separados (.web.tsx / .native.tsx)

**Usa esto cuando:**
- La UI es COMPLETAMENTE diferente entre plataformas
- Diferentes patrones de navegación (sidebar web vs tabs mobile)
- Funcionalidades exclusivas de una plataforma

**Ejemplo:**
```
Dashboard.web.tsx    → Layout con sidebar y navbar
Dashboard.native.tsx → Layout con tabs y header nativo
```

**Ventajas:**
✅ Código limpio y separado
✅ Fácil mantener lógicas diferentes
✅ No hay condicionales complejos
✅ Tree-shaking automático (solo se bundlea el necesario)

**Desventajas:**
❌ Duplicación de código si no se estructura bien
❌ Más archivos que mantener

---

### ✅ OPCIÓN 2: Mismo Archivo con Platform.select()

**Usa esto cuando:**
- 80%+ del código es compartido
- Solo cambian estilos o pequeños ajustes
- La estructura general es la misma

**Ejemplo:**
```tsx
const containerStyle = Platform.select({
  web: 'max-w-4xl mx-auto px-8',
  default: 'px-4'
});

const columns = Platform.select({
  web: 3,
  default: 1
});
```

**Ventajas:**
✅ Un solo archivo
✅ Lógica compartida
✅ Menos duplicación

**Desventajas:**
❌ Puede volverse complejo con muchas diferencias
❌ Archivo grande si hay muchos condicionales

---

### ✅ OPCIÓN 3: Responsive con Tailwind (Web) + Platform

**Usa esto cuando:**
- Quieres diseño responsive en web
- Mobile usa diseño nativo
- Principalmente ajustes de layout

**Ejemplo:**
```tsx
<View className={`
  flex-col px-4           // Mobile: columna, padding 4
  md:flex-row md:px-8     // Web tablet: fila, padding 8
  lg:px-16 lg:max-w-7xl   // Web desktop: padding 16, max width
  ${Platform.OS !== 'web' ? 'gap-4' : ''}
`}>
```

**Ventajas:**
✅ Mejor UX en web con breakpoints
✅ Mobile mantiene diseño nativo
✅ Flexible

**Desventajas:**
❌ Breakpoints solo funcionan en web
❌ Puede ser confuso mezclar ambos enfoques

---

## 🎯 MI RECOMENDACIÓN PARA TU PROYECTO

### Estructura Recomendada:

```
app/
  _layout.tsx              # Configuración global (compartido)
  index.tsx                # Pantalla principal (compartido con ajustes)
  
  (web)/                   # Rutas solo para web
    dashboard.tsx
    analytics.tsx
  
  (mobile)/                # Pantallas solo para mobile
    camera.tsx
    notifications.tsx

components/
  shared/                  # Componentes 100% compartidos
    Button.tsx
    Card.tsx
    Input.tsx
  
  layout/
    AppLayout.web.tsx      # Layout web con sidebar
    AppLayout.native.tsx   # Layout mobile simple
  
  features/
    UserProfile.tsx        # Compartido con Platform.select()
    DataTable.web.tsx      # Solo web (tabla compleja)
    DataList.native.tsx    # Solo mobile (lista simple)
```

---

## 📊 Regla del 80/20

**Apunta a:**
- 80% código compartido (lógica, estados, API calls)
- 20% específico de plataforma (UI, navegación)

**Cómo lograrlo:**

1. **Separa lógica de UI:**
```tsx
// hooks/useUserData.ts - Compartido
export function useUserData() {
  const [data, setData] = useState();
  // Toda la lógica aquí
  return { data, loading, error };
}

// UserProfile.web.tsx - Solo UI web
export default function UserProfile() {
  const { data } = useUserData(); // Lógica compartida
  return <WebLayout>{/* UI específica */}</WebLayout>;
}

// UserProfile.native.tsx - Solo UI mobile
export default function UserProfile() {
  const { data } = useUserData(); // Misma lógica
  return <MobileLayout>{/* UI específica */}</MobileLayout>;
}
```

2. **Usa componentes base compartidos:**
```tsx
// components/shared/Button.tsx
export function Button({ ...props }) {
  // Comportamiento compartido
  const baseClass = "px-4 py-2 rounded";
  
  const platformClass = Platform.select({
    web: "hover:opacity-80 cursor-pointer",
    default: "active:opacity-70"
  });
  
  return <Pressable className={`${baseClass} ${platformClass}`} {...props} />;
}
```

---

## 🚀 Decisión Rápida: ¿Qué Estrategia Usar?

| Situación | Solución |
|-----------|----------|
| Formulario con campos diferentes | Archivos separados (.web/.native) |
| Card con padding diferente | Platform.select() |
| Tabla de datos compleja | .web.tsx (tabla) + .native.tsx (lista) |
| Dashboard con sidebar | .web.tsx |
| Navegación principal | Tabs nativos en mobile, navbar en web → separados |
| Botón con hover en web | Platform.select() para hover |
| Galería responsive | Tailwind breakpoints en web + Platform.select() |

---

## 💡 Ejemplo Práctico: Dashboard

```tsx
// app/dashboard.tsx - Punto de entrada compartido
import DashboardLayout from '@/components/layout/DashboardLayout';
// Metro/Expo automáticamente carga .web o .native según plataforma

export default function Dashboard() {
  const { data, loading } = useDashboardData(); // Hook compartido
  
  return (
    <DashboardLayout> {/* Componente específico por plataforma */}
      <DashboardContent data={data} loading={loading} />
    </DashboardLayout>
  );
}
```

¿Es práctico? **SÍ**, especialmente con esta estructura híbrida donde:
- Compartes la lógica (hooks, services, utils)
- Separas solo las vistas que realmente necesitan ser diferentes
- Usas Platform.select() para ajustes menores
