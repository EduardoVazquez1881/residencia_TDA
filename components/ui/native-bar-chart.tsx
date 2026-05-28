import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface NativeBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  barColor?: string;
  barWidth?: number;
  spacing?: number;
  yAxisLabels?: number; // Number of horizontal grid lines
}

export function NativeBarChart({
  data,
  height = 250,
  barColor,
  barWidth = 40,
  spacing = 24,
  yAxisLabels = 4,
}: NativeBarChartProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const isDark = colorScheme === 'dark';
  const primary = barColor || colors.primary;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={{ color: colors.textSecondary }}>No hay datos para mostrar</Text>
      </View>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
  
  // Calculate Y-axis steps
  const yAxisValues = Array.from({ length: yAxisLabels + 1 }).map((_, i) => 
    Math.round((maxValue / yAxisLabels) * (yAxisLabels - i))
  );

  return (
    <View style={[styles.container, { height }]}>
      {/* Y-Axis and Grid Lines */}
      <View style={styles.yAxisContainer}>
        {yAxisValues.map((val, i) => (
          <View key={`y-${i}`} style={styles.yAxisRow}>
            <Text style={[styles.yAxisText, { color: colors.textSecondary }]}>
              {val}
            </Text>
            <View style={[styles.gridLine, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
          </View>
        ))}
      </View>

      {/* Bars ScrollView */}
      <View style={styles.chartArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {data.map((item, index) => {
            const barHeightPercentage = (item.value / maxValue) * 100;
            return (
              <View key={`bar-${index}`} style={[styles.barWrapper, { marginRight: index === data.length - 1 ? 0 : spacing }]}>
                {/* Value tooltip above bar */}
                <Text style={[styles.valueText, { color: colors.text, opacity: item.value > 0 ? 1 : 0 }]}>
                  {item.value}
                </Text>
                
                {/* The Bar */}
                <View style={[styles.barContainer, { width: barWidth, backgroundColor: `${primary}20` }]}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        height: `${barHeightPercentage}%`, 
                        backgroundColor: primary,
                      }
                    ]} 
                  />
                </View>

                {/* X-Axis Label */}
                <Text style={[styles.xLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  container: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
  },
  yAxisContainer: {
    width: 40,
    justifyContent: 'space-between',
    paddingBottom: 24, // Space for x-axis labels
    marginRight: 8,
  },
  yAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisText: {
    fontSize: 10,
    width: 30,
    textAlign: 'right',
    marginRight: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 40,
    right: -2000, // Extend grid line far to the right so it underlays scrollview
    borderBottomWidth: 1,
  },
  chartArea: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 10,
    paddingRight: 20,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  valueText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  xLabel: {
    fontSize: 10,
    marginTop: 4,
    maxWidth: 50,
    textAlign: 'center',
    height: 16,
  },
});
