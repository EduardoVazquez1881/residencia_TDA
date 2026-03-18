import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Text, View } from "react-native";

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
    <View className="mb-2 ml-1">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
          {label}
        </Text>
        {required && (
          <Text style={{ color: colors.error }} className="text-base font-bold">
            *
          </Text>
        )}
      </View>
      {error && (
        <Text
          className="text-xs font-medium mt-1"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          {helperText}
        </Text>
      )}
    </View>
  );
};
