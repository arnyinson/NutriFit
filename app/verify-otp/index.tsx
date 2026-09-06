import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/verify-registration-otp", {
        email,
        otp,
      });

      const { token, user } = response.data;
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      Alert.alert("Success", "Your email has been verified!", [
        { text: "OK", onPress: () => router.replace("/dashboard") },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.error || "Something went wrong. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email, purpose: "registration" });
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email.",
      );
    } catch (err: any) {
      const message =
        err.response?.data?.error || "Unable to resend code. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <ShieldCheck size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Verify Your Email
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            We sent a 6-digit verification code to{"\n"}
            <Text style={{ fontWeight: "700" }}>{email}</Text>
          </Text>

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  textAlign: "center",
                  letterSpacing: 8,
                  fontSize: 20,
                },
              ]}
              placeholder="------"
              placeholderTextColor={colors.textMuted}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="numeric"
              maxLength={6}
              editable={!loading}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
            style={styles.resendBtn}
            hitSlop={HIT_SLOP}
          >
            <Text style={[styles.resendText, { color: colors.primary }]}>
              {resending ? "Sending..." : "Didn't get the code? Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16 },
  inner: { flex: 1, alignItems: "center", padding: 24, paddingTop: 20 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resendBtn: { marginTop: 16, padding: 8 },
  resendText: { fontSize: 13, fontWeight: "600" },
});
