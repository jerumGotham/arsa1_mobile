import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { BarChart3, ChevronRight, Receipt, Search } from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader, { IconButton } from "@/components/ScreenHeader";
import CategoryChips from "@/components/CategoryChips";
import ReceiptModal from "@/components/ReceiptModal";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getOrders, OrderFilters } from "@/services/orderApi";
import { getUsers } from "@/services/userApi";
import { errorMessage } from "@/services/api";
import { formatTime, localDateString, peso, totalQty } from "@/lib/format";

const RANGES = [
  { id: "today", name: "Today" },
  { id: "yesterday", name: "Yesterday" },
  { id: "7d", name: "Last 7 days" },
  { id: "30d", name: "Last 30 days" },
  { id: "all", name: "All" },
];

function rangeFilters(range: string): OrderFilters {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return localDateString(d);
  };

  switch (range) {
    case "today":
      return { date: daysAgo(0) };
    case "yesterday":
      return { date: daysAgo(1) };
    case "7d":
      return { from: daysAgo(6), to: daysAgo(0) };
    case "30d":
      return { from: daysAgo(29), to: daysAgo(0) };
    default:
      return {};
  }
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = localDateString();
  const yesterday = localDateString(new Date(Date.now() - 86400000));
  const key = localDateString(date);

  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrderHistoryScreen() {
  const { isAdmin } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [range, setRange] = useState("today");
  const [agentId, setAgentId] = useState("");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  async function loadOrders() {
    try {
      setError("");
      setVisibleCount(20);
      const data = await getOrders({
        ...rangeFilters(range),
        agentId: agentId || undefined,
      });
      setOrders(data);
    } catch (err) {
      setError(errorMessage(err, "Unable to load orders."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadAgents() {
    if (!isAdmin) return;
    try {
      setAgents(await getUsers());
    } catch (err) {
      console.log("Agents error:", err);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      loadAgents();
    }, [range, agentId]),
  );

  // The focus effect above reloads whenever the range or agent changes.
  function changeRange(value: string) {
    setLoading(true);
    setRange(value);
  }

  function changeAgent(value: string) {
    setLoading(true);
    setAgentId(value);
  }

  function openReceipt(order: any) {
    setSelectedOrder(order);
    setReceiptVisible(true);
  }

  const query = search.trim().toLowerCase();
  const filtered = query
    ? orders.filter(
        (order) =>
          order.customer?.name?.toLowerCase().includes(query) ||
          order.customer?.phone?.toLowerCase().includes(query),
      )
    : orders;

  const visible = filtered.slice(0, visibleCount);
  const total = filtered.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  // Group the visible orders by day, keeping newest first.
  const groups: { label: string; orders: any[] }[] = [];
  for (const order of visible) {
    const label = dayLabel(order.orderDate);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.orders.push(order);
    else groups.push({ label, orders: [order] });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScreenHeader
          eyebrow={isAdmin ? "All bookings" : "Your bookings"}
          title="Orders"
          right={
            isAdmin ? (
              <IconButton dark={false} onPress={() => router.push("/reports")}>
                <BarChart3 size={20} color={theme.colors.text} />
              </IconButton>
            ) : undefined
          }
        />

        <CategoryChips
          categories={RANGES}
          value={range}
          onChange={changeRange}
          showAll={false}
        />

        {isAdmin && agents.length ? (
          <CategoryChips
            categories={agents.map((agent) => ({
              id: agent.id,
              name: agent.name,
            }))}
            value={agentId}
            onChange={changeAgent}
          />
        ) : null}

        <AppInput
          placeholder="Search customer name or phone"
          value={search}
          onChangeText={setSearch}
          icon={<Search size={18} color={theme.colors.textMuted} />}
        />

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Orders</Text>
            <Text style={styles.summaryValue}>{filtered.length}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{peso(total)}</Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorBox} onPress={() => loadOrders()}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginVertical: 24 }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} color={theme.colors.textMuted} />}
            title="No orders found"
            message="Try a different date range or search."
          />
        ) : (
          groups.map((group) => (
            <View key={group.label} style={{ gap: 8 }}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.list}>
                {group.orders.map((order, index) => (
                  <TouchableOpacity
                    key={order.id}
                    activeOpacity={0.7}
                    onPress={() => openReceipt(order)}
                    style={[
                      styles.row,
                      index === group.orders.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customer} numberOfLines={1}>
                        {order.customer?.name || "Unknown Customer"}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {formatTime(order.orderDate)} · {order.items?.length || 0}{" "}
                        items · Qty {totalQty(order)}
                        {isAdmin && order.agent?.name
                          ? ` · ${order.agent.name}`
                          : ""}
                      </Text>
                    </View>
                    <Text style={styles.amount}>{peso(order.totalAmount)}</Text>
                    <ChevronRight size={16} color={theme.colors.textSubtle} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {!loading && visibleCount < filtered.length ? (
          <AppButton
            title={`Load more (${filtered.length - visibleCount} left)`}
            variant="ghost"
            onPress={() => setVisibleCount((count) => count + 20)}
          />
        ) : null}
      </ScrollView>

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
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
  },
  summaryLabel: {
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.inverseMuted,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: theme.colors.white,
  },
  errorBox: {
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: "600",
  },
  errorRetry: {
    marginTop: 4,
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  groupLabel: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
    marginTop: 6,
    marginLeft: 4,
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customer: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
});
