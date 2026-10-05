import { theme } from "@/constants/theme";
import { useState } from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native";

type Props = TextInputProps & {
  label?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function AppInput({
  label,
  icon,
  right,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.field, focused && styles.focused]}>
        {icon}
        <TextInput
          placeholderTextColor={theme.colors.textSubtle}
          selectionColor={theme.colors.text}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  focused: {
    borderColor: theme.colors.text,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: theme.fontSize.md,
    fontWeight: "500",
    color: theme.colors.text,
  },
});
