import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ArrowUpRight, Plus, Receipt } from "lucide-react-native";

import { theme } from "@/constants/theme";
import StatCard from "@/components/StatCard";
import EmptyState, { Avatar } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getDashboardSummary } from "@/services/dashboardApi";
import { getOrders } from "@/services/orderApi";
import { errorMessage } from "@/services/api";
import { formatDateTime, greeting, peso } from "@/lib/format";

export default function DashboardScreen() {
  const { user, isAdmin } = useAuth();

  const [summary, setSummary] = useState<any>({
    totalSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showMainLoader = true) {
    try {
      if (showMainLoader) setLoading(true);
      setError("");

      const [summaryData, orderData] = await Promise.all([
        getDashboardSummary(),
        getOrders(),
      ]);

      setSummary(summaryData);
      setOrders(orderData.slice(0, 6));
    } catch (err) {
      console.log("Dashboard error:", err);
      setError(errorMessage(err, "Unable to load dashboard."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard(false);
  }

  function openCustomer(order: any) {
    router.push({
      pathname: "/customers",
      params: {
        customerId: order.customer?.id,
        customerName: order.customer?.name,
      },
    });
  }

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.hello}>
              {greeting()}, {firstName}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/account")}>
            <Avatar name={user?.name} />
          </TouchableOpacity>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorBox} onPress={() => loadDashboard()}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>
              {isAdmin ? "Total Sales Today" : "Your Sales Today"}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {isAdmin ? "Admin" : "Agent"}
              </Text>
            </View>
          </View>

          <Text style={styles.heroValue}>{peso(summary.totalSales)}</Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroStatValue}>{summary.totalOrders}</Text>
              <Text style={styles.heroStatLabel}>Orders</Text>
            </View>
            <View>
              <Text style={styles.heroStatValue}>{summary.totalItemsSold}</Text>
              <Text style={styles.heroStatLabel}>Items Sold</Text>
            </View>
            <View>
              <Text style={styles.heroStatValue}>
                {summary.totalOrders
                  ? peso(summary.totalSales / summary.totalOrders)
                  : "—"}
              </Text>
              <Text style={styles.heroStatLabel}>Avg. Order</Text>
            </View>
          </View>
        </View>

        {!isAdmin ? (
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.85}
            onPress={() => router.push("/orders")}
          >
            <View style={styles.bookIcon}>
              <Plus size={20} color={theme.colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>Book New Order</Text>
              <Text style={styles.bookSubtitle}>
                Pick a customer, add products, print receipt
              </Text>
            </View>
            <ArrowUpRight size={20} color={theme.colors.text} />
          </TouchableOpacity>
        ) : null}

        {isAdmin && summary.byAgent?.length ? (
          <>
            <Text style={styles.sectionTitle}>Agents Today</Text>
            <View style={styles.list}>
              {summary.byAgent.map((agent: any, index: number) => (
                <View
                  key={agent.agentId || "unassigned"}
                  style={[
                    styles.listRow,
                    index === summary.byAgent.length - 1 && styles.listRowLast,
                  ]}
                >
                  <Text style={styles.rank}>{index + 1}</Text>
                  <Avatar name={agent.name} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{agent.name}</Text>
                    <Text style={styles.rowSub}>
                      {agent.totalOrders} order
                      {agent.totalOrders === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>{peso(agent.totalSales)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {isAdmin ? (
          <View style={styles.row}>
            <StatCard
              label="Orders"
              value={String(summary.totalOrders)}
              subtext="booked today"
            />
            <StatCard
              label="Items"
              value={String(summary.totalItemsSold)}
              subtext="pieces sold"
            />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          {isAdmin ? "Recent Orders" : "Your Recent Orders"}
        </Text>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} color={theme.colors.textMuted} />}
            title="No orders yet"
            message="New bookings will show up here."
          />
        ) : (
          <View style={styles.list}>
            {orders.map((order, index) => (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.7}
                onPress={() => openCustomer(order)}
                style={[
                  styles.listRow,
                  index === orders.length - 1 && styles.listRowLast,
                ]}
              >
                <Avatar name={order.customer?.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {order.customer?.name || "Unknown Customer"}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {formatDateTime(order.orderDate)} · {order.items?.length || 0}{" "}
                    items
                    {isAdmin && order.agent?.name
                      ? ` · ${order.agent.name}`
                      : ""}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>{peso(order.totalAmount)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  date: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
  },
  hello: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    color: theme.colors.text,
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
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadowStrong,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    ...theme.eyebrow,
    color: theme.colors.inverseMuted,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  rolePillText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  heroValue: {
    marginTop: 14,
    color: theme.colors.white,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.6,
  },
  heroDivider: {
    height: 1,
    backgroundColor: theme.colors.inverseBorder,
    marginVertical: 18,
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroStatValue: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  heroStatLabel: {
    marginTop: 2,
    color: theme.colors.inverseMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bookIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  bookSubtitle: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: theme.colors.text,
  },
  list: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  rank: {
    width: 16,
    textAlign: "center",
    color: theme.colors.textSubtle,
    fontWeight: "800",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
});
