import { theme } from "@/constants/theme";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
};

export default function StatCard({ label, value, subtext, icon }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        {icon}
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
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
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
  },
  value: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: theme.colors.text,
  },
  subtext: {
    marginTop: 4,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
});
