import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import {
  ChevronRight,
  KeyRound,
  LogOut,
  Tags,
  UsersRound,
} from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import { Avatar } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/services/authApi";
import { errorMessage } from "@/services/api";

export default function AccountScreen() {
  const { user, isAdmin, signOut } = useAuth();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  function confirmSignOut() {
    Alert.alert("Sign Out", "Do you want to sign out of this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  async function handleChangePassword() {
    if (form.next.length < 6) {
      Alert.alert("Too short", "New password must be at least 6 characters.");
      return;
    }

    if (form.next !== form.confirm) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await changePassword(form.current, form.next);
      setPasswordVisible(false);
      setForm({ current: "", next: "", confirm: "" });
      Toast.show({ type: "success", text1: "Password updated" });
    } catch (error) {
      Alert.alert("Error", errorMessage(error, "Unable to change password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow="Profile" title="Account" />

        <View style={styles.profile}>
          <Avatar name={user?.name} size={60} inverse />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              {isAdmin ? "Admin" : "Agent"}
            </Text>
          </View>
        </View>

        {isAdmin ? (
          <>
            <Text style={styles.sectionLabel}>Administration</Text>
            <View style={styles.menu}>
              <MenuRow
                icon={<UsersRound size={18} color={theme.colors.text} />}
                title="Team & Agents"
                subtitle="Create logins, reset passwords, disable access"
                onPress={() => router.push("/team")}
              />
              <MenuRow
                icon={<Tags size={18} color={theme.colors.text} />}
                title="Product Categories"
                subtitle="Plastic, Styro, Paper and more"
                onPress={() => router.push("/categories")}
                last
              />
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Security</Text>
        <View style={styles.menu}>
          <MenuRow
            icon={<KeyRound size={18} color={theme.colors.text} />}
            title="Change Password"
            onPress={() => setPasswordVisible(true)}
            last
          />
        </View>

        <AppButton
          title="Sign Out"
          variant="outline"
          onPress={confirmSignOut}
          icon={<LogOut size={18} color={theme.colors.text} />}
          style={{ marginTop: 8 }}
        />

        <Text style={styles.version}>
          TindaHub · v{Constants.expoConfig?.version || "1.0.0"}
        </Text>
      </ScrollView>

      <Sheet
        visible={passwordVisible}
        onClose={() => setPasswordVisible(false)}
        title="Change Password"
        footer={
          <AppButton
            title="Update Password"
            onPress={handleChangePassword}
            loading={saving}
            style={{ flex: 1 }}
          />
        }
      >
        <AppInput
          label="Current Password"
          secureTextEntry
          autoCapitalize="none"
          value={form.current}
          onChangeText={(text) => setForm({ ...form, current: text })}
        />
        <AppInput
          label="New Password"
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 6 characters"
          value={form.next}
          onChangeText={(text) => setForm({ ...form, next: text })}
        />
        <AppInput
          label="Confirm New Password"
          secureTextEntry
          autoCapitalize="none"
          value={form.confirm}
          onChangeText={(text) => setForm({ ...form, confirm: text })}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.menuRow, last && { borderBottomWidth: 0 }]}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color={theme.colors.textSubtle} />
    </TouchableOpacity>
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
    gap: 14,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    ...theme.shadowStrong,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: theme.colors.white,
  },
  username: {
    marginTop: 2,
    color: theme.colors.inverseMuted,
    fontWeight: "500",
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: theme.colors.text,
  },
  sectionLabel: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
    marginTop: 8,
    marginLeft: 4,
  },
  menu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  menuSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  version: {
    marginTop: 8,
    textAlign: "center",
    color: theme.colors.textSubtle,
    fontSize: 12,
  },
});
