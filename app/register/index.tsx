import { useRouter } from "expo-router";
import {
  Calendar,
  Check,
  Eye,
  EyeOff,
  Lock,
  Ruler,
  User,
  Weight,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../components/Logo";
import { useTheme } from "../../constants/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [sex, setSex] = useState("Male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [dietaryGoal, setDietaryGoal] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const allergenList = ["Eggs", "Peanuts", "Dairy", "Shellfish", "Fish", "Soy"];

  const toggleAllergen = (item: string) => {
    setAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleRegister = () => {
    if (
      !email ||
      !username ||
      !password ||
      !confirmPassword ||
      !birthday ||
      !height ||
      !weight ||
      !activityLevel ||
      !dietaryGoal
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (!agreed) {
      Alert.alert("Error", "Please agree to the Terms and Privacy Policy.");
      return;
    }
    Alert.alert("Success", "Account created successfully!", [
      { text: "OK", onPress: () => router.replace("/login") },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.logoRow}>
          <Logo size={48} />
          <Text style={styles.logo}>NutriFit</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Your Account
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Join NutriFit and get your personalized meal and workout plan
        </Text>

        {/* Email */}
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <User size={16} color={colors.textMuted} />
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
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <User size={16} color={colors.textMuted} />
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
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Lock size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={16} color={colors.textMuted} />
            ) : (
              <Eye size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Lock size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? (
              <EyeOff size={16} color={colors.textMuted} />
            ) : (
              <Eye size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Birthday */}
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Calendar size={16} color={colors.textMuted} />
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
            style={[
              styles.sexBtn,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.input,
              },
              sex === "Male" && styles.sexBtnActive,
            ]}
            onPress={() => setSex("Male")}
          >
            <Text
              style={[
                styles.sexText,
                { color: colors.textSecondary },
                sex === "Male" && styles.sexTextActive,
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sexBtn,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.input,
              },
              sex === "Female" && styles.sexBtnActivePink,
            ]}
            onPress={() => setSex("Female")}
          >
            <Text
              style={[
                styles.sexText,
                { color: colors.textSecondary },
                sex === "Female" && styles.sexTextActive,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>

        {/* Height */}
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Ruler size={16} color={colors.textMuted} />
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
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Weight size={16} color={colors.textMuted} />
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
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Allergen
        </Text>
        <View style={styles.chipRow}>
          {allergenList.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                },
                allergens.includes(item) && styles.chipActive,
              ]}
              onPress={() => toggleAllergen(item)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textSecondary },
                  allergens.includes(item) && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Level */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Activity Level
        </Text>
        {[
          "Lightly Active (1-2 days per week)",
          "Moderate Active (3-4 days per week)",
          "Very Active (5+ days per week)",
        ].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.optionBtn,
              {
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
              },
              activityLevel === level && styles.optionBtnActive,
            ]}
            onPress={() => setActivityLevel(level)}
          >
            <View style={styles.optionCheck}>
              {activityLevel === level && (
                <Check size={14} color="#4CAF50" strokeWidth={3} />
              )}
            </View>
            <Text style={[styles.optionText, { color: colors.textSecondary }]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Dietary Goal */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Dietary Goal
        </Text>
        <View style={styles.chipRow}>
          {["Maintenance", "Cutting", "Bulking"].map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalChip,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                },
                dietaryGoal === goal && styles.chipActive,
              ]}
              onPress={() => setDietaryGoal(goal)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textSecondary },
                  dietaryGoal === goal && styles.chipTextActive,
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms */}
        <View style={styles.termsRow}>
          <TouchableOpacity onPress={() => setAgreed(!agreed)}>
            <View
              style={[
                styles.checkbox,
                { borderColor: colors.inputBorder },
                agreed && styles.checkboxActive,
              ]}
            >
              {agreed && <Check size={12} color="#fff" strokeWidth={3} />}
            </View>
          </TouchableOpacity>
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            I agree to the{" "}
            <Text
              style={[styles.termsLink, { color: colors.primary }]}
              onPress={() => setShowTermsModal(true)}
            >
              Terms and Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <Text style={[styles.loginText, { color: colors.textMuted }]}>
          Already have an account?{" "}
          <Text
            style={[styles.loginLink, { color: colors.primary }]}
            onPress={() => router.replace("/login")}
          >
            Log In
          </Text>
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Terms and Privacy Policy Modal */}
      <Modal visible={showTermsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Terms and Privacy Policy
              </Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.termsScroll}
            >
              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                1. Account Information
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                By creating an account, you agree to provide accurate personal
                information, including your height, weight, birthday, and
                health-related details. This information is used solely to
                calculate your BMI, TDEE, and to generate personalized meal and
                workout recommendations.
              </Text>

              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                2. Health Disclaimer
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                NutriFit provides general meal and workout suggestions generated
                through an automated recommendation system. This app does not
                replace professional medical, nutritional, or fitness advice.
                Consult a licensed physician, dietitian, or fitness professional
                before starting any new diet or exercise program, especially if
                you have existing health conditions.
              </Text>

              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                3. Allergen Information
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                While NutriFit filters meal recommendations based on the
                allergens you provide, we cannot guarantee complete accuracy in
                all cases. Always double-check ingredients yourself if you have
                severe allergies before consuming any meal.
              </Text>

              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                4. Data Privacy
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                Your personal information, progress logs, and meal or workout
                history are stored securely and used only within the app to
                personalize your experience. We do not sell your personal data
                to third parties.
              </Text>

              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                5. AI-Generated Recommendations
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                Meal and workout plans are generated using an automated
                recommendation system based on the data you provide.
                Recommendations may not always be perfectly suited to your
                individual needs and should be used as a general guide.
              </Text>

              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                6. Account Responsibility
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                You are responsible for maintaining the confidentiality of your
                account password. Notify us immediately if you suspect
                unauthorized access to your account.
              </Text>

              <Text
                style={[
                  styles.termsBody,
                  {
                    color: colors.textMuted,
                    marginTop: 16,
                    fontStyle: "italic",
                  },
                ]}
              >
                By tapping "I Agree" below, you confirm that you have read and
                understood this Terms and Privacy Policy.
              </Text>

              <View style={{ height: 12 }} />
            </ScrollView>

            <TouchableOpacity
              style={styles.termsAgreeBtn}
              onPress={() => {
                setAgreed(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.termsAgreeBtnText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24, alignItems: "center" },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 40,
    marginBottom: 6,
  },
  logo: { fontSize: 30, fontWeight: "bold", color: "#4CAF50" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: "center", marginBottom: 20 },
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
  input: { flex: 1, paddingVertical: 12, fontSize: 14 },
  sexRow: { flexDirection: "row", width: "100%", marginBottom: 12, gap: 8 },
  sexBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  sexBtnActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  sexBtnActivePink: { backgroundColor: "#E91E8C", borderColor: "#E91E8C" },
  sexText: { fontWeight: "600" },
  sexTextActive: { color: "#fff" },
  sectionLabel: {
    alignSelf: "flex-start",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  chipText: { fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionBtnActive: { borderColor: "#4CAF50", backgroundColor: "#f0faf0" },
  optionCheck: { width: 20, alignItems: "center" },
  optionText: { fontSize: 13, flex: 1 },
  goalChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  termsText: { fontSize: 13, flex: 1 },
  termsLink: { fontWeight: "600", textDecorationLine: "underline" },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginText: { fontSize: 13 },
  loginLink: { fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  termsScroll: { marginBottom: 16 },
  termsSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  termsBody: { fontSize: 13, lineHeight: 20 },
  termsAgreeBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  termsAgreeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
