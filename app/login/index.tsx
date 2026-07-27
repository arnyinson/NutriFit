import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, User } from "lucide-react-native";
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
import Logo from "../../components/Logo";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { token, user } = response.data;

      // Save token and user info to device storage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      router.replace("/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        "Unable to connect to server. Please check your connection.";
      Alert.alert("Login Failed", message);
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
        <View style={styles.inner}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Logo size={56} />
            <Text style={styles.logo}>NutriFit</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome!!!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Log in to continue your fitness and meal plan journey
          </Text>

          {/* Username */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <User size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password */}
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
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotRow} onPress={() => router.push("/forgot-password" as any)}>
            <Text style={[styles.forgot, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up */}
          <Text style={[styles.signup, { color: colors.textMuted }]}>
            {"Don't have an account? "}
            <Text
              style={[styles.signupLink, { color: colors.primary }]}
              onPress={() => router.replace("/register")}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  logo: { fontSize: 32, fontWeight: "bold", color: "#4CAF50" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: "center", marginBottom: 24 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  forgotRow: { alignSelf: "flex-end", marginBottom: 16 },
  forgot: { fontWeight: "500", fontSize: 13 },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  signup: { fontSize: 13 },
  signupLink: { fontWeight: "bold" },
});
