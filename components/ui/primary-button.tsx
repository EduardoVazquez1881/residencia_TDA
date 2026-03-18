import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
} from "react-native";

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  size = "medium",
  icon,
  disabled,
  ...props
}) => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];

  const getButtonStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.secondary,
          shadowColor: colors.secondary,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: colors.primary,
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return "px-4 py-2";
      case "large":
        return "px-6 py-5";
      default:
        return "px-6 py-4";
    }
  };

  const getTextColor = () => {
    return variant === "outline" ? colors.primary : "#fff";
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={{
        ...buttonStyles,
        opacity: disabled || loading ? 0.6 : 1,
        ...(variant !== "outline" && {
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }),
      }}
      className={`w-full rounded-2xl flex-row justify-center items-center ${getSizeStyles()} ${
        variant !== "outline" ? "" : "bg-transparent"
      }`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={size === "small" ? "small" : "large"}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon}
          <Text
            className={`font-bold text-center ${getTextSize()}`}
            style={{ color: getTextColor() }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
