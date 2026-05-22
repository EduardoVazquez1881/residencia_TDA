import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
    Pressable,
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    View,
    StyleSheet,
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
      <View style={styles.container}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
        )}
        <RNTextInput
          ref={ref}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              borderColor: colors.inputBorder,
              color: colors.text,
              paddingLeft: icon ? 48 : 16,
              paddingRight: showPasswordToggle ? 48 : 16,
            }
          ]}
          {...props}
        />
        {showPasswordToggle && secureTextEntry && (
          <Pressable
            onPress={() => setIsSecure(!isSecure)}
            style={styles.toggleBtn}
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

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  icon: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 1,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
    zIndex: 1,
  },
});
