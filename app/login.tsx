import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff, Lock, User } from "lucide-react-native";

import { theme } from "@/constants/theme";
import { brand } from "@/constants/brand";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/services/api";

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signIn(username, password);
      // The root layout swaps to the app once `user` is set.
    } catch (err) {
      setError(errorMessage(err, "Unable to sign in."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <SafeAreaView edges={["top"]} style={styles.hero}>
            <View style={styles.mark}>
              <Text style={styles.markText}>TH</Text>
            </View>
            <Text style={styles.logo}>{brand.appName}</Text>
            <Text style={styles.tagline}>{brand.tagline}</Text>
          </SafeAreaView>

          <SafeAreaView edges={["bottom"]} style={styles.panel}>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>Sign in to continue</Text>

            <View style={styles.form}>
              <AppInput
                label="Username"
                placeholder="e.g. juan"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                icon={<User size={18} color={theme.colors.textMuted} />}
                returnKeyType="next"
              />

              <AppInput
                label="Password"
                placeholder="Your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                icon={<Lock size={18} color={theme.colors.textMuted} />}
                right={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={theme.colors.textMuted} />
                    ) : (
                      <Eye size={18} color={theme.colors.textMuted} />
                    )}
                  </TouchableOpacity>
                }
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <AppButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={{ marginTop: 6 }}
              />
            </View>

            <Text style={styles.footnote}>
              No account yet? Ask your administrator to create one for you.
            </Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  hero: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  markText: {
    color: theme.colors.white,
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1,
  },
  logo: {
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
    color: theme.colors.white,
  },
  tagline: {
    marginTop: 6,
    ...theme.eyebrow,
    fontSize: 12,
    color: theme.colors.inverseMuted,
  },
  panel: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 32,
    paddingBottom: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.eyebrow,
    color: theme.colors.textMuted,
  },
  title: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: theme.colors.text,
  },
  form: {
    marginTop: 24,
    gap: 16,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: "600",
  },
  footnote: {
    marginTop: 24,
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
