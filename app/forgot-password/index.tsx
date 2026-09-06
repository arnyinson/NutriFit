import { useRouter } from "expo-router";
import { ChevronLeft, Lock, Mail } from "lucide-react-native";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep("reset");
      Alert.alert(
        "Code Sent",
        "A verification code has been sent to your email.",
      );
    } catch (err: any) {
      const message =
        err.response?.data?.error || "Something went wrong. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email, purpose: "forgot_password" });
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

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        new_password: newPassword,
      });
      Alert.alert("Success", "Your password has been reset successfully!", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.error || "Something went wrong. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
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
          <TouchableOpacity
            onPress={() =>
              step === "reset" ? setStep("email") : router.back()
            }
            hitSlop={HIT_SLOP}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            {step === "email" ? (
              <Mail size={32} color={colors.primary} />
            ) : (
              <Lock size={32} color={colors.primary} />
            )}
          </View>

          {step === "email" ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Forgot Password?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Enter the email address linked to your account. We will send you
                a verification code.
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
                <Mail size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Enter Verification Code
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                We sent a 6-digit code to {email}. Enter it below along with
                your new password.
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
                  onChangeText={(v) =>
                    setOtp(v.replace(/[^0-9]/g, "").slice(0, 6))
                  }
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Lock size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="New password"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Lock size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resending}
                style={styles.resendBtn}
                hitSlop={HIT_SLOP}
              >
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  {resending ? "Sending..." : "Didn't get the code? Resend"}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
