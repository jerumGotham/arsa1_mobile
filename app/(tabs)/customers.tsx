import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  ChevronRight,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader, { IconButton } from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import ReceiptModal from "@/components/ReceiptModal";
import EmptyState, { Avatar } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customerApi";
import { errorMessage } from "@/services/api";
import { formatDateTime, peso, totalQty } from "@/lib/format";

export default function CustomersScreen() {
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { isAdmin } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Opened from the dashboard: jump straight to that customer's history once.
  const handledCustomerId = useRef<string | null>(null);

  useEffect(() => {
    if (customerId && handledCustomerId.current !== customerId) {
      handledCustomerId.current = customerId;
      openHistory({ id: customerId });
    }
  }, [customerId]);

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

  async function handleSaveCustomer() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Customer name is required.");
      return;
    }

    try {
      setSaving(true);

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
      Alert.alert("Error", errorMessage(error, "Unable to save customer."));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(customer: any) {
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

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, []),
  );

  const historyTotal =
    customerHistory?.orders?.reduce(
      (sum: number, order: any) => sum + Number(order.totalAmount || 0),
      0,
    ) || 0;

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
          eyebrow={`${customers.length} record${customers.length === 1 ? "" : "s"}`}
          title="Customers"
          right={
            <IconButton onPress={openAddModal}>
              <Plus size={22} color={theme.colors.white} />
            </IconButton>
          }
        />

        <AppInput
          placeholder="Search name or phone"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadCustomers(text);
          }}
          icon={<Search size={18} color={theme.colors.textMuted} />}
        />

        {loading && <ActivityIndicator color={theme.colors.primary} />}

        {!loading && customers.length === 0 && (
          <EmptyState
            icon={<Users size={22} color={theme.colors.textMuted} />}
            title="No customers found"
            message="Add a customer with the + button."
          />
        )}

        {customers.map((customer) => (
          <TouchableOpacity
            key={customer.id}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => openHistory(customer)}
          >
            <View style={styles.cardTop}>
              <Avatar name={customer.name} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{customer.name}</Text>
                <View style={styles.metaRow}>
                  <Phone size={12} color={theme.colors.textMuted} />
                  <Text style={styles.meta}>
                    {customer.phone || "No phone number"}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin size={12} color={theme.colors.textMuted} />
                  <Text style={styles.meta} numberOfLines={1}>
                    {customer.address || "No address"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={theme.colors.textSubtle} />
            </View>

            {customer.notes ? (
              <Text style={styles.notes}>{customer.notes}</Text>
            ) : null}

            {isAdmin ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(customer)}
                >
                  <Pencil size={14} color={theme.colors.text} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(customer)}
                >
                  <Trash2 size={14} color={theme.colors.danger} />
                  <Text style={[styles.actionText, styles.dangerText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Sheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedCustomer ? "Edit Customer" : "New Customer"}
        subtitle={
          selectedCustomer
            ? "Update customer information"
            : "Create a new customer profile"
        }
        footer={
          <>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => setModalVisible(false)}
              style={{ flex: 1 }}
            />
            <AppButton
              title={selectedCustomer ? "Update" : "Save Customer"}
              onPress={handleSaveCustomer}
              loading={saving}
              style={{ flex: 1 }}
            />
          </>
        }
      >
        <AppInput
          label="Name"
          placeholder="Customer name"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />
        <AppInput
          label="Phone"
          placeholder="09xx xxx xxxx"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(text) => setForm({ ...form, phone: text })}
        />
        <AppInput
          label="Address"
          placeholder="Delivery address"
          value={form.address}
          onChangeText={(text) => setForm({ ...form, address: text })}
        />
        <AppInput
          label="Notes"
          placeholder="Optional"
          value={form.notes}
          onChangeText={(text) => setForm({ ...form, notes: text })}
        />
      </Sheet>

      <Sheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        title={customerHistory?.name || "Customer"}
        subtitle={isAdmin ? "Order history" : "Orders you booked"}
      >
        <View style={styles.historySummary}>
          <View>
            <Text style={styles.historySummaryLabel}>Orders</Text>
            <Text style={styles.historySummaryValue}>
              {customerHistory?.orders?.length || 0}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.historySummaryLabel}>Total Spent</Text>
            <Text style={styles.historySummaryValue}>{peso(historyTotal)}</Text>
          </View>
        </View>

        {!customerHistory?.orders?.length ? (
          <EmptyState title="No orders yet" />
        ) : (
          customerHistory.orders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              style={styles.historyRow}
              activeOpacity={0.7}
              onPress={() => openOrderReceipt(order)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.historyAmount}>
                  {peso(order.totalAmount)}
                </Text>
                <Text style={styles.historyInfo}>
                  {formatDateTime(order.orderDate)}
                </Text>
                <Text style={styles.historyInfo}>
                  {order.items?.length || 0} item/s · Qty {totalQty(order)}
                  {isAdmin && order.agent?.name ? ` · ${order.agent.name}` : ""}
                </Text>
              </View>
              <Text style={styles.viewLink}>View</Text>
            </TouchableOpacity>
          ))
        )}
      </Sheet>

      <ReceiptModal
        visible={receiptVisible}
        order={selectedOrder}
        onClose={() => setReceiptVisible(false)}
      />
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
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  meta: {
    flex: 1,
    color: theme.colors.textMuted,
    fontWeight: "500",
    fontSize: 13,
  },
  notes: {
    marginTop: 12,
    padding: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: theme.radius.sm + 2,
    backgroundColor: theme.colors.surface,
  },
  actionText: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  historySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  historySummaryLabel: {
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.inverseMuted,
  },
  historySummaryValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: theme.colors.white,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyAmount: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },
  historyInfo: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontWeight: "500",
    fontSize: 12,
  },
  viewLink: {
    fontWeight: "700",
    color: theme.colors.text,
    textDecorationLine: "underline",
  },
});
