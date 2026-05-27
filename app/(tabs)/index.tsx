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

import { theme } from "@/constants/theme";
import StatCard from "@/components/StatCard";
import AppCard from "@/components/AppCard";
import { getDashboardSummary } from "@/services/dashboardApi";
import { getOrders } from "@/services/orderApi";

export default function DashboardScreen() {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(showMainLoader = true) {
    try {
      if (showMainLoader) setLoading(true);

      const summaryData = await getDashboardSummary();
      const orderData = await getOrders();

      setSummary(summaryData);
      setOrders(orderData.slice(0, 5));
    } catch (error) {
      console.log("Dashboard error:", error);
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
        <Text style={styles.logo}>ARSA 1</Text>
        <Text style={styles.subtitle}>Smart POS & Inventory</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Sales Today</Text>
          <Text style={styles.heroValue}>
            ₱{Number(summary.totalSales).toLocaleString()}
          </Text>
          <Text style={styles.heroSubtext}>Pull down to refresh records</Text>
        </View>

        <View style={styles.row}>
          <StatCard label="Orders" value={String(summary.totalOrders)} />
          <StatCard label="Items Sold" value={String(summary.totalItemsSold)} />
        </View>

        <Text style={styles.sectionTitle}>Recent Orders</Text>

        {orders.length === 0 ? (
          <AppCard>
            <Text style={styles.orderInfo}>No orders yet today.</Text>
          </AppCard>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.8}
              onPress={() => openCustomer(order)}
            >
              <AppCard>
                <Text style={styles.orderName}>
                  {order.customer?.name || "Unknown Customer"}
                </Text>
                <Text style={styles.orderInfo}>
                  {order.items?.length || 0} items • ₱
                  {Number(order.totalAmount).toLocaleString()}
                </Text>
              </AppCard>
            </TouchableOpacity>
          ))
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
    paddingTop: 20,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  logo: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.primaryDark,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
  heroLabel: {
    color: "#DCFCE7",
    fontSize: theme.fontSize.sm,
    fontWeight: "700",
  },
  heroValue: {
    marginTop: 10,
    color: theme.colors.white,
    fontSize: 34,
    fontWeight: "900",
  },
  heroSubtext: {
    marginTop: 8,
    color: "#BBF7D0",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
  },
  orderName: {
    fontSize: theme.fontSize.md,
    fontWeight: "800",
    color: theme.colors.blue,
    textDecorationLine: "underline",
  },
  orderInfo: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  openText: {
    marginTop: 6,
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 12,
  },
});
