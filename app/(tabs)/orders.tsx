import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from "react-native";

import RNBluetoothClassic from "react-native-bluetooth-classic";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import { getProducts } from "@/services/productApi";
import { getCustomers, createCustomer } from "@/services/customerApi";
import { createOrder } from "@/services/orderApi";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const invoiceRef = useRef<any>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);

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
  const [savedOrder, setSavedOrder] = useState<any>(null);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  async function loadProducts(value = productSearch) {
    try {
      setLoadingProducts(true);
      setVisibleCount(6);
      const data = await getProducts(value);
      setProducts(data);
    } catch (error) {
      console.log("Products error:", error);
    } finally {
      setLoadingProducts(false);
    }
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

  function selectCustomer(customer: any) {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomers([]);
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
      setAddCustomerVisible(false);

      Alert.alert("Success", "Customer added successfully.");
    } catch (error: any) {
      console.log("Create customer error:", error);
      Alert.alert("Error", error?.message || "Failed to add customer.");
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

      const price = Number(product.price) || 0;

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price,
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
              subtotal: item.quantity * price,
            }
          : item,
      ),
    );
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

      if (cart.length === 0) {
        Alert.alert("Cart Empty", "Please add products first.");
        return;
      }

      setSavingOrder(true);

      const payload = {
        customerId: selectedCustomer.id,
        deliveryDate: new Date(),
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      };

      const response = await createOrder(payload);
      const order = response?.data || response;

      setSavedOrder(order);
      setCartVisible(false);
      setInvoiceVisible(true);
      setCart([]);
    } catch (error: any) {
      console.log("Save order error:", error);
      Alert.alert("Error", error?.message || "Failed to save order.");
    } finally {
      setSavingOrder(false);
    }
  }

  async function saveInvoiceImage() {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow photo access.");
        return;
      }

      const uri = await invoiceRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert("Saved", "Invoice saved to gallery.");
    } catch (error) {
      console.log("Save invoice image error:", error);
      Alert.alert("Error", "Failed to save invoice image.");
    }
  }

  async function requestBluetoothPermissions() {
    if (Platform.OS !== "android") return true;

    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      return (
        granted["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  async function printInvoice() {
    try {
      if (!savedOrder) {
        Alert.alert("No invoice", "No saved order to print.");
        return;
      }

      const allowed = await requestBluetoothPermissions();

      if (!allowed) {
        Alert.alert(
          "Permission Required",
          "Please allow Bluetooth permission.",
        );
        return;
      }

      const device =
        await RNBluetoothClassic.connectToDevice("86:67:7A:A5:31:29");

      if (!device) {
        Alert.alert("Printer Error", "Cannot connect to printer.");
        return;
      }

      const items = savedOrder.items || [];

      const totalQty = items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0,
      );

      const money = (value: any) => Number(value || 0).toFixed(0);

      let receipt = "";

      receipt += "        ARSA1\n";
      receipt += "      ORDER RECEIPT\n";
      receipt += "--------------------------------\n";
      receipt += `Contact Person: JOZHEN\n`;
      receipt += `Contact Number: 09303816198\n`;
      receipt += `Customer: ${savedOrder.customer?.name || "CUSTOMER"}\n`;
      receipt += `Address : ${savedOrder.customer?.address || "N/A"}\n`;
      receipt += "--------------------------------\n";
      receipt += "ITEM              QTY   TOTAL\n";
      receipt += "--------------------------------\n";

      for (const item of items) {
        const name = String(item.product?.name || item.name || "Item").slice(
          0,
          16,
        );

        const qty = String(item.quantity || 0).padStart(3, " ");
        const subtotal = money(item.subtotal).padStart(7, " ");

        receipt += `${name.padEnd(16, " ")} ${qty} ${subtotal}\n`;
      }

      receipt += "--------------------------------\n";
      receipt += `TOTAL QTY: ${totalQty}\n`;
      receipt += `TOTAL: PHP ${money(savedOrder.totalAmount)}\n`;
      receipt += "--------------------------------\n";
      receipt += "        Thank you!\n\n\n";

      await device.write(receipt);

      Alert.alert("Success", "Receipt printed.");
    } catch (error: any) {
      console.log("Print invoice error:", error);
      Alert.alert(
        "Print Error",
        error?.message || "Failed to connect or print receipt.",
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProducts("");
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
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 140 + insets.bottom },
        ]}
      >
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Search customer and add products.</Text>

        <AppCard>
          <Text style={styles.sectionTitle}>Customer</Text>

          <AppInput
            placeholder="Search customer"
            value={customerSearch}
            onChangeText={handleCustomerTextChange}
          />

          {loadingCustomers && (
            <ActivityIndicator
              style={{ marginTop: 10 }}
              color={theme.colors.primary}
            />
          )}

          {selectedCustomer && (
            <View style={styles.selectedCustomerBox}>
              <Text style={styles.selectedLabel}>Selected Customer</Text>
              <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
              <Text style={styles.selectedAddress}>
                {selectedCustomer.contactNumber ||
                  selectedCustomer.phone ||
                  "No contact number"}
              </Text>
              <Text style={styles.selectedAddress}>
                {selectedCustomer.address || "No address"}
              </Text>
            </View>
          )}

          {!selectedCustomer && customers.length > 0 && (
            <View style={styles.customerResults}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerItem}
                  onPress={() => selectCustomer(customer)}
                >
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerAddress}>
                    {customer.contactNumber ||
                      customer.phone ||
                      "No contact number"}
                  </Text>
                  <Text style={styles.customerAddress}>
                    {customer.address || "No address"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {customerNotFound && (
            <TouchableOpacity
              style={styles.addCustomerButton}
              onPress={openAddCustomerModal}
            >
              <Text style={styles.addCustomerButtonText}>
                + Add "{customerSearch}"
              </Text>
            </TouchableOpacity>
          )}
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Products</Text>

          <AppInput
            placeholder="Search product"
            value={productSearch}
            onChangeText={setProductSearch}
            style={styles.searchProductInput}
          />

          <AppButton
            title="Search Product"
            onPress={() => loadProducts(productSearch)}
          />
        </AppCard>

        {loadingProducts ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <>
            {visibleProducts.map((product) => (
              <AppCard key={product.id}>
                <View style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.price}>
                      ₱{Number(product.price).toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addProductButton}
                    onPress={() => addToCart(product)}
                  >
                    <Text style={styles.addProductButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))}

            {visibleCount < products.length && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => setVisibleCount((prev) => prev + 6)}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: 28 + insets.bottom }]}
          onPress={() => {
            if (!selectedCustomer) {
              Alert.alert(
                "Customer Required",
                "Please select or add a customer first.",
              );
              return;
            }

            setCartVisible(true);
          }}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
          <Text style={styles.cartTotal}>₱{totalAmount.toFixed(0)}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={addCustomerVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[
                styles.addCustomerModal,
                { paddingBottom: 18 + insets.bottom },
              ]}
            >
              <Text style={styles.modalTitle}>Add Customer</Text>

              <TextInput
                style={styles.input}
                placeholder="Customer name"
                value={newCustomerName}
                placeholderTextColor="#64748B"
                onChangeText={setNewCustomerName}
              />

              <TextInput
                style={styles.input}
                placeholder="Contact number"
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
                value={newCustomerContact}
                onChangeText={setNewCustomerContact}
              />

              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Address"
                value={newCustomerAddress}
                placeholderTextColor="#64748B"
                onChangeText={setNewCustomerAddress}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setAddCustomerVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateCustomer}
                  disabled={savingCustomer}
                >
                  {savingCustomer ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Customer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={cartVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[styles.cartModal, { paddingBottom: 18 + insets.bottom }]}
            >
              <Text style={styles.modalTitle}>Cart Summary</Text>

              <View style={styles.cartCustomerBox}>
                <Text style={styles.cartCustomerLabel}>Selected Customer</Text>
                <Text style={styles.cartCustomerName}>
                  {selectedCustomer?.name}
                </Text>
                <Text style={styles.cartCustomerInfo}>
                  {selectedCustomer?.contactNumber ||
                    selectedCustomer?.phone ||
                    "No contact number"}
                </Text>
                <Text style={styles.cartCustomerInfo}>
                  {selectedCustomer?.address || "No address"}
                </Text>
              </View>

              <ScrollView
                style={styles.cartScroll}
                keyboardShouldPersistTaps="handled"
              >
                {cart.map((item) => (
                  <View key={item.productId} style={styles.cartItem}>
                    <View style={styles.cartProductInfo}>
                      <Text style={styles.cartName}>{item.name}</Text>

                      <View style={styles.priceEditRow}>
                        <Text style={styles.priceEditLabel}>Price</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={String(item.price)}
                          keyboardType="decimal-pad"
                          placeholderTextColor="#64748B"
                          onChangeText={(value) =>
                            updatePrice(item.productId, value)
                          }
                        />
                      </View>

                      <Text style={styles.cartPrice}>
                        ₱{Number(item.price).toFixed(2)} x {item.quantity} = ₱
                        {Number(item.subtotal).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => decreaseQty(item.productId)}
                      >
                        <Text style={styles.qtyText}>-</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={styles.qtyInput}
                        value={String(item.quantity)}
                        placeholderTextColor="#64748B"
                        keyboardType="number-pad"
                        onChangeText={(value) =>
                          updateQty(item.productId, value)
                        }
                      />

                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => increaseQty(item.productId)}
                      >
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₱{totalAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCartVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveOrder}
                  disabled={savingOrder}
                >
                  {savingOrder ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={invoiceVisible} animationType="fade" transparent>
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View
            style={[
              styles.receiptOverlay,
              {
                paddingTop: 18 + insets.top,
                paddingBottom: 18 + insets.bottom,
              },
            ]}
          >
            <View style={styles.receiptModalCard}>
              <View style={styles.receiptModalHeader}>
                <View>
                  <Text style={styles.receiptModalTitle}>Order Receipt</Text>
                  <Text style={styles.receiptModalSubtitle}>
                    {savedOrder?.items?.length || 0} items
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.receiptCloseIcon}
                  onPress={() => setInvoiceVisible(false)}
                >
                  <Text style={styles.receiptCloseIconText}>×</Text>
                </TouchableOpacity>
              </View>

              {savedOrder && (
                <ViewShot
                  ref={invoiceRef}
                  options={{ format: "png", quality: 1 }}
                >
                  <View style={styles.receiptBox}>
                    <View style={styles.receiptTopArea}>
                      <Text style={styles.receiptStoreName}>PLASTIKAN</Text>
                      <Text style={styles.receiptCustomerName}>
                        {(
                          savedOrder.customer?.name || "CUSTOMER"
                        ).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.receiptInfoArea}>
                      <Text style={styles.receiptInfoText}>
                        Contact:{" "}
                        {savedOrder.customer?.phone ||
                          savedOrder.customer?.contactNumber ||
                          "N/A"}
                      </Text>

                      <Text style={styles.receiptInfoText}>
                        Address: {savedOrder.customer?.address || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.receiptHeaderRow}>
                      <Text style={[styles.receiptHeaderCell, { flex: 2.1 }]}>
                        Item
                      </Text>
                      <Text style={styles.receiptHeaderCell}>Qty</Text>
                      <Text style={styles.receiptHeaderCell}>Price</Text>
                      <Text
                        style={[styles.receiptHeaderCell, styles.noRightBorder]}
                      >
                        Total
                      </Text>
                    </View>

                    <ScrollView
                      style={styles.receiptItemsScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {savedOrder.items.map((item: any, index: number) => (
                        <View
                          key={item.id || `${item.productId}-${index}`}
                          style={styles.receiptItemRow}
                        >
                          <Text style={[styles.receiptCell, { flex: 2.1 }]}>
                            {item.product?.name || item.name}
                          </Text>
                          <Text style={styles.receiptCell}>
                            {item.quantity}
                          </Text>
                          <Text style={styles.receiptCell}>
                            ₱{Number(item.price).toFixed(0)}
                          </Text>
                          <Text
                            style={[styles.receiptCell, styles.noRightBorder]}
                          >
                            ₱
                            {Number(
                              item.subtotal || item.quantity * item.price,
                            ).toFixed(0)}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    <View style={styles.receiptSummary}>
                      <View style={styles.receiptGrandTotalRow}>
                        <Text style={styles.receiptGrandTotalLabel}>
                          Total Qty:{" "}
                          {savedOrder.items.reduce(
                            (sum: number, item: any) => sum + item.quantity,
                            0,
                          )}
                        </Text>

                        <Text style={styles.receiptGrandTotalValue}>
                          ₱{Number(savedOrder.totalAmount).toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ViewShot>
              )}

              <View style={styles.receiptActions}>
                <TouchableOpacity
                  style={[
                    styles.receiptActionButton,
                    styles.receiptCancelButton,
                  ]}
                  onPress={() => {
                    setInvoiceVisible(false);
                    setProductSearch("");
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                >
                  <Text style={styles.receiptCancelButtonText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.receiptActionButton, styles.receiptSaveButton]}
                  onPress={saveInvoiceImage}
                >
                  <Text style={styles.receiptActionButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.receiptActionButton,
                    styles.receiptPrintButton,
                  ]}
                  onPress={printInvoice}
                >
                  <Text style={styles.receiptActionButtonText}>Print</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 12 },

  title: { fontSize: 30, fontWeight: "900", color: theme.colors.text },
  subtitle: { color: theme.colors.textMuted, fontWeight: "700" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 10,
  },

  selectedCustomerBox: {
    marginTop: 12,
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 12,
  },
  selectedLabel: { color: "#166534", fontWeight: "900", fontSize: 12 },
  selectedName: {
    marginTop: 4,
    color: "#14532D",
    fontWeight: "900",
    fontSize: 16,
  },
  selectedAddress: { marginTop: 2, color: "#166534", fontWeight: "700" },

  customerResults: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  customerItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  customerName: { fontWeight: "900", color: "#111827" },
  customerAddress: { marginTop: 3, color: "#6b7280", fontWeight: "600" },

  addCustomerButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  addCustomerButtonText: { color: "#fff", fontWeight: "900" },

  productRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  productName: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  price: { marginTop: 4, color: theme.colors.textMuted, fontWeight: "800" },

  addProductButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  addProductButtonText: { color: "#fff", fontWeight: "900" },

  loadMoreButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  loadMoreText: { color: "#111827", fontWeight: "900" },

  floatingCart: {
    position: "absolute",
    right: 18,
    minWidth: 84,
    height: 74,
    borderRadius: 37,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cartIcon: { fontSize: 27 },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#41ab7b",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
  },
  cartBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  cartTotal: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  addCustomerModal: {
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  cartModal: {
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "92%",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 14,
    color: "#111827",
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontWeight: "700",
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelButtonText: { color: "#111827", fontWeight: "900" },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "900" },

  cartScroll: {
    maxHeight: 360,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cartProductInfo: {
    flex: 1,
  },
  cartName: { fontWeight: "900", color: "#111827" },
  cartPrice: { marginTop: 5, color: "#6b7280", fontWeight: "700" },

  priceEditRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceEditLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6B7280",
  },
  priceInput: {
    width: 90,
    height: 38,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontWeight: "900",
    color: "#111827",
    backgroundColor: "#fff",
  },

  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  qtyInput: {
    width: 54,
    height: 40,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    color: "#111827",
  },

  totalBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { color: "#fff", fontWeight: "900", fontSize: 16 },
  totalValue: { color: "#fff", fontWeight: "900", fontSize: 24 },

  cartCustomerBox: {
    backgroundColor: "#DCFCE7",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  cartCustomerLabel: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 12,
  },
  cartCustomerName: {
    marginTop: 4,
    color: "#14532D",
    fontWeight: "900",
    fontSize: 17,
  },
  cartCustomerInfo: {
    marginTop: 2,
    color: "#166534",
    fontWeight: "700",
  },

  searchProductInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontWeight: "700",
    backgroundColor: "#fff",
  },

  receiptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  receiptModalCard: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
  },
  receiptModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  receiptModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  receiptModalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  receiptCloseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptCloseIconText: {
    fontSize: 24,
    lineHeight: 27,
    color: "#111827",
    fontWeight: "800",
  },

  receiptBox: {
    width: "100%",
    maxHeight: 560,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  receiptTopArea: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  receiptStoreName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 2,
    marginBottom: 6,
  },
  receiptCustomerName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  receiptInfoArea: {
    padding: 12,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  receiptInfoText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  receiptHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  receiptHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    color: "#374151",
    textAlign: "center",
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  receiptItemsScroll: {
    maxHeight: 300,
  },
  receiptItemRow: {
    flexDirection: "row",
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  receiptCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    paddingVertical: 11,
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  noRightBorder: {
    borderRightWidth: 0,
  },
  receiptSummary: {
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  receiptGrandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#166534",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  receiptGrandTotalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  receiptGrandTotalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  receiptActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  receiptActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptCancelButton: {
    backgroundColor: "#E5E7EB",
  },
  receiptSaveButton: {
    backgroundColor: "#166534",
  },
  receiptPrintButton: {
    backgroundColor: "#111827",
  },
  receiptCancelButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
  },
  receiptActionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
