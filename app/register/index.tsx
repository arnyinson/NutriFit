import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logo}>🥗 NutriFit</Text>
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>
        Join NutriFit and get your personalized meal and workout plan
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>👤</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>👤</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>🔒</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>🔒</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>📅</Text>
        <TextInput
          style={styles.input}
          placeholder="Birthday (MM/DD/YYYY)"
          value={birthday}
          onChangeText={setBirthday}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.sexRow}>
        <TouchableOpacity
          style={[styles.sexBtn, sex === "Male" && styles.sexBtnActive]}
          onPress={() => setSex("Male")}
        >
          <Text
            style={[styles.sexText, sex === "Male" && styles.sexTextActive]}
          >
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sexBtn, sex === "Female" && styles.sexBtnActivePink]}
          onPress={() => setSex("Female")}
        >
          <Text
            style={[styles.sexText, sex === "Female" && styles.sexTextActive]}
          >
            Female
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>📏</Text>
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>⚖️</Text>
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.sectionLabel}>Allergen</Text>
      <View style={styles.chipRow}>
        {allergenList.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, allergens.includes(item) && styles.chipActive]}
            onPress={() => toggleAllergen(item)}
          >
            <Text
              style={[
                styles.chipText,
                allergens.includes(item) && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Activity Level</Text>
      {[
        "Lightly Active (1-2 days per week)",
        "Moderate Active (3-4 days per week)",
        "Very Active (5+ days per week)",
      ].map((level) => (
        <TouchableOpacity
          key={level}
          style={[
            styles.optionBtn,
            activityLevel === level && styles.optionBtnActive,
          ]}
          onPress={() => setActivityLevel(level)}
        >
          <Text style={styles.optionCheck}>
            {activityLevel === level ? "✓ " : "   "}
          </Text>
          <Text style={styles.optionText}>{level}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>Dietary Goal</Text>
      <View style={styles.chipRow}>
        {["Maintenance", "Cutting", "Bulking"].map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[
              styles.goalChip,
              dietaryGoal === goal && styles.goalChipActive,
            ]}
            onPress={() => setDietaryGoal(goal)}
          >
            <Text
              style={[
                styles.chipText,
                dietaryGoal === goal && styles.chipTextActive,
              ]}
            >
              {goal}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreed(!agreed)}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.termsText}>
          I agree to the{" "}
          <Text style={styles.termsLink}>Terms and Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Already have an account?{" "}
        <Text style={styles.loginLink} onPress={() => router.replace("/login")}>
          Log In
        </Text>
      </Text>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", alignItems: "center" },
  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 48,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#111", marginBottom: 4 },
  subtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#333" },
  eyeIcon: { fontSize: 18, padding: 4 },
  sexRow: { flexDirection: "row", width: "100%", marginBottom: 12, gap: 8 },
  sexBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  sexBtnActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  sexBtnActivePink: { backgroundColor: "#E91E8C", borderColor: "#E91E8C" },
  sexText: { fontWeight: "600", color: "#555" },
  sexTextActive: { color: "#fff" },
  sectionLabel: {
    alignSelf: "flex-start",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 4,
    color: "#222",
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
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  chipText: { fontSize: 13, color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  optionBtnActive: { borderColor: "#4CAF50", backgroundColor: "#f0faf0" },
  optionCheck: { fontSize: 14, color: "#4CAF50", width: 20 },
  optionText: { fontSize: 13, color: "#444", flex: 1 },
  goalChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  goalChipActive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  termsText: { fontSize: 13, color: "#555", flex: 1 },
  termsLink: { color: "#4CAF50", fontWeight: "600" },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginText: { color: "#888", fontSize: 13 },
  loginLink: { color: "#4CAF50", fontWeight: "bold" },
});
