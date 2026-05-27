import { theme } from "@/constants/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />

      <Stack screenOptions={{ headerShown: false }} />

      <Toast
        position="top"
        config={{
          success: (props) => (
            <View
              style={{
                width: "92%",
                backgroundColor: "#166534",
                padding: 16,
                borderRadius: 18,
                alignSelf: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                {props.text1}
              </Text>

              <Text
                style={{
                  color: "#DCFCE7",
                  marginTop: 4,
                  fontWeight: "600",
                }}
              >
                {props.text2}
              </Text>
            </View>
          ),

          error: (props) => (
            <View
              style={{
                width: "92%",
                backgroundColor: "#991B1B",
                padding: 16,
                borderRadius: 18,
                alignSelf: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                {props.text1}
              </Text>

              <Text
                style={{
                  color: "#FECACA",
                  marginTop: 4,
                  fontWeight: "600",
                }}
              >
                {props.text2}
              </Text>
            </View>
          ),
        }}
      />
    </SafeAreaProvider>
  );
}
