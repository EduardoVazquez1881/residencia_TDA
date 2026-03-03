# 📊 Guía de Librerías para Gráficos y Visualizaciones

## 🎯 Estrategia Recomendada: Enfoque Híbrido

Para maximizar la experiencia en cada plataforma:

### Para Web (más potente):
- **Recharts** - Gráficos interactivos basados en D3
- **Framer Motion** - Animaciones suaves
- **React Flow** - Diagramas de flujo
- **Lucide Icons** - Iconos modernos

### Para Mobile (nativo):
- **Victory Native XL** - Gráficos con Skia
- **React Native Reanimated** - Animaciones
- **Lucide React Native** - Iconos

---

## 📦 Instalación

```bash
# Multiplataforma (funcionan en todos lados)
npx expo install victory-native @shopify/react-native-skia
npx expo install react-native-reanimated
npx expo install lucide-react-native

# Solo Web (usarlas en archivos .web.tsx)
npm install recharts framer-motion
npm install @radix-ui/react-tabs @radix-ui/react-dialog
```

---

## 🔥 Librerías por Categoría

### **Gráficos y Charts**

| Librería | Plataformas | Uso |
|----------|-------------|-----|
| **Victory Native XL** | iOS, Android, Web | Gráficos de línea, barra, torta |
| **Recharts** | Solo Web | Gráficos avanzados, composables |
| **React Native Chart Kit** | iOS, Android | Gráficos simples nativos |
| **React Native SVG Charts** | iOS, Android, Web | Gráficos SVG |

### **Animaciones**

| Librería | Plataformas | Uso |
|----------|-------------|-----|
| **React Native Reanimated** | iOS, Android, Web | Animaciones nativas de alto rendimiento |
| **Framer Motion** | Solo Web | Animaciones declarativas para web |
| **React Native Animatable** | iOS, Android | Animaciones predefinidas |

### **Iconos**

| Librería | Plataformas | Uso |
|----------|-------------|-----|
| **Lucide React Native** | iOS, Android, Web | Iconos modernos y limpios |
| **Expo Vector Icons** | iOS, Android, Web | Conjunto amplio de iconos |
| **React Icons** | Solo Web | Miles de iconos para web |

### **Componentes UI Avanzados (Web)**

| Librería | Plataformas | Uso |
|----------|-------------|-----|
| **Radix UI** | Solo Web | Componentes accesibles headless |
| **Shadcn UI** | Solo Web | Componentes con Tailwind |
| **React Flow** | Solo Web | Diagramas de flujo interactivos |
| **React Table** | Solo Web | Tablas avanzadas |

### **3D y Gráficos Avanzados**

| Librería | Plataformas | Uso |
|----------|-------------|-----|
| **Three.js + React Three Fiber** | Web (+ Expo GL) | Gráficos 3D |
| **React Native Skia** | iOS, Android, Web | Gráficos 2D de alto rendimiento |
| **Expo GL** | iOS, Android | OpenGL en native |

### **Mapas**

| Librería | Plataformas | Uso |
|----------|-------------|-----|
| **React Native Maps** | iOS, Android | Mapas nativos |
| **Mapbox** | iOS, Android, Web | Mapas personalizables |
| **Google Maps React** | Solo Web | Mapas en web |

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Gráfico Multiplataforma con Victory Native

```bash
npx expo install victory-native @shopify/react-native-skia
```

```tsx
// components/charts/LineChart.tsx
import { CartesianChart, Line } from "victory-native";
import { View, Text } from "react-native";

interface DataPoint {
  x: number;
  y: number;
}

export default function LineChart({ data }: { data: DataPoint[] }) {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        Ventas Mensuales
      </Text>
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={["y"]}
        domainPadding={{ left: 50, right: 50, top: 30 }}
      >
        {({ points }) => (
          <Line 
            points={points.y} 
            color="#3b82f6" 
            strokeWidth={3} 
          />
        )}
      </CartesianChart>
    </View>
  );
}
```

---

### Ejemplo 2: Gráfico Avanzado Solo Web con Recharts

```bash
npm install recharts
```

```tsx
// components/charts/AdvancedChart.web.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { View, Text } from 'react-native';

interface ChartData {
  name: string;
  ventas: number;
  gastos: number;
}

export default function AdvancedChart({ data }: { data: ChartData[] }) {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <Text className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Análisis Financiero
      </Text>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: 'none',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="ventas" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="gastos" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </View>
  );
}
```

```tsx
// components/charts/AdvancedChart.native.tsx
import { CartesianChart, Line } from "victory-native";
import { View, Text } from "react-native";

// Versión simplificada para mobile
export default function AdvancedChart({ data }: { data: any[] }) {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <Text className="text-xl font-bold mb-4">
        Análisis Financiero
      </Text>
      {/* Versión simplificada con Victory Native */}
    </View>
  );
}
```

---

### Ejemplo 3: Iconos con Lucide

```bash
npx expo install lucide-react-native
```

