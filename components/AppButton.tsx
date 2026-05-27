import { theme } from "@/constants/theme";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: "primary" | "outline" | "danger";
};

export default function AppButton({
  title,
  onPress,
  loading = false,
  variant = "primary",
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        variant === "outline" && styles.outline,
        variant === "danger" && styles.danger,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <Text
          style={[styles.text, variant === "outline" && styles.outlineText]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  outline: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  text: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: "800",
  },
  outlineText: {
    color: theme.colors.primary,
  },
});
