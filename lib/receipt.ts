import { Alert, PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic from "react-native-bluetooth-classic";
import * as MediaLibrary from "expo-media-library";

import { brand } from "@/constants/brand";
import { totalQty } from "./format";

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

export function buildReceiptText(order: any) {
  const money = (value: any) => Number(value || 0).toFixed(0);
  const items = order.items || [];

  let receipt = "";

  receipt += `        ${brand.printHeader}\n`;
  receipt += "      ORDER RECEIPT\n";
  receipt += "--------------------------------\n";
  receipt += `Contact Person: ${brand.contactPerson}\n`;
  receipt += `Contact Number: ${brand.contactNumber}\n`;
  receipt += `Customer: ${order.customer?.name || "CUSTOMER"}\n`;
  receipt += `Address : ${order.customer?.address || "N/A"}\n`;
  if (order.agent?.name) {
    receipt += `Agent   : ${order.agent.name}\n`;
  }
  receipt += "--------------------------------\n";
  receipt += "ITEM              QTY   TOTAL\n";
  receipt += "--------------------------------\n";

  for (const item of items) {
    const name = String(item.product?.name || item.name || "Item").slice(0, 16);
    const qty = String(item.quantity || 0).padStart(3, " ");
    const subtotal = money(item.subtotal).padStart(7, " ");

    receipt += `${name.padEnd(16, " ")} ${qty} ${subtotal}\n`;
  }

  receipt += "--------------------------------\n";
  receipt += `TOTAL QTY: ${totalQty(order)}\n`;
  receipt += `TOTAL: PHP ${money(order.totalAmount)}\n`;
  receipt += "--------------------------------\n";
  receipt += "        Thank you!\n\n\n";

  return receipt;
}

export async function printReceipt(order: any) {
  try {
    if (!order) {
      Alert.alert("No receipt", "No order to print.");
      return;
    }

    const allowed = await requestBluetoothPermissions();

    if (!allowed) {
      Alert.alert("Permission Required", "Please allow Bluetooth permission.");
      return;
    }

    const device = await RNBluetoothClassic.connectToDevice(
      brand.printerAddress,
    );

    if (!device) {
      Alert.alert("Printer Error", "Cannot connect to printer.");
      return;
    }

    await device.write(buildReceiptText(order));

    Alert.alert("Success", "Receipt printed.");
  } catch (error: any) {
    console.log("Print receipt error:", error);
    Alert.alert(
      "Print Error",
      error?.message || "Failed to connect or print receipt.",
    );
  }
}

// `shotRef` is a react-native-view-shot ref.
export async function saveReceiptImage(shotRef: any) {
  try {
    if (!shotRef?.current) {
      Alert.alert("No receipt", "No receipt available to save.");
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow photo access.");
      return;
    }

    const uri = await shotRef.current.capture();
    await MediaLibrary.saveToLibraryAsync(uri);

    Alert.alert("Saved", "Receipt saved to gallery.");
  } catch (error) {
    console.log("Save receipt image error:", error);
    Alert.alert("Error", "Failed to save receipt image.");
  }
}