```tsx
// components/DashboardCard.tsx
import { View, Text } from 'react-native';
import { TrendingUp, DollarSign, Users, ShoppingCart } from 'lucide-react-native';

export default function DashboardCard() {
  return (
    <View className="flex-row gap-4">
      {/* Card 1 */}
      <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <TrendingUp size={24} color="#3b82f6" />
        <Text className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          $12,450
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Ventas Hoy
        </Text>
      </View>

      {/* Card 2 */}
      <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
        <Users size={24} color="#10b981" />
        <Text className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          1,234
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Usuarios Activos
        </Text>
      </View>
    </View>
  );
}
```

---

### Ejemplo 4: Animaciones con Reanimated

```bash
npx expo install react-native-reanimated
```

```tsx
// components/AnimatedCard.tsx
import { View, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

export default function AnimatedCard() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  return (
    <Pressable
      onPressIn={() => scale.value = withSpring(0.95)}
      onPressOut={() => scale.value = withSpring(1)}
    >
      <Animated.View 
        style={animatedStyle}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6"
      >
        <Text className="text-white text-xl font-bold">
          Presióname! 🎉
        </Text>
      </Animated.View>
    </Pressable>
  );
}
```

---

### Ejemplo 5: Dashboard Completo Web con Radix UI

```bash
# Solo para web
npm install @radix-ui/react-tabs @radix-ui/react-dialog
```

```tsx
// app/dashboard.web.tsx
import { View, Text } from 'react-native';
import * as Tabs from '@radix-ui/react-tabs';
import AdvancedChart from '@/components/charts/AdvancedChart';
import { TrendingUp, Users, DollarSign } from 'lucide-react-native';

export default function DashboardWeb() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-8">
      {/* Stats Cards */}
      <View className="grid grid-cols-3 gap-6 mb-8">
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-600 dark:text-gray-400">
              Ingresos Totales
            </Text>
            <DollarSign size={24} color="#3b82f6" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            $45,231.89
          </Text>
          <Text className="text-sm text-green-600 mt-2">
            +20.1% del mes pasado
          </Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-600 dark:text-gray-400">
              Usuarios
            </Text>
            <Users size={24} color="#10b981" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            +2,350
          </Text>
          <Text className="text-sm text-green-600 mt-2">
            +180.1% del mes pasado
          </Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-600 dark:text-gray-400">
              Crecimiento
            </Text>
            <TrendingUp size={24} color="#f59e0b" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            +12.5%
          </Text>
          <Text className="text-sm text-green-600 mt-2">
            +4.5% del mes pasado
          </Text>
        </View>
      </View>

      {/* Gráfico Principal */}
      <AdvancedChart data={mockData} />
    </View>
  );
}

const mockData = [
  { name: 'Ene', ventas: 4000, gastos: 2400 },
  { name: 'Feb', ventas: 3000, gastos: 1398 },
  { name: 'Mar', ventas: 2000, gastos: 9800 },
  { name: 'Abr', ventas: 2780, gastos: 3908 },
  { name: 'May', ventas: 1890, gastos: 4800 },
  { name: 'Jun', ventas: 2390, gastos: 3800 },
];
```

---

## 🎨 Componentes UI Adicionales para Web

### Shadcn UI (Componentes con Tailwind)
Aunque está diseñado para Next.js, puedes usar sus estilos:

```bash
# Instalar dependencias base
npm install @radix-ui/react-dropdown-menu class-variance-authority clsx tailwind-merge
```

### Framer Motion (Animaciones Web)
```bash
npm install framer-motion
```

```tsx
// components/AnimatedSection.web.tsx
import { motion } from 'framer-motion';
import { View, Text } from 'react-native';

export default function AnimatedSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6"
    >
      <Text className="text-2xl font-bold">
        Contenido animado en Web
      </Text>
    </motion.div>
  );
}
```

---

## 🚀 Recomendación Final

### Para tu proyecto de sistema multiplataforma:

1. **Base compartida:**
   - Victory Native XL para gráficos básicos
   - Lucide React Native para iconos
   - React Native Reanimated para animaciones

2. **Web extendido (archivos .web.tsx):**
   - Recharts para gráficos avanzados
   - Framer Motion para animaciones suaves
   - Radix UI para componentes complejos
   - Tablas con react-table

3. **Mobile optimizado:**
   - Victory Native para gráficos
   - Listas virtualizadas con FlashList
   - Gestos con react-native-gesture-handler

### Estructura:
```
components/
  charts/
    LineChart.tsx          # Victory Native (compartido)
    AdvancedChart.web.tsx  # Recharts (solo web)
    AdvancedChart.native.tsx # Victory simplificado
  
  dashboard/
    StatsCard.tsx          # Compartido
    DataTable.web.tsx      # React Table (solo web)
    DataList.native.tsx    # FlatList (solo mobile)
```

¿Quieres que te muestre un ejemplo específico de alguna de estas librerías implementada en tu proyecto?
