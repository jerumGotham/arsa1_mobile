import { theme } from "@/constants/theme";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: boolean;
};

export default function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  right,
  back,
}: Props) {
  return (
    <View>
      {back ? (
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ChevronLeft size={20} color={theme.colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function IconButton({
  onPress,
  children,
  dark = true,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.iconButton, !dark && styles.iconButtonLight]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 14,
    marginLeft: -4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  eyebrow: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonLight: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
