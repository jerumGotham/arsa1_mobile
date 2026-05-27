import { theme } from "@/constants/theme";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  label: string;
  value: string;
  subtext?: string;
};

export default function StatCard({ label, value, subtext }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  value: {
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
  },
  label: {
    marginTop: 4,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  subtext: {
    marginTop: 8,
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: "700",
  },
});
