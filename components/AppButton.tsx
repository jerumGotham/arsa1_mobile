import { theme } from "@/constants/theme";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost" | "danger" | "inverse";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  icon,
  style,
}: Props) {
  const dark = variant === "primary";
  const spinnerColor =
    dark || variant === "danger" ? theme.colors.white : theme.colors.text;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        size === "sm" && styles.small,
        styles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text
            style={[
              styles.text,
              size === "sm" && styles.smallText,
              styles[`${variant}Text`],
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  small: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm + 2,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabled: {
    opacity: 0.45,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  outline: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.borderStrong,
  },
  ghost: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.surface,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  inverse: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 13,
  },
  primaryText: { color: theme.colors.white },
  outlineText: { color: theme.colors.text },
  ghostText: { color: theme.colors.text },
  dangerText: { color: theme.colors.white },
  inverseText: { color: theme.colors.text },
});
