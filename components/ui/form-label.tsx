import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Text, View, StyleSheet } from "react-native";

interface FormLabelProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  helperText,
  error,
}) => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.labelText, { color: colors.text }]}>{label}</Text>
        {required && (
          <Text style={[styles.requiredText, { color: colors.error }]}>*</Text>
        )}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requiredText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
