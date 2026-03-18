/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const primaryColorLight = "#0a7ea4";
const primaryColorDark = "#00d9ff";
const secondaryColorLight = "#1e40af";
const secondaryColorDark = "#60a5fa";

export const Colors = {
  light: {
    // Text
    text: "#11181C",
    textSecondary: "#6b7280",

    // Background
    background: "#fff",
    backgroundSecondary: "#f9fafb",

    // Primary & Secondary
    primary: primaryColorLight,
    secondary: secondaryColorLight,

    // UI elements
    tint: primaryColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: primaryColorLight,

    // Borders & Inputs
    border: "#e5e7eb",
    input: "#f3f4f6",
    inputBorder: "#d1d5db",

    // Status colors
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",

    // Shadows
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Text
    text: "#ECEDEE",
    textSecondary: "#9ca3af",

    // Background
    background: "#151718",
    backgroundSecondary: "#1f2937",

    // Primary & Secondary
    primary: primaryColorDark,
    secondary: secondaryColorDark,

    // UI elements
    tint: primaryColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryColorDark,

    // Borders & Inputs
    border: "#374151",
    input: "#1f2937",
    inputBorder: "#4b5563",

    // Status colors
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#60a5fa",

    // Shadows
    shadow: "rgba(0, 0, 0, 0.3)",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
