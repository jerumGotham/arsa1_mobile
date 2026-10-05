import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import {
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader, { IconButton } from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState from "@/components/EmptyState";
import CategoryChips, { CategoryBadge } from "@/components/CategoryChips";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/productApi";
import { getCategories } from "@/services/categoryApi";
import { errorMessage } from "@/services/api";
import { peso } from "@/lib/format";

const LOW_STOCK = 10;

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    categoryId: "",
    description: "",
    remainingQuantity: "",
  });

  async function loadProducts(
    value = search,
    showLoader = true,
    category = categoryFilter,
  ) {
    try {
      if (showLoader) setLoading(true);

      setVisibleCount(8);

      const data = await getProducts(value, category);
      setProducts(data);
    } catch (error) {
      console.log("Products error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadCategories() {
    try {
      setCategories(await getCategories());
    } catch (error) {
      console.log("Categories error:", error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadProducts(search, false), loadCategories()]);
  }

  function handleFilterChange(value: string) {
    setCategoryFilter(value);
    loadProducts(search, true, value);
  }

  function openAddModal() {
    setSelectedProduct(null);
    setForm({
      name: "",
      sku: "",
      price: "",
      // pre-select the category being browsed
      categoryId: categoryFilter && categoryFilter !== "none" ? categoryFilter : "",
      description: "",
      remainingQuantity: "0",
    });
    setModalVisible(true);
  }

  function openEditModal(product: any) {
    setSelectedProduct(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      price: String(product.price || ""),
      categoryId: product.categoryId || "",
      description: product.description || "",
      remainingQuantity: String(product.inventory?.remainingQuantity ?? 0),
    });
    setModalVisible(true);
  }

  async function handleSaveProduct() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Product name is required.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      Alert.alert("Required", "Valid price is required.");
      return;
    }

    if (form.remainingQuantity && Number(form.remainingQuantity) < 0) {
      Alert.alert("Invalid", "Available quantity cannot be negative.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      price: Number(form.price),
      categoryId: form.categoryId || null,
      description: form.description.trim(),
      remainingQuantity: Number(form.remainingQuantity || 0),
    };

    try {
      setSaving(true);

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload);
        Toast.show({
          type: "success",
          text1: "Product Updated",
          text2: payload.name,
        });
      } else {
        await createProduct(payload);
        Toast.show({
          type: "success",
          text1: "Product Added",
          text2: payload.name,
        });
      }

      setModalVisible(false);
      loadProducts(search);
      loadCategories();
    } catch (error: any) {
      Alert.alert("Error", errorMessage(error, "Unable to save product."));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(product: any) {
    Alert.alert("Delete Product", `Delete ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            Toast.show({
              type: "success",
              text1: "Product Deleted",
              text2: product.name,
            });
            loadProducts(search);
          } catch (error: any) {
            Alert.alert(
              "Cannot Delete",
              errorMessage(error, "Unable to delete product."),
            );
          }
        },
      },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadProducts(search, true);
    }, []),
  );

  const visibleProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScreenHeader
          eyebrow={`${products.length} item${products.length === 1 ? "" : "s"}`}
          title="Products"
          right={
            <View style={{ flexDirection: "row", gap: 8 }}>
              <IconButton dark={false} onPress={() => router.push("/categories")}>
                <Tags size={20} color={theme.colors.text} />
              </IconButton>
              <IconButton onPress={openAddModal}>
                <Plus size={22} color={theme.colors.white} />
              </IconButton>
            </View>
          }
        />

        <AppInput
          placeholder="Search product, SKU, or category"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadProducts(text);
          }}
          icon={<Search size={18} color={theme.colors.textMuted} />}
        />

        <CategoryChips
          categories={categories}
          value={categoryFilter}
          onChange={handleFilterChange}
          showUncategorized
        />

        {loading && <ActivityIndicator color={theme.colors.primary} />}

        {!loading && products.length === 0 && (
          <EmptyState
            icon={<Package size={22} color={theme.colors.textMuted} />}
            title="No products found"
            message="Try a different search or category."
          />
        )}

        {!loading &&
          visibleProducts.map((item) => {
            const stock = item.inventory?.remainingQuantity ?? 0;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <CategoryBadge name={item.category?.name} />
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.sku}>SKU · {item.sku || "—"}</Text>
                  </View>

                  <Text style={styles.price}>{peso(item.price, 2)}</Text>
                </View>

                <View style={styles.stockRow}>
                  <View>
                    <Text style={styles.stockLabel}>In Stock</Text>
                    <Text style={styles.stockValue}>{stock}</Text>
                  </View>

                  {stock <= LOW_STOCK ? (
                    <Text style={[styles.stockTag, stock <= 0 && styles.stockOut]}>
                      {stock <= 0 ? "Out of stock" : "Low stock"}
                    </Text>
                  ) : null}
                </View>

                {item.description ? (
                  <Text style={styles.description}>{item.description}</Text>
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Pencil size={14} color={theme.colors.text} />
                    <Text style={styles.actionText}>Edit / Restock</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { flex: 0, paddingHorizontal: 14 }]}
                    onPress={() => handleDelete(item)}
                  >
                    <Trash2 size={14} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {!loading && hasMoreProducts && (
          <AppButton
            title={`Load more (${products.length - visibleCount} left)`}
            variant="ghost"
            onPress={() => setVisibleCount((prev) => prev + 8)}
          />
        )}
      </ScrollView>

      <Sheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedProduct ? "Edit Product" : "New Product"}
        subtitle="Details, category, and available stock"
        footer={
          <>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => setModalVisible(false)}
              style={{ flex: 1 }}
            />
            <AppButton
              title={selectedProduct ? "Update" : "Save Product"}
              onPress={handleSaveProduct}
              loading={saving}
              style={{ flex: 1 }}
            />
          </>
        }
      >
        <AppInput
          label="Product Name"
          placeholder="e.g. 8X11 OK"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />

        <View>
          <Text style={styles.fieldLabel}>Category Type</Text>
          {categories.length ? (
            <CategoryChips
              categories={categories}
              value={form.categoryId}
              onChange={(value) =>
                setForm({
                  ...form,
                  // tap the selected chip again to clear it
                  categoryId: value === form.categoryId ? "" : value,
                })
              }
              showAll={false}
            />
          ) : (
            <Text style={styles.hint}>
              No categories yet. Add them from the tag icon on Products.
            </Text>
          )}
        </View>

        <View style={styles.twoCol}>
          <AppInput
            label="Price"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={form.price}
            containerStyle={{ flex: 1 }}
            icon={<Text style={styles.peso}>₱</Text>}
            onChangeText={(text) =>
              setForm({
                ...form,
                price: text.replace(/[^0-9.]/g, ""),
              })
            }
          />

          <AppInput
            label="SKU"
            placeholder="Optional"
            autoCapitalize="characters"
            value={form.sku}
            containerStyle={{ flex: 1 }}
            onChangeText={(text) => setForm({ ...form, sku: text })}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Available Quantity</Text>
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => {
                const current = Number(form.remainingQuantity || 0);

                if (current > 0) {
                  setForm({
                    ...form,
                    remainingQuantity: String(current - 1),
                  });
                }
              }}
            >
              <Minus size={20} color={theme.colors.white} />
            </TouchableOpacity>

            <TextInput
              style={styles.qtyInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.colors.textSubtle}
              selectionColor={theme.colors.text}
              value={form.remainingQuantity}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  remainingQuantity: text.replace(/[^0-9]/g, ""),
                })
              }
            />

            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => {
                const current = Number(form.remainingQuantity || 0);

                setForm({
                  ...form,
                  remainingQuantity: String(current + 1),
                });
              }}
            >
              <Plus size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <AppInput
          label="Description"
          placeholder="Optional"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
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
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  sku: {
    color: theme.colors.textMuted,
    fontWeight: "500",
    fontSize: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: theme.colors.text,
  },
  stockRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  stockLabel: {
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  stockValue: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  stockTag: {
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.text,
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.text,
  },
  stockOut: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
  },
  description: {
    marginTop: 10,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: theme.radius.sm + 2,
    backgroundColor: theme.colors.surface,
  },
  actionText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  fieldLabel: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  hint: {
    color: theme.colors.textMuted,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
  },
  peso: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyButton: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  qtyInput: {
    flex: 1,
    height: 52,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
});
