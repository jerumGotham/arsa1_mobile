import { useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { Download, Printer, X } from "lucide-react-native";

import { theme } from "@/constants/theme";
import { brand } from "@/constants/brand";
import { formatDateTime, peso, totalQty } from "@/lib/format";
import { printReceipt, saveReceiptImage } from "@/lib/receipt";

type Props = {
  visible: boolean;
  order: any;
  onClose: () => void;
};

export default function ReceiptModal({ visible, order, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const shotRef = useRef<any>(null);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          { paddingTop: 18 + insets.top, paddingBottom: 18 + insets.bottom },
        ]}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Order Receipt</Text>
              <Text style={styles.title}>
                {order?.items?.length || 0} item{order?.items?.length === 1 ? "" : "s"}
              </Text>
            </View>

            <TouchableOpacity style={styles.close} onPress={onClose} hitSlop={8}>
              <X size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {order ? <ReceiptBody order={order} scrollItems /> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.action, styles.actionLight]}
              onPress={() => saveReceiptImage(shotRef)}
            >
              <Download size={16} color={theme.colors.text} />
              <Text style={styles.actionLightText}>Save Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.action, styles.actionDark]}
              onPress={() => printReceipt(order)}
            >
              <Printer size={16} color={theme.colors.white} />
              <Text style={styles.actionDarkText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Full-length copy rendered off-screen so long orders are not cut
            off when saved as an image. */}
        <View style={styles.offscreen} pointerEvents="none">
          {order ? (
            <ViewShot
              ref={shotRef}
              options={{ format: "png", quality: 1, result: "tmpfile" }}
            >
              <View collapsable={false} style={{ width: 420 }}>
                <ReceiptBody order={order} />
              </View>
            </ViewShot>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function ReceiptBody({
  order,
  scrollItems = false,
}: {
  order: any;
  scrollItems?: boolean;
}) {
  const rows = (order.items || []).map((item: any, index: number) => (
    <View key={item.id || `${item.productId}-${index}`} style={styles.itemRow}>
      <Text style={[styles.cell, styles.cellName]}>
        {item.product?.name || item.name}
      </Text>
      <Text style={styles.cell}>{item.quantity}</Text>
      <Text style={styles.cell}>{peso(item.price)}</Text>
      <Text style={[styles.cell, styles.cellTotal]}>
        {peso(item.subtotal || item.quantity * item.price)}
      </Text>
    </View>
  ));

  return (
    <View style={styles.receipt}>
      <View style={styles.receiptTop}>
        <Text style={styles.storeName}>{brand.receiptStoreName}</Text>
        <Text style={styles.customerName}>
          {(order.customer?.name || "CUSTOMER").toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <InfoRow
          label="Date"
          value={formatDateTime(order.deliveryDate || order.orderDate)}
        />
        <InfoRow
          label="Contact"
          value={order.customer?.phone || order.customer?.contactNumber || "N/A"}
        />
        <InfoRow label="Address" value={order.customer?.address || "N/A"} />
        {order.agent?.name ? (
          <InfoRow label="Booked by" value={order.agent.name} />
        ) : null}
      </View>

      <View style={styles.headRow}>
        <Text style={[styles.headCell, styles.cellName]}>Item</Text>
        <Text style={styles.headCell}>Qty</Text>
        <Text style={styles.headCell}>Price</Text>
        <Text style={[styles.headCell, styles.cellTotal]}>Total</Text>
      </View>

      {scrollItems ? (
        <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled>
          {rows}
        </ScrollView>
      ) : (
        rows
      )}

      <View style={styles.totalBar}>
        <View>
          <Text style={styles.totalLabel}>Total Qty</Text>
          <Text style={styles.totalQty}>{totalQty(order)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.totalLabel}>Amount Due</Text>
          <Text style={styles.totalAmount}>{peso(order.totalAmount)}</Text>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "100%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    padding: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  eyebrow: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
  },
  title: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: theme.colors.text,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  receipt: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  receiptTop: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primary,
  },
  storeName: {
    ...theme.eyebrow,
    letterSpacing: 4,
    color: theme.colors.inverseMuted,
  },
  customerName: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.white,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  info: {
    padding: 14,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
  },
  infoLabel: {
    width: 74,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
  },
  headRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headCell: {
    flex: 1,
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  cellName: {
    flex: 2.1,
    textAlign: "left",
  },
  cellTotal: {
    textAlign: "right",
    fontWeight: "800",
  },
  totalBar: {
    margin: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalLabel: {
    ...theme.eyebrow,
    fontSize: 10,
    color: theme.colors.inverseMuted,
  },
  totalQty: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.white,
  },
  totalAmount: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: theme.colors.white,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  action: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionLight: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  actionDark: {
    backgroundColor: theme.colors.primary,
  },
  actionLightText: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  actionDarkText: {
    fontWeight: "700",
    color: theme.colors.white,
  },
  offscreen: {
    position: "absolute",
    left: -10000,
    top: 0,
    width: 420,
  },
});
