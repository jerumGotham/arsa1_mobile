import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Tabs } from "expo-router";
import {
  Home,
  ShoppingBag,
  ReceiptText,
  Users,
  BarChart3,
  Package,
  UserCircle2,
} from "lucide-react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();

  // `href: null` hides a tab. Agents get Home, Book, Orders, Customers, Account.
  const adminOnly = isAdmin ? {} : { href: null };

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.white,
        tabBarInactiveTintColor: "#6B6B6B",

        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: theme.colors.primary,
          borderTopWidth: 0,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Book",
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag color={color} size={size - 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color} size={size - 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size - 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          ...adminOnly,
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Package color={color} size={size - 2} />
          ),
        }}
      />

      {/* Not in the tab bar; opened from Orders / Account (admin only). */}
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size - 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <UserCircle2 color={color} size={size - 2} />
          ),
        }}
      />
    </Tabs>
  );
}
