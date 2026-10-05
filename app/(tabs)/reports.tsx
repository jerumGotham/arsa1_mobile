import DateTimePicker from "@react-native-community/datetimepicker";
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { CalendarDays, FileSpreadsheet } from "lucide-react-native";

import { theme } from "@/constants/theme";
import StatCard from "@/components/StatCard";
import AppButton from "@/components/AppButton";
import ScreenHeader from "@/components/ScreenHeader";
import { Avatar } from "@/components/EmptyState";
import { getDashboardSummary } from "@/services/dashboardApi";
import { getExcelReportUrl } from "@/services/reportApi";
import { API_KEY, getAuthToken } from "@/services/api";
import { localDateString, peso } from "@/lib/format";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

export default function ReportsScreen() {
  const [summary, setSummary] = useState<any>({
    totalSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
  });

  const [selectedDate, setSelectedDate] = useState(localDateString());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

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
      if (!selectedDate) {
        Alert.alert("Required", "Please enter a report date.");
        return;
      }

      setDownloading(true);

      const url = getExcelReportUrl(selectedDate);
      const fileName = `tindahub-orders-${selectedDate}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          "x-api-key": API_KEY,
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

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

  const prettyDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    undefined,
    { weekday: "short", month: "long", day: "numeric", year: "numeric" },
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
        <ScreenHeader
          back
          eyebrow="Analytics"
          title="Reports"
          subtitle="Today’s sales and downloadable Excel report"
        />

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total Sales Today</Text>
          <Text style={styles.heroValue}>{peso(summary.totalSales)}</Text>
          <Text style={styles.heroSubtext}>Pull down to refresh</Text>
        </View>

        <View style={styles.row}>
          <StatCard
            label="Orders"
            value={String(summary.totalOrders)}
            subtext="recorded today"
          />
          <StatCard
            label="Items Sold"
            value={String(summary.totalItemsSold)}
            subtext="pieces today"
          />
        </View>

        {summary.byAgent?.length ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Sales by Agent</Text>
            {summary.byAgent.map((agent: any) => {
              const share = summary.totalSales
                ? agent.totalSales / summary.totalSales
                : 0;

              return (
                <View key={agent.agentId || "unassigned"} style={styles.agentRow}>
                  <Avatar name={agent.name} size={32} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.agentTop}>
                      <Text style={styles.agentName}>{agent.name}</Text>
                      <Text style={styles.agentAmount}>
                        {peso(agent.totalSales)}
                      </Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[styles.fill, { width: `${Math.round(share * 100)}%` }]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Excel Export</Text>
          <Text style={styles.panelSub}>
            Daily summary plus one sheet per customer, including who booked
            each order.
          </Text>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <CalendarDays size={18} color={theme.colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Report Date</Text>
              <Text style={styles.dateText}>{prettyDate}</Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                if (event.type === "dismissed") {
                  setShowDatePicker(false);
                  return;
                }

                if (date) {
                  setDateValue(date);
                  setSelectedDate(localDateString(date));
                }

                setShowDatePicker(false);
              }}
            />
          )}

          <AppButton
            title="Download Excel Report"
            onPress={handleDownload}
            loading={downloading}
            icon={<FileSpreadsheet size={18} color={theme.colors.white} />}
          />
        </View>
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadowStrong,
  },
  heroLabel: {
    ...theme.eyebrow,
    color: theme.colors.inverseMuted,
  },
  heroValue: {
    marginTop: 12,
    color: theme.colors.white,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  heroSubtext: {
    marginTop: 6,
    color: theme.colors.inverseMuted,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  panel: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 14,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  panelSub: {
    marginTop: -8,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  agentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  agentName: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  agentAmount: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  dateLabel: {
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  dateText: {
    marginTop: 2,
    fontWeight: "700",
    fontSize: 15,
    color: theme.colors.text,
  },
  changeText: {
    fontWeight: "700",
    color: theme.colors.text,
    textDecorationLine: "underline",
  },
});
