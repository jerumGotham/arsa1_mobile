import { theme } from "@/constants/theme";
import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";

export type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  // "" = All, "none" = Uncategorized, otherwise a category id
  value: string;
  onChange: (value: string) => void;
  showAll?: boolean;
  showUncategorized?: boolean;
};

export const UNCATEGORIZED = "none";

export default function CategoryChips({
  categories,
  value,
  onChange,
  showAll = true,
  showUncategorized = false,
}: Props) {
  const options = [
    ...(showAll ? [{ id: "", name: "All" }] : []),
    ...categories,
    ...(showUncategorized ? [{ id: UNCATEGORIZED, name: "Uncategorized" }] : []),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const active = option.id === value;

        return (
          <TouchableOpacity
            key={option.id || "all"}
            activeOpacity={0.8}
            onPress={() => onChange(option.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {option.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function CategoryBadge({ name }: { name?: string | null }) {
  return (
    <Text style={[styles.badge, !name && styles.badgeMuted]}>
      {name || "Uncategorized"}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  textActive: {
    color: theme.colors.white,
  },
  badge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  badgeMuted: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textMuted,
  },
});
