import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [dietaryGoal, setDietaryGoal] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const allergenList = ['Eggs', 'Peanuts', 'Dairy', 'Shellfish', 'Fish', 'Soy'];

  const toggleAllergen = (item: string) => {
    setAllergens(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleRegister = () => {
    if (!email || !username || !password || !confirmPassword || !birthday || !height || !weight || !activityLevel || !dietaryGoal) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms and Privacy Policy.');
      return;
    }
    Alert.alert('Success', 'Account created successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.logo}>🥗 NutriFit</Text>
        <Text style={[styles.title, { color: colors.text }]}>Create Your Account</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Join NutriFit and get your personalized meal and workout plan
        </Text>

        {/* Email */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Username */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Username"
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
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Birthday */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Text style={styles.inputIcon}>📅</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Birthday (MM/DD/YYYY)"
            placeholderTextColor={colors.textMuted}
            value={birthday}
            onChangeText={setBirthday}
            keyboardType="numeric"
          />
        </View>

        {/* Sex Toggle */}
        <View style={styles.sexRow}>
          <TouchableOpacity
            style={[styles.sexBtn, { borderColor: colors.inputBorder, backgroundColor: colors.input }, sex === 'Male' && styles.sexBtnActive]}
            onPress={() => setSex('Male')}
          >
            <Text style={[styles.sexText, { color: colors.textSecondary }, sex === 'Male' && styles.sexTextActive]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sexBtn, { borderColor: colors.inputBorder, backgroundColor: colors.input }, sex === 'Female' && styles.sexBtnActivePink]}
            onPress={() => setSex('Female')}
          >
            <Text style={[styles.sexText, { color: colors.textSecondary }, sex === 'Female' && styles.sexTextActive]}>Female</Text>
          </TouchableOpacity>
        </View>

        {/* Height */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Text style={styles.inputIcon}>📏</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Height (cm)"
            placeholderTextColor={colors.textMuted}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
        </View>

        {/* Weight */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Text style={styles.inputIcon}>⚖️</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Weight (kg)"
            placeholderTextColor={colors.textMuted}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </View>

        {/* Allergens */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Allergen</Text>
        <View style={styles.chipRow}>
          {allergenList.map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                { backgroundColor: colors.input, borderColor: colors.inputBorder },
                allergens.includes(item) && styles.chipActive,
              ]}
              onPress={() => toggleAllergen(item)}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }, allergens.includes(item) && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Level */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Activity Level</Text>
        {['Lightly Active (1-2 days per week)', 'Moderate Active (3-4 days per week)', 'Very Active (5+ days per week)'].map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.optionBtn,
              { backgroundColor: colors.input, borderColor: colors.inputBorder },
              activityLevel === level && styles.optionBtnActive,
            ]}
            onPress={() => setActivityLevel(level)}
          >
            <Text style={styles.optionCheck}>{activityLevel === level ? '✓ ' : '   '}</Text>
            <Text style={[styles.optionText, { color: colors.textSecondary }]}>{level}</Text>
          </TouchableOpacity>
        ))}

        {/* Dietary Goal */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Dietary Goal</Text>
        <View style={styles.chipRow}>
          {['Maintenance', 'Cutting', 'Bulking'].map(goal => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalChip,
                { backgroundColor: colors.input, borderColor: colors.inputBorder },
                dietaryGoal === goal && styles.chipActive,
              ]}
              onPress={() => setDietaryGoal(goal)}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }, dietaryGoal === goal && styles.chipTextActive]}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, { borderColor: colors.inputBorder }, agreed && styles.checkboxActive]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            I agree to the{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>Terms and Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* Create Account Button */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <Text style={[styles.loginText, { color: colors.textMuted }]}>
          Already have an account?{' '}
          <Text style={[styles.loginLink, { color: colors.primary }]} onPress={() => router.replace('/login')}>
            Log In
          </Text>
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24, alignItems: 'center' },
  logo: { fontSize: 30, fontWeight: 'bold', color: '#4CAF50', marginTop: 48, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14 },
  eyeIcon: { fontSize: 18, padding: 4 },
  sexRow: { flexDirection: 'row', width: '100%', marginBottom: 12, gap: 8 },
  sexBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  sexBtnActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  sexBtnActivePink: { backgroundColor: '#E91E8C', borderColor: '#E91E8C' },
  sexText: { fontWeight: '600' },
  sexTextActive: { color: '#fff' },
  sectionLabel: { alignSelf: 'flex-start', fontWeight: '700', fontSize: 15, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  chipText: { fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  optionBtnActive: { borderColor: '#4CAF50', backgroundColor: '#f0faf0' },
  optionCheck: { fontSize: 14, color: '#4CAF50', width: 20 },
  optionText: { fontSize: 13, flex: 1 },
  goalChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  termsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  termsText: { fontSize: 13, flex: 1 },
  termsLink: { fontWeight: '600' },
  button: { width: '100%', backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginText: { fontSize: 13 },
  loginLink: { fontWeight: 'bold' },
});