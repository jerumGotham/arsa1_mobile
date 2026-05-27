import { theme } from "@/constants/theme";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

export default function AppInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
});
