import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
    Pressable,
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    View,
} from "react-native";

interface FormInputProps extends RNTextInputProps {
  icon?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
}

export const FormInput = React.forwardRef<RNTextInput, FormInputProps>(
  (
    { icon, showPasswordToggle = false, secureTextEntry = false, ...props },
    ref,
  ) => {
    const colorScheme = useColorScheme() || "light";
    const colors = Colors[colorScheme as "light" | "dark"];
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    return (
      <View className="relative">
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={colors.primary}
            style={{ position: "absolute", left: 16, top: 14, zIndex: 1 }}
          />
        )}
        <RNTextInput
          ref={ref}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.textSecondary}
          style={{
            backgroundColor: colors.input,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          className={`w-full border rounded-2xl p-4 text-base font-medium ${icon ? "pl-12" : ""} ${
            showPasswordToggle ? "pr-12" : ""
          }`}
          {...props}
        />
        {showPasswordToggle && secureTextEntry && (
          <Pressable
            onPress={() => setIsSecure(!isSecure)}
            className="absolute right-4 top-4"
          >
            <Ionicons
              name={isSecure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        )}
      </View>
    );
  },
);

FormInput.displayName = "FormInput";
