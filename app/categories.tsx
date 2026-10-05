import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader, { IconButton } from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState from "@/components/EmptyState";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/categoryApi";
import { errorMessage } from "@/services/api";

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");

  async function load() {
    try {
      setCategories(await getCategories());
    } catch (error) {
      Alert.alert("Error", errorMessage(error, "Unable to load categories."));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  function openAdd() {
    setEditing(null);
    setName("");
    setSheetVisible(true);
  }

  function openEdit(category: any) {
    setEditing(category);
    setName(category.name);
    setSheetVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Required", "Category name is required.");
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await updateCategory(editing.id, name.trim());
      } else {
        await createCategory(name.trim());
      }

      Toast.show({
        type: "success",
        text1: editing ? "Category renamed" : "Category added",
        text2: name.trim(),
      });
      setSheetVisible(false);
      load();
    } catch (error) {
      Alert.alert("Error", errorMessage(error, "Unable to save category."));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(category: any) {
    const count = category._count?.products || 0;

    Alert.alert(
      "Delete Category",
      count
        ? `${count} product(s) in "${category.name}" will become Uncategorized.`
        : `Delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              Toast.show({ type: "success", text1: "Category deleted" });
              load();
            } catch (error) {
              Alert.alert("Error", errorMessage(error, "Unable to delete."));
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          back
          eyebrow="Products"
          title="Categories"
          subtitle="Group products by type — Plastic, Styro, Paper…"
          right={
            <IconButton onPress={openAdd}>
              <Plus size={22} color={theme.colors.white} />
            </IconButton>
          }
        />

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<Tags size={22} color={theme.colors.textMuted} />}
            title="No categories yet"
            message="Add your first product type with the + button."
          />
        ) : (
          <View style={styles.list}>
            {categories.map((category, index) => (
              <View
                key={category.id}
                style={[
                  styles.row,
                  index === categories.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.dot}>
                  <Text style={styles.dotText}>
                    {category.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{category.name}</Text>
                  <Text style={styles.meta}>
                    {category._count?.products || 0} product
                    {category._count?.products === 1 ? "" : "s"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.iconAction}
                  onPress={() => openEdit(category)}
                  hitSlop={6}
                >
                  <Pencil size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconAction}
                  onPress={() => handleDelete(category)}
                  hitSlop={6}
                >
                  <Trash2 size={16} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={editing ? "Rename Category" : "New Category"}
        footer={
          <AppButton
            title={editing ? "Save" : "Add Category"}
            onPress={handleSave}
            loading={saving}
            style={{ flex: 1 }}
          />
        }
      >
        <AppInput
          label="Name"
          placeholder="e.g. Styro"
          value={name}
          onChangeText={setName}
          autoFocus
          onSubmitEditing={handleSave}
        />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  list: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 16,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
