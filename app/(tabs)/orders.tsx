import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import {
  Check,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  UserPlus,
  X,
} from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import ReceiptModal from "@/components/ReceiptModal";
import CategoryChips, { CategoryBadge } from "@/components/CategoryChips";
import EmptyState, { Avatar } from "@/components/EmptyState";

import { getProducts } from "@/services/productApi";
import { getCategories } from "@/services/categoryApi";
import {
  getCustomers,
  createCustomer,
  getCustomerPrices,
} from "@/services/customerApi";
import { createOrder } from "@/services/orderApi";
import { errorMessage } from "@/services/api";
import { peso } from "@/lib/format";

export default function OrdersScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [addCustomerVisible, setAddCustomerVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [invoiceVisible, setInvoiceVisible] = useState(false);

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");

  const [cart, setCart] = useState<any[]>([]);
  // Last price the selected customer paid per product: { [productId]: { price } }
  const [customerPrices, setCustomerPrices] = useState<
    Record<string, { price: number; orderDate: string }>
  >({});
  const [savedOrder, setSavedOrder] = useState<any>(null);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadProducts(value = productSearch, category = categoryId) {
    try {
      setLoadingProducts(true);
      setVisibleCount(8);
      const data = await getProducts(value, category);
      setProducts(data);
    } catch (error) {
      console.log("Products error:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadCategories() {
    try {
      setCategories(await getCategories());
    } catch (error) {
      console.log("Categories error:", error);
    }
  }

  // Search as you type, but wait until typing pauses.
  function handleProductSearch(text: string) {
    setProductSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadProducts(text), 350);
  }

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    loadProducts(productSearch, value);
  }

  async function searchCustomers(value = customerSearch) {
    try {
      setLoadingCustomers(true);

      if (!value.trim()) {
        setCustomers([]);
        return;
      }

      const data = await getCustomers(value);
      setCustomers(data);
    } catch (error) {
      console.log("Customer search error:", error);
    } finally {
      setLoadingCustomers(false);
    }
  }

  function handleCustomerTextChange(text: string) {
    setCustomerSearch(text);
    setSelectedCustomer(null);

    if (!text.trim()) {
      setCustomers([]);
      return;
    }

    searchCustomers(text);
  }

  // Master list price, unless this customer has been charged differently before.
  function defaultPrice(
    productId: string,
    listPrice: any,
    prices = customerPrices,
  ) {
    return prices[productId]?.price ?? (Number(listPrice) || 0);
  }

  // Reprice cart lines the agent has not typed a price for.
  function applyCustomerPrices(prices: typeof customerPrices) {
    setCustomerPrices(prices);
    setCart((prev) =>
      prev.map((item) => {
        if (item.priceEdited) return item;
        const price = defaultPrice(item.productId, item.listPrice, prices);
        return {
          ...item,
          price,
          priceText: String(price),
          subtotal: item.quantity * price,
        };
      }),
    );
  }

  async function loadCustomerPrices(customerId: string) {
    try {
      applyCustomerPrices(await getCustomerPrices(customerId));
    } catch (error) {
      console.log("Customer prices error:", error);
      applyCustomerPrices({});
    }
  }

  function selectCustomer(customer: any) {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomers([]);
    loadCustomerPrices(customer.id);
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomers([]);
    applyCustomerPrices({});
  }

  function openAddCustomerModal() {
    setNewCustomerName(customerSearch);
    setNewCustomerAddress("");
    setNewCustomerContact("");
    setAddCustomerVisible(true);
  }

  async function handleCreateCustomer() {
    try {
      if (!newCustomerName.trim()) {
        Alert.alert("Required", "Customer name is required.");
        return;
      }

      setSavingCustomer(true);

      const customer = await createCustomer({
        name: newCustomerName.trim(),
        address: newCustomerAddress.trim(),
        phone: newCustomerContact.trim(),
      });

      setSelectedCustomer(customer);
      setCustomerSearch(customer.name);
      setCustomers([]);
      applyCustomerPrices({}); // brand-new customer: master list prices
      setAddCustomerVisible(false);
    } catch (error: any) {
      console.log("Create customer error:", error);
      Alert.alert("Error", errorMessage(error, "Failed to add customer."));
    } finally {
      setSavingCustomer(false);
    }
  }

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item,
        );
      }

      const price = defaultPrice(product.id, product.price);

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          listPrice: Number(product.price) || 0,
          price,
          priceText: String(price),
          priceEdited: false,
          quantity: 1,
          subtotal: price,
        },
      ];
    });
  }

  function increaseQty(productId: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.price,
            }
          : item,
      ),
    );
  }

  function decreaseQty(productId: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
                subtotal: (item.quantity - 1) * item.price,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function updateQty(productId: string, value: string) {
    const cleaned = value.replace(/[^0-9]/g, "");

    if (cleaned === "") {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: 0, subtotal: 0 }
            : item,
        ),
      );
      return;
    }

    const quantity = Number(cleaned);

    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity,
                subtotal: quantity * item.price,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function updatePrice(productId: string, value: string) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const finalValue =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;

    const price = Number(finalValue) || 0;

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              price,
              priceText: finalValue, // keep "12." while typing
              priceEdited: true,
              subtotal: item.quantity * price,
            }
          : item,
      ),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function openCart() {
    if (!selectedCustomer) {
      Alert.alert(
        "Customer Required",
        "Please select or add a customer first.",
      );
      return;
    }

    setCartVisible(true);
  }

  async function handleSaveOrder() {
    try {
      if (!selectedCustomer) {
        Alert.alert(
          "Customer Required",
          "Please select or add customer first.",
        );
        return;
      }

      const items = cart.filter((item) => item.quantity > 0);

      if (items.length === 0) {
        Alert.alert("Cart Empty", "Please add products first.");
        return;
      }

      setSavingOrder(true);

      const payload = {
        customerId: selectedCustomer.id,
        deliveryDate: new Date(),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      };

      const order = await createOrder(payload);

      setSavedOrder(order);
      setCartVisible(false);
      setInvoiceVisible(true);
      setCart([]);
      loadProducts(); // refresh remaining stock
    } catch (error: any) {
      console.log("Save order error:", error);
      Alert.alert("Error", errorMessage(error, "Failed to save order."));
    } finally {
      setSavingOrder(false);
    }
  }

  function closeReceipt() {
    setInvoiceVisible(false);
    clearCustomer();
  }

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadProducts(productSearch, categoryId);
    }, []),
  );

  const visibleProducts = products.slice(0, visibleCount);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const customerNotFound =
    customerSearch.trim().length > 0 &&
    !selectedCustomer &&
    customers.length === 0 &&
    !loadingCustomers;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: cart.length ? 120 : 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          eyebrow="New Booking"
          title="Book Order"
          subtitle="Choose a customer, then add products."
        />

        {/* Step 1 — customer */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View
              style={[styles.stepNumber, selectedCustomer && styles.stepDone]}
            >
              {selectedCustomer ? (
                <Check size={14} color={theme.colors.white} />
              ) : (
                <Text style={styles.stepNumberText}>1</Text>
              )}
            </View>
            <Text style={styles.stepTitle}>Customer</Text>
          </View>

          {selectedCustomer ? (
            <View style={styles.selectedCustomer}>
              <Avatar name={selectedCustomer.name} size={44} inverse />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                <Text style={styles.selectedInfo} numberOfLines={1}>
                  {selectedCustomer.phone || "No contact number"}
                </Text>
                <Text style={styles.selectedInfo} numberOfLines={1}>
                  {selectedCustomer.address || "No address"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={clearCustomer}
                style={styles.changeButton}
                hitSlop={8}
              >
                <X size={16} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <AppInput
                placeholder="Search customer name or phone"
                value={customerSearch}
                onChangeText={handleCustomerTextChange}
                icon={<Search size={18} color={theme.colors.textMuted} />}
              />

              {loadingCustomers && (
                <ActivityIndicator
                  style={{ marginTop: 10 }}
                  color={theme.colors.primary}
                />
              )}

              {customers.length > 0 && (
                <View style={styles.results}>
                  {customers.map((customer, index) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={[
                        styles.resultItem,
                        index === customers.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => selectCustomer(customer)}
                    >
                      <Avatar name={customer.name} size={34} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{customer.name}</Text>
                        <Text style={styles.resultInfo} numberOfLines={1}>
                          {[customer.phone, customer.address]
                            .filter(Boolean)
                            .join(" · ") || "No details"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {customerNotFound && (
                <AppButton
                  title={`Add "${customerSearch.trim()}" as new customer`}
                  variant="outline"
                  onPress={openAddCustomerModal}
                  icon={<UserPlus size={16} color={theme.colors.text} />}
                  style={{ marginTop: 10 }}
                />
              )}
            </>
          )}
        </View>

        {/* Step 2 — products */}
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, cart.length > 0 && styles.stepDone]}>
            {cart.length > 0 ? (
              <Check size={14} color={theme.colors.white} />
            ) : (
              <Text style={styles.stepNumberText}>2</Text>
            )}
          </View>
          <Text style={styles.stepTitle}>Products</Text>
        </View>

        <AppInput
          placeholder="Search product"
          value={productSearch}
          onChangeText={handleProductSearch}
          icon={<Search size={18} color={theme.colors.textMuted} />}
        />

        <CategoryChips
          categories={categories}
          value={categoryId}
          onChange={handleCategoryChange}
        />

        {loadingProducts ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginVertical: 24 }}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={22} color={theme.colors.textMuted} />}
            title="No products found"
            message="Try another search or category."
          />
        ) : (
          <View style={styles.productList}>
            {visibleProducts.map((product, index) => {
              const inCart = cart.find((item) => item.productId === product.id);
              const stock = product.inventory?.remainingQuantity ?? 0;
              const outOfStock = stock <= 0;
              const lastPrice = customerPrices[product.id];

              return (
                <View
                  key={product.id}
                  style={[
                    styles.productItem,
                    index === visibleProducts.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={styles.productRow}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <CategoryBadge name={product.category?.name} />
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productMeta}>
                        <Text style={styles.productPrice}>
                          {peso(defaultPrice(product.id, product.price), 2)}
                        </Text>
                        {"  ·  "}
                        {outOfStock ? "Out of stock" : `${stock} in stock`}
                      </Text>
                      {lastPrice &&
                      lastPrice.price !== Number(product.price) ? (
                        <Text style={styles.lastPrice}>
                          Customer price · list {peso(product.price, 2)}
                        </Text>
                      ) : null}
                    </View>

                    {inCart ? (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => decreaseQty(product.id)}
                        >
                          <Minus size={16} color={theme.colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>
                          {inCart.quantity}
                        </Text>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => increaseQty(product.id)}
                        >
                          <Plus size={16} color={theme.colors.white} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          outOfStock && styles.addDisabled,
                        ]}
                        disabled={outOfStock}
                        onPress={() => addToCart(product)}
                      >
                        <Plus size={16} color={theme.colors.text} />
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {inCart ? (
                    <View style={styles.inlinePriceRow}>
                      <Text style={styles.inlinePriceLabel}>Price</Text>
                      <View style={styles.priceField}>
                        <Text style={styles.pricePeso}>₱</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={inCart.priceText ?? String(inCart.price)}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          selectionColor={theme.colors.text}
                          onChangeText={(value) =>
                            updatePrice(product.id, value)
                          }
                        />
                      </View>
                      <Text style={styles.cartSubtotal}>
                        {peso(inCart.subtotal, 2)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {!loadingProducts && visibleCount < products.length && (
          <AppButton
            title={`Load more (${products.length - visibleCount} left)`}
            variant="ghost"
            onPress={() => setVisibleCount((prev) => prev + 8)}
          />
        )}
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cartBar}
          onPress={openCart}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cartBarLabel}>Review Order</Text>
            <Text style={styles.cartBarSub} numberOfLines={1}>
              {selectedCustomer?.name || "Select a customer first"}
            </Text>
          </View>
          <Text style={styles.cartBarTotal}>{peso(totalAmount)}</Text>
        </TouchableOpacity>
      )}

      <Sheet
        visible={addCustomerVisible}
        onClose={() => setAddCustomerVisible(false)}
        title="New Customer"
        subtitle="Save and use for this order"
        footer={
          <>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => setAddCustomerVisible(false)}
              style={{ flex: 1 }}
            />
            <AppButton
              title="Save Customer"
              onPress={handleCreateCustomer}
              loading={savingCustomer}
              style={{ flex: 1 }}
            />
          </>
        }
      >
        <AppInput
          label="Name"
          placeholder="Customer name"
          value={newCustomerName}
          onChangeText={setNewCustomerName}
        />
        <AppInput
          label="Contact Number"
          placeholder="09xx xxx xxxx"
          keyboardType="phone-pad"
          value={newCustomerContact}
          onChangeText={setNewCustomerContact}
        />
        <AppInput
          label="Address"
          placeholder="Delivery address"
          value={newCustomerAddress}
          onChangeText={setNewCustomerAddress}
          multiline
          style={{ minHeight: 72, textAlignVertical: "top" }}
        />
      </Sheet>

      <Sheet
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        title="Order Summary"
        subtitle={`${totalItems} item${totalItems === 1 ? "" : "s"} for ${
          selectedCustomer?.name || ""
        }`}
        footer={
          <View style={{ flex: 1, gap: 12 }}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{peso(totalAmount, 2)}</Text>
            </View>
            <AppButton
              title="Confirm & Save Order"
              onPress={handleSaveOrder}
              loading={savingOrder}
            />
          </View>
        }
      >
        {cart.map((item) => (
          <View key={item.productId} style={styles.cartItem}>
            <View style={styles.cartItemTop}>
              <Text style={styles.cartName}>{item.name}</Text>
              <TouchableOpacity
                onPress={() => removeFromCart(item.productId)}
                hitSlop={8}
              >
                <X size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.cartItemBottom}>
              <View style={styles.priceField}>
                <Text style={styles.pricePeso}>₱</Text>
                <TextInput
                  style={styles.priceInput}
                  value={item.priceText ?? String(item.price)}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  selectionColor={theme.colors.text}
                  onChangeText={(value) => updatePrice(item.productId, value)}
                />
              </View>

              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => decreaseQty(item.productId)}
                >
                  <Minus size={16} color={theme.colors.white} />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={String(item.quantity)}
                  keyboardType="number-pad"
                  selectionColor={theme.colors.text}
                  onChangeText={(value) => updateQty(item.productId, value)}
                />
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => increaseQty(item.productId)}
                >
                  <Plus size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={styles.cartSubtotal}>{peso(item.subtotal, 2)}</Text>
            </View>
          </View>
        ))}
      </Sheet>

      <ReceiptModal
        visible={invoiceVisible}
        order={savedOrder}
        onClose={closeReceipt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingTop: 12, gap: 14 },

  step: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDone: {
    backgroundColor: theme.colors.primary,
  },
  stepNumberText: {
    fontWeight: "800",
    fontSize: 12,
    color: theme.colors.text,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: theme.colors.text,
  },

  selectedCustomer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  selectedName: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 16,
  },
  selectedInfo: {
    marginTop: 2,
    color: theme.colors.inverseMuted,
    fontWeight: "500",
    fontSize: 13,
  },
  changeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },

  results: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultName: { fontWeight: "700", color: theme.colors.text },
  resultInfo: { marginTop: 2, color: theme.colors.textMuted, fontSize: 12 },

  productList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  productItem: {
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lastPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  inlinePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  inlinePriceLabel: {
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  productMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.text,
  },
  addDisabled: {
    opacity: 0.3,
  },
  addButtonText: {
    fontWeight: "700",
    color: theme.colors.text,
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    minWidth: 26,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 15,
    color: theme.colors.text,
  },

  cartBar: {
    position: "absolute",
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadowStrong,
  },
  cartBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  cartBarLabel: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
  cartBarSub: {
    marginTop: 1,
    color: theme.colors.inverseMuted,
    fontSize: 12,
  },
  cartBarTotal: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: -0.4,
  },

  cartItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  cartItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cartName: {
    flex: 1,
    fontWeight: "700",
    fontSize: 15,
    color: theme.colors.text,
  },
  cartItemBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceField: {
    flexDirection: "row",
    alignItems: "center",
    width: 96,
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm + 2,
    paddingHorizontal: 10,
  },
  pricePeso: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontWeight: "700",
    color: theme.colors.text,
    paddingVertical: 0,
  },
  qtyInput: {
    width: 44,
    height: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm + 2,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  cartSubtotal: {
    flex: 1,
    textAlign: "right",
    fontWeight: "800",
    color: theme.colors.text,
  },

  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  totalLabel: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: theme.colors.text,
  },
});
