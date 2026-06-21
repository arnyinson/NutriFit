import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.inner}>
          {/* Logo */}
          <Text style={styles.logo}>🥗 NutriFit</Text>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Log in to continue your fitness and meal plan journey
          </Text>

          {/* Username */}
          <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/dashboard')}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <Text style={[styles.signup, { color: colors.textMuted }]}>
            {"Don't have an account? "}
            <Text
              style={[styles.signupLink, { color: colors.primary }]}
              onPress={() => router.replace('/register')}
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
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 24,
  },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  eyeIcon: { fontSize: 18, padding: 4 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 16 },
  forgot: { fontWeight: '500', fontSize: 13 },
  button: {
    width: '100%', backgroundColor: '#4CAF50',
    padding: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  signup: { fontSize: 13 },
  signupLink: { fontWeight: 'bold' },
});