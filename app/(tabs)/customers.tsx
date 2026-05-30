import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  PermissionsAndroid,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import RNBluetoothClassic from "react-native-bluetooth-classic";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "expo-router";

import * as MediaLibrary from "expo-media-library";
import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customerApi";
import ViewShot from "react-native-view-shot";

export default function CustomersScreen() {
  const { customerId, customerName } = useLocalSearchParams();
  const invoiceRef = useRef<any>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (customerId && customers.length > 0) {
      const foundCustomer = customers.find(
        (item: any) => item.id === customerId,
      );

      if (foundCustomer) {
        openHistory(foundCustomer);
      }
    }
  }, [customerId, customers]);

  async function loadCustomers(value = search) {
    try {
      setLoading(true);
      const data = await getCustomers(value);
      setCustomers(data);
    } catch (error) {
      console.log("Customers error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadCustomers(search);
    } finally {
      setRefreshing(false);
    }
  }

  function openAddModal() {
    setSelectedCustomer(null);
    setForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
    });
    setModalVisible(true);
  }

  function openEditModal(customer: any) {
    setSelectedCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setModalVisible(true);
  }

  async function saveInvoiceImage() {
    try {
      if (!invoiceRef.current) {
        Alert.alert("No invoice", "No receipt available to save.");
        return;
      }

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

  function money(value: any) {
    return Number(value || 0).toFixed(0);
  }

  async function printInvoice() {
    try {
      if (!selectedOrder) {
        Alert.alert("No invoice", "No selected order to print.");
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

      const items = selectedOrder.items || [];

      const totalQty = items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0,
      );

      let receipt = "";

      receipt += "        ARSA1\n";
      receipt += "      ORDER RECEIPT\n";
      receipt += "--------------------------------\n";
      receipt += `Contact Person: JOZHEN\n`;
      receipt += `Contact Person: 09303816198\n`;
      receipt += `Customer: ${selectedOrder.customer?.name || "CUSTOMER"}\n`;
      receipt += `Address : ${selectedOrder.customer?.address || "N/A"}\n`;
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
      receipt += `TOTAL: PHP ${money(selectedOrder.totalAmount)}\n`;
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

  async function handleSaveCustomer() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Customer name is required.");
      return;
    }

    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, form);

        Toast.show({
          type: "success",
          text1: "Customer Updated",
          text2: form.name,
        });
      } else {
        await createCustomer(form);

        Toast.show({
          type: "success",
          text1: "Customer Added",
          text2: form.name,
        });
      }

      setModalVisible(false);
      loadCustomers(search);
    } catch (error) {
      Alert.alert("Error", "Unable to save customer.");
    }
  }

  async function handleDelete(customer: any) {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);

              Toast.show({
                type: "success",
                text1: "Customer Deleted",
                text2: customer.name,
              });

              loadCustomers(search);
            } catch (error) {
              Alert.alert(
                "Cannot Delete",
                "This customer may already have orders. Better to keep customer records for reports.",
              );
            }
          },
        },
      ],
    );
  }

  async function openHistory(customer: any) {
    try {
      const data = await getCustomerById(customer.id);
      setCustomerHistory(data);
      setHistoryVisible(true);
    } catch (error) {
      Alert.alert("Error", "Unable to load customer history.");
    }
  }

  function openOrderReceipt(order: any) {
    setSelectedOrder({
      ...order,
      customer: {
        name: customerHistory?.name,
        phone: customerHistory?.phone,
        address: customerHistory?.address,
      },
      items: order.items || [],
    });

    setHistoryVisible(false);

    setTimeout(() => {
      setReceiptVisible(true);
    }, 300);
  }

  function formatMoney(value: any) {
    return `₱${Number(value || 0).toLocaleString()}`;
  }

  function getTotalQty(order: any) {
    return (
      order?.items?.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0,
      ) || 0
    );
  }

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, []),
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
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>Manage customer records</Text>
          </View>

          <TouchableOpacity style={styles.addTopButton} onPress={openAddModal}>
            <Text style={styles.addTopButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <AppInput
          placeholder="Search customer name or phone"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadCustomers(text);
          }}
        />

        <TouchableOpacity style={styles.addFullButton} onPress={openAddModal}>
          <Text style={styles.addFullButtonText}>+ Add Customer</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator color={theme.colors.primary} />}

        {!loading && customers.length === 0 && (
          <AppCard>
            <Text style={styles.emptyText}>No customers found.</Text>
          </AppCard>
        )}

        {customers.map((customer) => (
          <View key={customer.id} style={styles.customerCard}>
            <View style={styles.customerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.info}>
                  {customer.phone || "No phone number"}
                </Text>
                <Text style={styles.info}>
                  {customer.address || "No address"}
                </Text>
              </View>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>Customer</Text>
              </View>
            </View>

            {customer.notes ? (
              <Text style={styles.notes}>{customer.notes}</Text>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => openHistory(customer)}
              >
                <Text style={styles.historyButtonText}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(customer)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(customer)}
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
              {selectedCustomer ? "Edit Customer" : "Add Customer"}
            </Text>

            <Text style={styles.modalSubtitle}>
              {selectedCustomer
                ? "Update customer information"
                : "Create a new customer profile"}
            </Text>

            <AppInput
              placeholder="Customer name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <AppInput
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />

            <AppInput
              placeholder="Address"
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
            />

            <AppInput
              placeholder="Notes"
              value={form.notes}
              onChangeText={(text) => setForm({ ...form, notes: text })}
            />

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
              />
              <AppButton
                title={selectedCustomer ? "Update Customer" : "Save Customer"}
                onPress={handleSaveCustomer}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={historyVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Order History</Text>
            <Text style={styles.modalSubtitle}>
              {customerHistory?.name || "Customer"}
            </Text>

            {!customerHistory?.orders?.length ? (
              <AppCard>
                <Text style={styles.emptyText}>No orders yet.</Text>
              </AppCard>
            ) : (
              <ScrollView style={styles.historyScroll}>
                {customerHistory.orders.map((order: any) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.historyCard}
                    activeOpacity={0.85}
                    onPress={() => openOrderReceipt(order)}
                  >
                    <View style={styles.historyCardTop}>
                      <View>
                        <Text style={styles.historyTitle}>
                          {formatMoney(order.totalAmount)}
                        </Text>
                        <Text style={styles.historyInfo}>
                          {new Date(order.orderDate).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.historyViewBadge}>
                        <Text style={styles.historyViewBadgeText}>View</Text>
                      </View>
                    </View>

                    <Text style={styles.historyInfo}>
                      {order.items?.length || 0} item/s • Qty:{" "}
                      {getTotalQty(order)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <AppButton
              title="Close"
              variant="outline"
              onPress={() => setHistoryVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={receiptVisible} animationType="fade" transparent>
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptModalHeader}>
              <View>
                <Text style={styles.receiptModalTitle}>Order Receipt</Text>
                <Text style={styles.receiptModalSubtitle}>
                  {selectedOrder?.items?.length || 0} items
                </Text>
              </View>

              <TouchableOpacity
                style={styles.receiptCloseIcon}
                onPress={() => setReceiptVisible(false)}
              >
                <Text style={styles.receiptCloseIconText}>×</Text>
              </TouchableOpacity>
            </View>

            {receiptVisible && selectedOrder && (
              <View style={{ width: "100%" }}>
                <View style={styles.receiptBox}>
                  <View style={styles.receiptTopArea}>
                    <Text style={styles.receiptStoreName}>PLASTIKAN</Text>
                    <Text style={styles.receiptCustomerName}>
                      {(
                        selectedOrder.customer?.name || "CUSTOMER"
                      ).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.receiptInfoArea}>
                    <Text style={styles.receiptInfoText}>
                      Date:{" "}
                      {new Date(
                        selectedOrder.deliveryDate || selectedOrder.orderDate,
                      ).toLocaleString()}
                    </Text>

                    <Text style={styles.receiptInfoText}>
                      Contact:{" "}
                      {selectedOrder.customer?.phone ||
                        selectedOrder.customer?.contactNumber ||
                        "N/A"}
                    </Text>

                    <Text style={styles.receiptInfoText}>
                      Address: {selectedOrder.customer?.address || "N/A"}
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
                    {selectedOrder.items?.map((item: any) => (
                      <View key={item.id} style={styles.receiptItemRow}>
                        <Text style={[styles.receiptCell, { flex: 2.1 }]}>
                          {item.product?.name || item.name}
                        </Text>
                        <Text style={styles.receiptCell}>{item.quantity}</Text>
                        <Text style={styles.receiptCell}>
                          {formatMoney(item.price)}
                        </Text>
                        <Text
                          style={[styles.receiptCell, styles.noRightBorder]}
                        >
                          {formatMoney(item.subtotal)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.receiptSummary}>
                    <View style={styles.receiptGrandTotalRow}>
                      <Text style={styles.receiptGrandTotalLabel}>
                        Total Qty: {getTotalQty(selectedOrder)}
                      </Text>

                      <Text style={styles.receiptGrandTotalValue}>
                        {formatMoney(selectedOrder.totalAmount)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={[styles.receiptActionButton, styles.receiptCancelButton]}
                onPress={() => setReceiptVisible(false)}
              >
                <Text style={styles.receiptCancelButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.receiptActionButton, styles.receiptSaveButton]}
                onPress={saveInvoiceImage}
              >
                <Text style={styles.receiptActionButtonText}>Save Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.receiptActionButton, styles.receiptPrintButton]}
                onPress={printInvoice}
              >
                <Text style={styles.receiptActionButtonText}>Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View
        style={{
          position: "absolute",
          left: -10000,
          top: 0,
          width: 420,
        }}
        pointerEvents="none"
      >
        {selectedOrder && (
          <ViewShot
            ref={invoiceRef}
            options={{
              format: "png",
              quality: 1,
              result: "tmpfile",
            }}
          >
            <View
              collapsable={false}
              style={[
                styles.receiptBox,
                {
                  width: 420,
                  height: undefined,
                  maxHeight: undefined,
                },
              ]}
            >
              <View style={styles.receiptTopArea}>
                <Text style={styles.receiptStoreName}>PLASTIKAN</Text>
                <Text style={styles.receiptCustomerName}>
                  {(selectedOrder.customer?.name || "CUSTOMER").toUpperCase()}
                </Text>
              </View>

              <View style={styles.receiptInfoArea}>
                <Text style={styles.receiptInfoText}>
                  Date:{" "}
                  {new Date(
                    selectedOrder.deliveryDate || selectedOrder.orderDate,
                  ).toLocaleString()}
                </Text>

                <Text style={styles.receiptInfoText}>
                  Contact:{" "}
                  {selectedOrder.customer?.phone ||
                    selectedOrder.customer?.contactNumber ||
                    "N/A"}
                </Text>

                <Text style={styles.receiptInfoText}>
                  Address: {selectedOrder.customer?.address || "N/A"}
                </Text>
              </View>

              <View style={styles.receiptHeaderRow}>
                <Text style={[styles.receiptHeaderCell, { flex: 2.1 }]}>
                  Item
                </Text>
                <Text style={styles.receiptHeaderCell}>Qty</Text>
                <Text style={styles.receiptHeaderCell}>Price</Text>
                <Text style={[styles.receiptHeaderCell, styles.noRightBorder]}>
                  Total
                </Text>
              </View>

              {selectedOrder.items?.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.receiptItemRow}>
                  <Text style={[styles.receiptCell, { flex: 2.1 }]}>
                    {item.product?.name || item.name}
                  </Text>

                  <Text style={styles.receiptCell}>{item.quantity}</Text>

                  <Text style={styles.receiptCell}>
                    {formatMoney(item.price)}
                  </Text>

                  <Text style={[styles.receiptCell, styles.noRightBorder]}>
                    {formatMoney(item.subtotal)}
                  </Text>
                </View>
              ))}

              <View style={styles.receiptSummary}>
                <View style={styles.receiptGrandTotalRow}>
                  <Text style={styles.receiptGrandTotalLabel}>
                    Total Qty: {getTotalQty(selectedOrder)}
                  </Text>

                  <Text style={styles.receiptGrandTotalValue}>
                    {formatMoney(selectedOrder.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>
          </ViewShot>
        )}
      </View>
      <View
        style={{
          position: "absolute",
          left: -10000,
          top: 0,
          width: 420,
        }}
        pointerEvents="none"
      >
        {selectedOrder && (
          <ViewShot
            ref={invoiceRef}
            options={{
              format: "png",
              quality: 1,
              result: "tmpfile",
            }}
          >
            <View
              collapsable={false}
              style={[
                styles.receiptBox,
                {
                  width: 420,
                  height: undefined,
                  maxHeight: undefined,
                },
              ]}
            >
              <View style={styles.receiptTopArea}>
                <Text style={styles.receiptStoreName}>ARSA1</Text>
                <Text style={styles.receiptCustomerName}>
                  {(selectedOrder.customer?.name || "CUSTOMER").toUpperCase()}
                </Text>
              </View>

              <View style={styles.receiptInfoArea}>
                <View style={styles.receiptTopArea}>
                  <Text style={styles.receiptStoreName}>ARSA1</Text>

                  <Text style={styles.receiptCustomerName}>
                    {(
                      selectedOrder.customer?.name ||
                      selectedOrder.customerName ||
                      "CUSTOMER"
                    ).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.receiptInfoArea}>
                  <Text style={styles.receiptInfoText}>
                    Date:{" "}
                    {new Date(
                      selectedOrder.deliveryDate || selectedOrder.orderDate,
                    ).toLocaleString()}
                  </Text>

                  <Text style={styles.receiptInfoText}>
                    Contact:{" "}
                    {selectedOrder.customer?.phone ||
                      selectedOrder.customer?.contactNumber ||
                      "N/A"}
                  </Text>

                  <Text style={styles.receiptInfoText}>
                    Address: {selectedOrder.customer?.address || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptHeaderRow}>
                <Text style={[styles.receiptHeaderCell, { flex: 2.1 }]}>
                  Item
                </Text>
                <Text style={styles.receiptHeaderCell}>Qty</Text>
                <Text style={styles.receiptHeaderCell}>Price</Text>
                <Text style={[styles.receiptHeaderCell, styles.noRightBorder]}>
                  Total
                </Text>
              </View>

              {selectedOrder.items?.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.receiptItemRow}>
                  <Text style={[styles.receiptCell, { flex: 2.1 }]}>
                    {item.product?.name || item.name}
                  </Text>

                  <Text style={styles.receiptCell}>{item.quantity}</Text>

                  <Text style={styles.receiptCell}>
                    {formatMoney(item.price)}
                  </Text>

                  <Text style={[styles.receiptCell, styles.noRightBorder]}>
                    {formatMoney(item.subtotal)}
                  </Text>
                </View>
              ))}

              <View style={styles.receiptSummary}>
                <View style={styles.receiptGrandTotalRow}>
                  <Text style={styles.receiptGrandTotalLabel}>
                    Total Qty: {getTotalQty(selectedOrder)}
                  </Text>

                  <Text style={styles.receiptGrandTotalValue}>
                    {formatMoney(selectedOrder.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>
          </ViewShot>
        )}
      </View>
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
  customerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow,
  },
  customerTop: {
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
  notes: {
    marginTop: 10,
    color: theme.colors.text,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  historyButton: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  historyButtonText: {
    color: theme.colors.text,
    fontWeight: "900",
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
    maxHeight: "88%",
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
  historyScroll: {
    maxHeight: 420,
  },
  historyCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: 10,
  },
  historyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  historyTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },
  historyInfo: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
  historyViewBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  historyViewBadgeText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 12,
  },

  receiptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  receiptModalCard: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "86%",
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
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 2,
  },
  receiptCloseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptCloseIconText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginTop: -2,
  },
  receiptBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  receiptTopArea: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  receiptStoreName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 1,
  },
  receiptCustomerName: {
    marginTop: 4,
    fontSize: 17,
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
    minHeight: 42,
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
    paddingVertical: 12,
    paddingHorizontal: 2,
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
  receiptActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  receiptActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  receiptCancelButton: {
    backgroundColor: "#F3F4F6",
  },

  receiptSaveButton: {
    backgroundColor: "#166534",
  },

  receiptPrintButton: {
    backgroundColor: "#011107",
  },

  receiptActionButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  receiptCancelButtonText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },
  receiptSummary: {
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  receiptGrandTotalRow: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptGrandTotalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#166534",
  },
  receiptGrandTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#166534",
  },
});
