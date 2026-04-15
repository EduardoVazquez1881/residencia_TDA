import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from "react-native";

interface FormTextAreaProps extends RNTextInputProps {
  minHeight?: number;
}

export const FormTextArea = React.forwardRef<RNTextInput, FormTextAreaProps>(
  ({ minHeight = 100, style, ...props }, ref) => {
    const colorScheme = useColorScheme() || "light";
    const colors = Colors[colorScheme as "light" | "dark"];

    return (
      <RNTextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.textSecondary}
        style={[
          {
            backgroundColor: colors.input,
            borderColor: colors.inputBorder,
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
            paddingTop: 14,
            fontSize: 15,
            color: colors.text,
            minHeight,
            fontWeight: "500",
          },
          style,
        ]}
        {...props}
      />
    );
  },
);

FormTextArea.displayName = "FormTextArea";
