import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/productApi";

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    category: "",
    description: "",
    remainingQuantity: "",
  });

  async function loadProducts(value = search, showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      const data = await getProducts(value);
      setProducts(data);
    } catch (error) {
      console.log("Products error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadProducts(search, false);
  }

  function openAddModal() {
    setSelectedProduct(null);
    setForm({
      name: "",
      sku: "",
      price: "",
      category: "General",
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
      category: product.category || "General",
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
      category: form.category.trim() || "General",
      description: form.description.trim(),
      remainingQuantity: Number(form.remainingQuantity || 0),
    };

    try {
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
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Unable to save product.",
      );
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
              error?.response?.data?.message || "Unable to delete product.",
            );
          }
        },
      },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      loadProducts(search, false);
    }, [search]),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Products</Text>
            <Text style={styles.subtitle}>
              Manage price and available stock
            </Text>
          </View>

          <TouchableOpacity style={styles.addTopButton} onPress={openAddModal}>
            <Text style={styles.addTopButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <AppInput
          placeholder="Search product, SKU, or category"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadProducts(text);
          }}
        />

        <TouchableOpacity style={styles.addFullButton} onPress={openAddModal}>
          <Text style={styles.addFullButtonText}>+ Add Product</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator color={theme.colors.primary} />}

        {!loading && products.length === 0 && (
          <AppCard>
            <Text style={styles.emptyText}>No products found.</Text>
          </AppCard>
        )}

        {products.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <View style={styles.productTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.info}>SKU: {item.sku || "No SKU"}</Text>
                <Text style={styles.info}>
                  Category: {item.category || "General"}
                </Text>
              </View>

              <View style={styles.priceBadge}>
                <Text style={styles.price}>
                  ₱{Number(item.price).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.availableBox}>
              <Text style={styles.availableLabel}>Remaining Available</Text>
              <Text style={styles.availableValue}>
                {item.inventory?.remainingQuantity ?? 0}
              </Text>
            </View>

            {item.description ? (
              <Text style={styles.description}>{item.description}</Text>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.editButtonText}>Edit / Update Qty</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedProduct ? "Edit Product" : "Add Product"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Update product details and available quantity
            </Text>

            <AppInput
              placeholder="Product name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <AppInput
              placeholder="Price"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text })}
            />

            <AppInput
              placeholder="Category"
              value={form.category}
              onChangeText={(text) => setForm({ ...form, category: text })}
            />

            <AppInput
              placeholder="Available quantity"
              keyboardType="numeric"
              value={form.remainingQuantity}
              onChangeText={(text) =>
                setForm({ ...form, remainingQuantity: text })
              }
            />

            <AppInput
              placeholder="Description"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
            />

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
              />
              <AppButton
                title={selectedProduct ? "Update Product" : "Save Product"}
                onPress={handleSaveProduct}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  addTopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addTopButtonText: {
    color: theme.colors.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: -2,
  },
  addFullButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  addFullButtonText: {
    color: theme.colors.white,
    fontWeight: "900",
    fontSize: 16,
  },
  productCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow,
  },
  productTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  info: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  priceBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  price: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 14,
  },
  stockBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stockLabel: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  stockValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  stockValuePrimary: {
    marginTop: 4,
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  description: {
    marginTop: 10,
    color: theme.colors.text,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  editButtonText: {
    color: theme.colors.primary,
    fontWeight: "900",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontWeight: "900",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: theme.spacing.md,
    maxHeight: "92%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginTop: -8,
  },
  modalActions: {
    gap: 10,
  },

  availableBox: {
    marginTop: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  availableLabel: {
    color: theme.colors.textMuted,
    fontWeight: "800",
    fontSize: 12,
  },
  availableValue: {
    marginTop: 6,
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 28,
  },
});
