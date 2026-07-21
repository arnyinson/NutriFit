import { useRouter } from "expo-router";
import { ChevronLeft, Mail } from "lucide-react-native";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    username: string;
    tempPassword: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setResult({
        username: response.data.username,
        tempPassword: response.data.tempPassword,
      });
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
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <Mail size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Forgot Password?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter the email address linked to your account. We will generate a
            temporary password for you.
          </Text>

          {!result ? (
            <>
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
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Generate Temporary Password
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={[
                styles.resultCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>
                Username
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {result.username}
              </Text>

              <Text
                style={[
                  styles.resultLabel,
                  { color: colors.textMuted, marginTop: 16 },
                ]}
              >
                Temporary Password
              </Text>
              <Text style={[styles.resultValue, { color: colors.primary }]}>
                {result.tempPassword}
              </Text>

              <Text style={[styles.resultNote, { color: colors.textMuted }]}>
                Please log in using this temporary password. You can change it
                anytime in your Profile settings.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace("/login")}
              >
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
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
  resultCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  resultLabel: { fontSize: 12, fontWeight: "600" },
  resultValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  resultNote: { fontSize: 12, lineHeight: 18, marginTop: 16, marginBottom: 16 },
});
