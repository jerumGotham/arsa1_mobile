import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { theme } from "@/constants/theme";
import StatCard from "@/components/StatCard";
import AppCard from "@/components/AppCard";
import { getDashboardSummary } from "@/services/dashboardApi";
import { getExcelReportUrl } from "@/services/reportApi";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

export default function ReportsScreen() {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function loadReportSummary(showMainLoader = true) {
    try {
      if (showMainLoader) setLoading(true);

      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.log("Reports error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadReportSummary(false);
  }

  async function handleDownload() {
    try {
      setDownloading(true);

      const now = new Date();

      const today =
        now.toISOString().split("T")[0] +
        "-" +
        now.getHours() +
        "-" +
        now.getMinutes() +
        "-" +
        now.getSeconds();
      const url = getExcelReportUrl();

      const fileName = `arsa1-orders-${today}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      console.log("Downloading from:", url);
      console.log("Saving to:", fileUri);

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      Toast.show({
        type: "success",
        text1: "Excel Downloaded",
        text2: fileName,
        position: "top",
      });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Save or share Excel report",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        Alert.alert("Downloaded", `File saved to:\n${downloadResult.uri}`);
      }
    } catch (error: any) {
      console.log("Download error:", error);

      Alert.alert(
        "Download Error",
        error?.message || "Unable to download report.",
      );
    } finally {
      setDownloading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadReportSummary(false);
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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>
              Today’s sales and downloadable Excel report
            </Text>
          </View>
        </View>

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

        <TouchableOpacity
          style={[
            styles.downloadButton,
            downloading && styles.downloadButtonDisabled,
          ]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.downloadButtonText}>Download Excel Report</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Today Summary</Text>

        <AppCard>
          <Text style={styles.name}>Total Items Sold</Text>
          <Text style={styles.info}>
            {summary.totalItemsSold} items sold today
          </Text>
        </AppCard>

        <AppCard>
          <Text style={styles.name}>Total Orders</Text>
          <Text style={styles.info}>
            {summary.totalOrders} order(s) recorded today
          </Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
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
  downloadButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: theme.colors.white,
    fontWeight: "900",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: "900",
    color: theme.colors.text,
  },
  info: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
});
