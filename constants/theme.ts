/**
 * TindaHub design tokens — monochrome (black & white) theme.
 * `Colors` and `Fonts` are kept for the Expo template components.
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0A0A0A",
    background: "#FFFFFF",
    tint: "#0A0A0A",
    icon: "#737373",
    tabIconDefault: "#737373",
    tabIconSelected: "#0A0A0A",
  },
  dark: {
    text: "#FAFAFA",
    background: "#0A0A0A",
    tint: "#FFFFFF",
    icon: "#A3A3A3",
    tabIconDefault: "#A3A3A3",
    tabIconSelected: "#FFFFFF",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
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

export const colors = {
  primary: "#0A0A0A",
  primaryLight: "#262626",
  primaryDark: "#000000",

  background: "#F4F4F4",
  card: "#FFFFFF",
  surface: "#F7F7F7",
  inverse: "#0A0A0A",
  inverseMuted: "#A3A3A3",
  inverseBorder: "#262626",

  text: "#0A0A0A",
  textMuted: "#737373",
  textSubtle: "#A3A3A3",

  border: "#E8E8E8",
  borderStrong: "#D4D4D4",

  // Used sparingly — destructive actions only.
  danger: "#B42318",
  dangerSoft: "#FEF3F2",
  warning: "#525252",
  success: "#0A0A0A",

  overlay: "rgba(0, 0, 0, 0.55)",

  white: "#FFFFFF",
  black: "#000000",
  blue: "#0A0A0A",
};

export const theme = {
  colors,

  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 26,
    pill: 999,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },

  // Small uppercase label above titles / values.
  eyebrow: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
  },

  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },

  shadowStrong: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
};
