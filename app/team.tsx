import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { ChevronRight, Plus, UsersRound } from "lucide-react-native";

import { theme } from "@/constants/theme";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import ScreenHeader, { IconButton } from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState, { Avatar } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { createUser, getUsers, updateUser } from "@/services/userApi";
import { errorMessage } from "@/services/api";

type Role = "ADMIN" | "AGENT";

const emptyForm = {
  name: "",
  username: "",
  password: "",
  role: "AGENT" as Role,
  active: true,
};

export default function TeamScreen() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  async function loadUsers() {
    try {
      setUsers(await getUsers());
    } catch (error) {
      Alert.alert("Error", errorMessage(error, "Unable to load team."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, []),
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setSheetVisible(true);
  }

  function openEdit(user: any) {
    setEditing(user);
    setForm({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      active: user.active,
    });
    setSheetVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Name is required.");
      return;
    }

    if (!editing && !form.username.trim()) {
      Alert.alert("Required", "Username is required.");
      return;
    }

    if ((!editing || form.password) && form.password.length < 6) {
      Alert.alert("Password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await updateUser(editing.id, {
          name: form.name,
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        });
        Toast.show({ type: "success", text1: "Account updated", text2: form.name });
      } else {
        await createUser({
          name: form.name,
          username: form.username,
          password: form.password,
          role: form.role,
        });
        Toast.show({
          type: "success",
          text1: "Account created",
          text2: `${form.name} can now sign in as @${form.username.trim().toLowerCase()}`,
        });
      }

      setSheetVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert("Error", errorMessage(error, "Unable to save account."));
    } finally {
      setSaving(false);
    }
  }

  const isSelf = editing?.id === me?.id;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <ScreenHeader
          back
          eyebrow="Administration"
          title="Team"
          subtitle="Each agent signs in with their own account."
          right={
            <IconButton onPress={openAdd}>
              <Plus size={22} color={theme.colors.white} />
            </IconButton>
          }
        />

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={22} color={theme.colors.textMuted} />}
            title="No accounts yet"
          />
        ) : (
          <View style={styles.list}>
            {users.map((user, index) => (
              <TouchableOpacity
                key={user.id}
                activeOpacity={0.7}
                onPress={() => openEdit(user)}
                style={[
                  styles.row,
                  index === users.length - 1 && { borderBottomWidth: 0 },
                  !user.active && { opacity: 0.45 },
                ]}
              >
                <Avatar name={user.name} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {user.name}
                    {user.id === me?.id ? "  (you)" : ""}
                  </Text>
                  <Text style={styles.meta}>
                    @{user.username} · {user._count?.orders || 0} orders
                    {!user.active ? " · Disabled" : ""}
                  </Text>
                </View>
                <Text
                  style={[styles.role, user.role === "ADMIN" && styles.roleAdmin]}
                >
                  {user.role === "ADMIN" ? "Admin" : "Agent"}
                </Text>
                <ChevronRight size={18} color={theme.colors.textSubtle} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={editing ? "Edit Account" : "New Account"}
        subtitle={editing ? `@${editing.username}` : "Login for an agent or admin"}
        footer={
          <AppButton
            title={editing ? "Save Changes" : "Create Account"}
            onPress={handleSave}
            loading={saving}
            style={{ flex: 1 }}
          />
        }
      >
        <AppInput
          label="Full Name"
          placeholder="e.g. Juan Dela Cruz"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />

        {!editing ? (
          <AppInput
            label="Username"
            placeholder="e.g. juan"
            autoCapitalize="none"
            autoCorrect={false}
            value={form.username}
            onChangeText={(text) =>
              setForm({ ...form, username: text.replace(/\s/g, "") })
            }
          />
        ) : null}

        <AppInput
          label={editing ? "Reset Password" : "Password"}
          placeholder={editing ? "Leave blank to keep current" : "At least 6 characters"}
          autoCapitalize="none"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
        />

        <View>
          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.segment}>
            {(["AGENT", "ADMIN"] as Role[]).map((role) => {
              const active = form.role === role;
              return (
                <TouchableOpacity
                  key={role}
                  disabled={isSelf}
                  style={[styles.segmentItem, active && styles.segmentActive]}
                  onPress={() => setForm({ ...form, role })}
                >
                  <Text
                    style={[styles.segmentText, active && styles.segmentTextActive]}
                  >
                    {role === "AGENT" ? "Agent" : "Admin"}
                  </Text>
                  <Text
                    style={[styles.segmentHint, active && styles.segmentHintActive]}
                  >
                    {role === "AGENT" ? "Booking only" : "Full access"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {editing && !isSelf ? (
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Account active</Text>
              <Text style={styles.switchSub}>
                Disabled accounts are signed out and cannot log in.
              </Text>
            </View>
            <Switch
              value={form.active}
              onValueChange={(active) => setForm({ ...form, active })}
              trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
              thumbColor={theme.colors.white}
            />
          </View>
        ) : null}
      </Sheet>
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
    gap: 16,
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
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  role: {
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  roleAdmin: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    color: theme.colors.white,
  },
  fieldLabel: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  segment: {
    flexDirection: "row",
    gap: 10,
  },
  segmentItem: {
    flex: 1,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  segmentText: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  segmentHint: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  segmentHintActive: {
    color: theme.colors.inverseMuted,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  switchTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  switchSub: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
