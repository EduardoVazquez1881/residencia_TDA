import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    StyleSheet,
    Platform,
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
  style,
  ...props
}) => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme as "light" | "dark"];

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.secondary,
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
        };
    }
  };

  const getSizePadding = () => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 16, paddingVertical: 8 };
      case "large":
        return { paddingHorizontal: 24, paddingVertical: 20 };
      default:
        return { paddingHorizontal: 24, paddingVertical: 16 };
    }
  };

  const getTextColor = () => {
    return variant === "outline" ? colors.primary : "#fff";
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const shadowStyles = variant !== "outline" ? Platform.select({
    web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    },
    default: {
        shadowColor: variant === "secondary" ? colors.secondary : colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    }
  }) : {};

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        getVariantStyles(),
        getSizePadding(),
        shadowStyles,
        { opacity: disabled || loading ? 0.6 : 1 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize(), marginLeft: icon ? 8 : 0 }
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
