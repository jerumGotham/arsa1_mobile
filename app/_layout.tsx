import { theme } from "@/constants/theme";
import { brand } from "@/constants/brand";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Toast, { ToastConfigParams } from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RootNavigator() {
  const { user, ready, isAdmin } = useAuth();

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>{brand.appName}</Text>
        <ActivityIndicator color={theme.colors.white} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* Signed-in users only */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />

        <Stack.Protected guard={isAdmin}>
          <Stack.Screen name="team" />
          <Stack.Screen name="categories" />
        </Stack.Protected>
      </Stack.Protected>

      {/* Signed-out users only */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

function ToastView({
  text1,
  text2,
  dark,
}: ToastConfigParams<any> & { dark: boolean }) {
  return (
    <View style={[styles.toast, !dark && styles.toastLight]}>
      <Text style={[styles.toastTitle, !dark && styles.toastTitleLight]}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={[styles.toastText, !dark && styles.toastTextLight]}>
          {text2}
        </Text>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>

      <Toast
        position="top"
        config={{
          success: (props) => <ToastView {...props} dark />,
          info: (props) => <ToastView {...props} dark />,
          error: (props) => <ToastView {...props} dark={false} />,
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  splashLogo: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.5,
    color: theme.colors.white,
  },
  toast: {
    width: "92%",
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: theme.radius.lg,
    alignSelf: "center",
    ...theme.shadowStrong,
  },
  toastLight: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  toastTitle: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  toastTitleLight: {
    color: theme.colors.danger,
  },
  toastText: {
    color: theme.colors.inverseMuted,
    marginTop: 3,
    fontWeight: "500",
  },
  toastTextLight: {
    color: theme.colors.text,
  },
});
