import { theme } from "@/constants/theme";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
};

export default function EmptyState({ icon, title, message }: Props) {
  return (
    <View style={styles.box}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

export function Avatar({
  name,
  size = 44,
  inverse = false,
}: {
  name?: string;
  size?: number;
  inverse?: boolean;
}) {
  const initials =
    (name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        inverse && styles.avatarInverse,
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          { fontSize: size * 0.36 },
          inverse && styles.avatarTextInverse,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.white,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  message: {
    marginTop: 6,
    textAlign: "center",
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInverse: {
    backgroundColor: theme.colors.white,
  },
  avatarText: {
    color: theme.colors.white,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  avatarTextInverse: {
    color: theme.colors.text,
  },
});
