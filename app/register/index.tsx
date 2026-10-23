import { useFocusEffect, useRouter } from "expo-router";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Ruler,
  User,
  Weight,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AllergenPicker from "../../components/AllergenPicker";
import DietPicker from "../../components/DietPicker";
import Logo from "../../components/Logo";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

const ACTIVITY_LEVELS = [
  "Sedentary (little or no exercise)",
  "Lightly Active (1-3 days per week)",
  "Moderately Active (3-5 days per week)",
  "Very Active (6-7 days per week)",
  "Extra Active (very hard exercise / physical job)",
];

// Only accept common real email providers, not temporary mail
const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "yahoo.com"];

const isValidEmailDomain = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

// At least 8 characters, with an uppercase letter, a number, and a special character
const isValidPassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
  return hasMinLength && hasUppercase && hasNumber && hasSpecialChar;
};

// Names: letters, spaces, apostrophes, periods and hyphens only (no numbers)
const sanitizeName = (v: string) => v.replace(/[^A-Za-zÀ-ÿ .'-]/g, "");
const NAME_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/;

const LB_PER_KG = 2.20462;

const ERR = "#EF5350";
const MIN_AGE = 12;
const MAX_AGE = 75;
const TOTAL_STEPS = 5;

const STEP_TITLES = [
  { title: "Create your account", sub: "Your login details" },
  { title: "About you", sub: "Used to compute your plan" },
  { title: "Body and activity", sub: "Height, weight and how active you are" },
  { title: "Goals and diet", sub: "So your meals fit you" },
  { title: "Almost done", sub: "What can you train with?" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Age in whole years for a birthday (month is 0-11)
const getAge = (year: number, month: number, day: number) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() < month ||
    (today.getMonth() === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
};

// Returns an error message, or "" when the birthday is fine
const validateBirthday = (
  month: number | null,
  day: number | null,
  year: number | null,
) => {
  if (month === null || day === null || year === null) {
    return "Please select your full birthday.";
  }
  const date = new Date(year, month, day);
  if (date.getMonth() !== month || date.getDate() !== day) {
    return "Please select a valid date.";
  }
  const age = getAge(year, month, day);
  if (age < MIN_AGE || age > MAX_AGE) {
    return `Age must be ${MIN_AGE} to ${MAX_AGE}.`;
  }
  return "";
};

type Option = { label: string; value: number };

// Dropdown that opens a list (used for the birthday)
function SelectField({
  placeholder,
  title,
  value,
  options,
  onSelect,
  hasError,
  disabled,
  flex = 1,
}: {
  placeholder: string;
  title: string;
  value: number | null;
  options: Option[];
  onSelect: (v: number) => void;
  hasError?: boolean;
  disabled?: boolean;
  flex?: number;
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const listRef = useRef<ScrollView>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ flex }}>
      <TouchableOpacity
        style={[
          styles.selectBox,
          {
            backgroundColor: colors.input,
            borderColor: hasError ? ERR : colors.inputBorder,
          },
        ]}
        onPress={() => setOpen(true)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            color: selected ? colors.text : colors.textMuted,
          }}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.selectOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.selectSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.selectTitle, { color: colors.text }]}>
              {title}
            </Text>
            <ScrollView
              ref={listRef}
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
              onLayout={() => {
                const idx = options.findIndex((o) => o.value === value);
                if (idx > 3) {
                  listRef.current?.scrollTo({
                    y: (idx - 2) * 46,
                    animated: false,
                  });
                }
              }}
            >
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      styles.selectRow,
                      on && {
                        backgroundColor: isDark ? "#243a26" : "#f0faf0",
                      },
                    ]}
                    onPress={() => {
                      onSelect(o.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: on ? "#4CAF50" : colors.text,
                        fontWeight: on ? "700" : "400",
                      }}
                    >
                      {o.label}
                    </Text>
                    {on && <Check size={16} color="#4CAF50" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [sex, setSex] = useState("Male");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [height, setHeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [dietaryGoal, setDietaryGoal] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietaryPreference, setDietaryPreference] = useState("None");
  const [equipment, setEquipment] = useState<string[]>(["Bodyweight"]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const equipmentList = [
    "Bodyweight",
    "Dumbbell",
    "Barbell",
    "Resistance Bands",
    "Kettlebell",
    "Machine",
  ];

  const toggleEquipment = (item: string) => {
    setEquipment((prev) => {
      const next = prev.includes(item)
        ? prev.filter((e) => e !== item)
        : [...prev, item];
      // Always keep at least one. If none is left, go back to "Bodyweight"
      // (the safest default, no equipment needed)
      return next.length > 0 ? next : ["Bodyweight"];
    });
  };

  // ---------- Birthday options ----------
  const thisYear = new Date().getFullYear();
  const monthOptions: Option[] = MONTHS.map((m, i) => ({ label: m, value: i }));
  const daysInMonth =
    birthMonth === null
      ? 31
      : new Date(birthYear ?? 2000, birthMonth + 1, 0).getDate();
  const dayOptions: Option[] = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));
  const yearOptions: Option[] = [];
  for (let y = thisYear - MIN_AGE; y >= thisYear - MAX_AGE; y--) {
    yearOptions.push({ label: String(y), value: y });
  }

  // ---------- Height ----------
  // Height is always sent to the backend in centimeters. When the user picks
  // feet/inches we convert here (1 in = 2.54 cm).
  const getHeightCm = (): number | null => {
    if (heightUnit === "cm") {
      const cm = parseFloat(height);
      return Number.isFinite(cm) ? cm : null;
    }
    const ft = parseInt(heightFt, 10);
    const inch = heightIn === "" ? 0 : parseInt(heightIn, 10);
    if (!Number.isFinite(ft) || !Number.isFinite(inch) || inch < 0 || inch > 11)
      return null;
    return Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
  };

  const switchHeightUnit = (next: "cm" | "ft") => {
    if (next === heightUnit) return;
    // Carry the value over so the user does not have to retype it
    const cm = getHeightCm();
    if (cm) {
      if (next === "ft") {
        const totalIn = Math.round(cm / 2.54);
        setHeightFt(String(Math.floor(totalIn / 12)));
        setHeightIn(String(totalIn % 12));
      } else {
        setHeight(String(cm));
      }
    }
    setHeightUnit(next);
    clearError("height");
  };

  // ---------- Errors ----------
  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  // ---------- Weight ----------
  // Weight is always sent to the backend in kilograms. When the user picks
  // pounds we convert here (1 kg = 2.20462 lb).
  const getWeightKg = (): number | null => {
    const n = parseFloat(weight);
    if (!Number.isFinite(n)) return null;
    return weightUnit === "kg" ? n : Math.round((n / LB_PER_KG) * 10) / 10;
  };

  const switchWeightUnit = (next: "kg" | "lb") => {
    if (next === weightUnit) return;
    // Carry the value over so the user does not have to retype it
    const n = parseFloat(weight);
    if (Number.isFinite(n)) {
      setWeight(
        next === "lb"
          ? String(Math.round(n * LB_PER_KG * 10) / 10)
          : String(Math.round((n / LB_PER_KG) * 10) / 10),
      );
    }
    setWeightUnit(next);
    clearError("weight");
  };

  // Checks the fields of one step and returns the problems found
  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};

    if (s === 0) {
      if (!email.trim()) e.email = "Email is required.";
      else if (!isValidEmailDomain(email.trim()))
        e.email = "Use a Gmail, Hotmail, or Yahoo address.";
      if (!username.trim()) e.username = "Username is required.";
      if (!password) e.password = "Password is required.";
      else if (!isValidPassword(password))
        e.password =
          "Use 8+ characters with 1 uppercase letter, 1 number, and 1 special character.";
      if (!confirmPassword) e.confirmPassword = "Please confirm your password.";
      else if (password !== confirmPassword)
        e.confirmPassword = "Passwords do not match.";
    }

    if (s === 1) {
      if (!firstName.trim()) e.firstName = "First name is required.";
      else if (!NAME_PATTERN.test(firstName.trim()))
        e.firstName = "Use letters only, no numbers.";
      if (middleName.trim() && !NAME_PATTERN.test(middleName.trim()))
        e.middleName = "Use letters only, no numbers.";
      if (!lastName.trim()) e.lastName = "Last name is required.";
      else if (!NAME_PATTERN.test(lastName.trim()))
        e.lastName = "Use letters only, no numbers.";
      const bErr = validateBirthday(birthMonth, birthDay, birthYear);
      if (bErr) e.birthday = bErr;
    }

    if (s === 2) {
      const heightCm = getHeightCm();
      if (heightCm === null) e.height = "Please enter your height.";
      else if (heightCm < 100 || heightCm > 250)
        e.height =
          "Enter a realistic height (about 100 cm / 3'3\" up to 250 cm / 8'2\").";
      const w = getWeightKg();
      if (!weight) e.weight = "Weight is required.";
      else if (w === null || w < 20 || w > 300)
        e.weight = "Enter a realistic weight (20 to 300 kg / 44 to 661 lb).";
      if (!activityLevel)
        e.activityLevel = "Please choose your activity level.";
    }

    if (s === 3) {
      if (!dietaryGoal) e.dietaryGoal = "Please choose your dietary goal.";
    }

    if (s === 4) {
      if (!agreed) e.agreed = "Please agree to the Terms and Privacy Policy.";
    }

    return e;
  };

  const handleRegister = async () => {
    // Check every step again before sending; jump to the first one with a problem
    for (let s = 0; s < TOTAL_STEPS; s++) {
      const e = validateStep(s);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        setStep(s);
        return;
      }
    }

    const heightCm = getHeightCm() as number;
    const mm = String((birthMonth as number) + 1).padStart(2, "0");
    const dd = String(birthDay as number).padStart(2, "0");
    const formattedBirthday = `${birthYear}-${mm}-${dd}`;

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: [firstName.trim(), middleName.trim(), lastName.trim()]
          .filter(Boolean)
          .join(" "),
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        email: email.trim(),
        username,
        password,
        birthday: formattedBirthday,
        sex,
        height: heightCm,
        weight: getWeightKg(),
        dietary_goal: dietaryGoal,
        dietary_preference: dietaryPreference,
        activity_level: activityLevel,
        allergens,
        available_equipment: equipment,
      });

      // Registration no longer logs the user in directly. The email must be verified first.
      router.push({
        pathname: "/verify-otp",
        params: { email: email.trim() },
      } as any);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        "Unable to connect to server. Please check your connection.";
      Alert.alert("Registration Failed", message);
      // Email or username already used: take the user back to fix it
      if (/email|username/i.test(String(message))) setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const onNext = () => {
    if (loading) return;
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleRegister();
  };

  const onBack = () => {
    if (loading || step === 0) return;
    setErrors({});
    setStep(step - 1);
  };

  // Android back button goes to the previous step instead of leaving the screen
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (step > 0 && !loading) {
          setErrors({});
          setStep(step - 1);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [step, loading]),
  );

  // Start each step from the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // ---------- Small helpers for the layout ----------
  const boxStyle = (key: string) => [
    styles.inputWrapper,
    {
      backgroundColor: colors.input,
      borderColor: errors[key] ? ERR : colors.inputBorder,
    },
  ];

  const errText = (k: string) =>
    errors[k] ? <Text style={styles.errorText}>{errors[k]}</Text> : null;

  const optionActiveBg = isDark ? "#243a26" : "#f0faf0";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Top bar: back arrow, progress, step number */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          disabled={step === 0 || loading}
          style={styles.backIcon}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {step > 0 && <ChevronLeft size={22} color={colors.primary} />}
        </TouchableOpacity>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                { backgroundColor: i <= step ? "#4CAF50" : colors.border },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
          {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        {step === 0 && (
          <View style={styles.logoRow}>
            <Logo size={48} />
            <Text style={styles.logo}>NutriFit</Text>
          </View>
        )}
        <Text style={[styles.title, { color: colors.text }]}>
          {STEP_TITLES[step].title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {STEP_TITLES[step].sub}
        </Text>

        {/* ================= STEP 1: ACCOUNT ================= */}
        {step === 0 && (
          <>
            <View style={boxStyle("email")}>
              <User size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  clearError("email");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.email ? (
              errText("email")
            ) : (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Only Gmail, Hotmail, or Yahoo email addresses are accepted.
              </Text>
            )}

            <View style={boxStyle("username")}>
              <User size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  clearError("username");
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errText("username")}

            <View style={boxStyle("password")}>
              <Lock size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  clearError("password");
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={16} color={colors.textMuted} />
                ) : (
                  <Eye size={16} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password ? (
              errText("password")
            ) : (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                At least 8 characters, with 1 uppercase letter, 1 number, and 1
                special character (e.g. !@#$%^&*).
              </Text>
            )}

            <View style={boxStyle("confirmPassword")}>
              <Lock size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  clearError("confirmPassword");
                }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? (
                  <EyeOff size={16} color={colors.textMuted} />
                ) : (
                  <Eye size={16} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {errText("confirmPassword")}

            <Text style={[styles.loginText, { color: colors.textMuted }]}>
              Already have an account?{" "}
              <Text
                style={[styles.loginLink, { color: colors.primary }]}
                onPress={() => router.replace("/login")}
              >
                Log In
              </Text>
            </Text>
          </>
        )}

        {/* ================= STEP 2: ABOUT YOU ================= */}
        {step === 1 && (
          <>
            <View style={boxStyle("firstName")}>
              <User size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="First Name"
                placeholderTextColor={colors.textMuted}
                value={firstName}
                onChangeText={(v) => {
                  setFirstName(sanitizeName(v));
                  clearError("firstName");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errText("firstName")}

            <View style={boxStyle("middleName")}>
              <User size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Middle Name (optional)"
                placeholderTextColor={colors.textMuted}
                value={middleName}
                onChangeText={(v) => {
                  setMiddleName(sanitizeName(v));
                  clearError("middleName");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errText("middleName")}

            <View style={boxStyle("lastName")}>
              <User size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Last Name"
                placeholderTextColor={colors.textMuted}
                value={lastName}
                onChangeText={(v) => {
                  setLastName(sanitizeName(v));
                  clearError("lastName");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errText("lastName")}

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Birthday
            </Text>
            <View style={styles.birthRow}>
              <SelectField
                flex={1.6}
                placeholder="Month"
                title="Month"
                value={birthMonth}
                options={monthOptions}
                hasError={!!errors.birthday}
                disabled={loading}
                onSelect={(v) => {
                  setBirthMonth(v);
                  // Reset the day if it does not exist in the new month
                  const max = new Date(birthYear ?? 2000, v + 1, 0).getDate();
                  if (birthDay !== null && birthDay > max) setBirthDay(null);
                  clearError("birthday");
                }}
              />
              <SelectField
                flex={1}
                placeholder="Day"
                title="Day"
                value={birthDay}
                options={dayOptions}
                hasError={!!errors.birthday}
                disabled={loading}
                onSelect={(v) => {
                  setBirthDay(v);
                  clearError("birthday");
                }}
              />
              <SelectField
                flex={1.2}
                placeholder="Year"
                title="Year"
                value={birthYear}
                options={yearOptions}
                hasError={!!errors.birthday}
                disabled={loading}
                onSelect={(v) => {
                  setBirthYear(v);
                  if (birthMonth !== null && birthDay !== null) {
                    const max = new Date(v, birthMonth + 1, 0).getDate();
                    if (birthDay > max) setBirthDay(null);
                  }
                  clearError("birthday");
                }}
              />
            </View>
            {errors.birthday ? (
              errText("birthday")
            ) : (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Age must be {MIN_AGE} to {MAX_AGE}.
              </Text>
            )}

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Sex
            </Text>
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
          </>
        )}

        {/* ================= STEP 3: BODY AND ACTIVITY ================= */}
        {step === 2 && (
          <>
            {/* Height: cm or ft/in; converted to cm before sending */}
            <View style={styles.unitRow}>
              {(["cm", "ft"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitBtn,
                    {
                      borderColor: colors.inputBorder,
                      backgroundColor: colors.input,
                    },
                    heightUnit === u && styles.unitBtnActive,
                  ]}
                  onPress={() => switchHeightUnit(u)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: colors.textSecondary },
                      heightUnit === u && styles.unitTextActive,
                    ]}
                  >
                    {u === "cm" ? "Centimeters" : "Feet / Inches"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {heightUnit === "cm" ? (
              <View style={boxStyle("height")}>
                <Ruler size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Height (cm)"
                  placeholderTextColor={colors.textMuted}
                  value={height}
                  onChangeText={(v) => {
                    setHeight(v.replace(/[^0-9.]/g, ""));
                    clearError("height");
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                  editable={!loading}
                />
              </View>
            ) : (
              <View style={styles.ftRow}>
                <View style={[...boxStyle("height"), styles.ftInput]}>
                  <Ruler size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Feet"
                    placeholderTextColor={colors.textMuted}
                    value={heightFt}
                    onChangeText={(v) => {
                      setHeightFt(v.replace(/[^0-9]/g, ""));
                      clearError("height");
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    editable={!loading}
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    ft
                  </Text>
                </View>
                <View style={[...boxStyle("height"), styles.ftInput]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Inches"
                    placeholderTextColor={colors.textMuted}
                    value={heightIn}
                    onChangeText={(v) => {
                      setHeightIn(v.replace(/[^0-9]/g, ""));
                      clearError("height");
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    editable={!loading}
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    in
                  </Text>
                </View>
              </View>
            )}
            {errText("height")}

            {/* Weight: kg or lb; converted to kg before sending */}
            <View style={styles.unitRow}>
              {(["kg", "lb"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitBtn,
                    {
                      borderColor: colors.inputBorder,
                      backgroundColor: colors.input,
                    },
                    weightUnit === u && styles.unitBtnActive,
                  ]}
                  onPress={() => switchWeightUnit(u)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: colors.textSecondary },
                      weightUnit === u && styles.unitTextActive,
                    ]}
                  >
                    {u === "kg" ? "Kilograms" : "Pounds"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={boxStyle("weight")}>
              <Weight size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={
                  weightUnit === "kg" ? "Weight (kg)" : "Weight (lb)"
                }
                placeholderTextColor={colors.textMuted}
                value={weight}
                onChangeText={(v) => {
                  setWeight(v.replace(/[^0-9.]/g, ""));
                  clearError("weight");
                }}
                keyboardType="numeric"
                maxLength={6}
                editable={!loading}
              />
            </View>
            {errText("weight")}

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Activity Level
            </Text>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: colors.input,
                    borderColor: errors.activityLevel
                      ? ERR
                      : colors.inputBorder,
                  },
                  activityLevel === level && {
                    borderColor: "#4CAF50",
                    backgroundColor: optionActiveBg,
                  },
                ]}
                onPress={() => {
                  setActivityLevel(level);
                  clearError("activityLevel");
                }}
              >
                <View style={styles.optionCheck}>
                  {activityLevel === level && (
                    <Check size={14} color="#4CAF50" strokeWidth={3} />
                  )}
                </View>
                <Text
                  style={[styles.optionText, { color: colors.textSecondary }]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
            {errText("activityLevel")}
          </>
        )}

        {/* ================= STEP 4: GOALS AND DIET ================= */}
        {step === 3 && (
          <>
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
                      borderColor: errors.dietaryGoal
                        ? ERR
                        : colors.inputBorder,
                    },
                    dietaryGoal === goal && styles.chipActive,
                  ]}
                  onPress={() => {
                    setDietaryGoal(goal);
                    clearError("dietaryGoal");
                  }}
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
            {errText("dietaryGoal")}

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Dietary Preference
            </Text>
            <DietPicker
              value={dietaryPreference}
              onChange={setDietaryPreference}
            />

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Allergen
            </Text>
            <AllergenPicker value={allergens} onChange={setAllergens} />
          </>
        )}

        {/* ================= STEP 5: EQUIPMENT AND FINISH ================= */}
        {step === 4 && (
          <>
            {/* Equipment is used by the Workout module to know what the user
                really has, instead of a hardcoded assumption */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Available Equipment
            </Text>
            <View style={styles.chipRow}>
              {equipmentList.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                    },
                    equipment.includes(item) && styles.chipActive,
                  ]}
                  onPress={() => toggleEquipment(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      equipment.includes(item) && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                onPress={() => {
                  // If already checked, just uncheck. If not, open the Terms
                  // modal first: the user must read it before agreeing
                  if (agreed) {
                    setAgreed(false);
                  } else {
                    setHasScrolledToEnd(false);
                    setShowTermsModal(true);
                  }
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: errors.agreed ? ERR : colors.inputBorder },
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
                  onPress={() => {
                    setHasScrolledToEnd(false);
                    setShowTermsModal(true);
                  }}
                >
                  Terms and Privacy Policy
                </Text>
              </Text>
            </View>
            {errText("agreed")}
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom buttons stay in place while the form scrolls */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {step > 0 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.inputBorder }]}
            onPress={onBack}
            disabled={loading}
          >
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, { flex: 1 }, loading && { opacity: 0.7 }]}
          onPress={onNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === TOTAL_STEPS - 1 ? "Create Account" : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Terms and Privacy Policy Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
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
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } =
                  nativeEvent;
                const isCloseToBottom =
                  layoutMeasurement.height + contentOffset.y >=
                  contentSize.height - 24;
                if (isCloseToBottom) setHasScrolledToEnd(true);
              }}
              scrollEventThrottle={100}
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
                6. Nutritional Basis and Professional Review
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                The calorie and macronutrient formulas, meal database, and
                allergen substitution recommendations used by NutriFit were
                reviewed and validated by a licensed nutritionist-dietitian,
                Marc Cyrill E. De Veas, to help ensure they align with sound
                nutritional practice. This review does not replace
                individualized medical or dietary advice from a professional who
                has access to your complete health history.
              </Text>

              <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
                7. Account Responsibility
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
                By tapping &quot;I Agree&quot; below, you confirm that you have
                read and understood this Terms and Privacy Policy.
              </Text>

              <View style={{ height: 12 }} />
            </ScrollView>

            {!hasScrolledToEnd && (
              <Text
                style={[styles.termsScrollHint, { color: colors.textMuted }]}
              >
                Scroll to the bottom to continue
              </Text>
            )}
            <View style={styles.termsBtnRow}>
              <TouchableOpacity
                style={[
                  styles.termsDisagreeBtn,
                  { borderColor: colors.inputBorder },
                ]}
                onPress={() => {
                  setAgreed(false);
                  setShowTermsModal(false);
                }}
              >
                <Text
                  style={[
                    styles.termsDisagreeBtnText,
                    { color: colors.textSecondary },
                  ]}
                >
                  I Disagree
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.termsAgreeBtn,
                  { flex: 1 },
                  !hasScrolledToEnd && { opacity: 0.4 },
                ]}
                onPress={() => {
                  if (!hasScrolledToEnd) return;
                  setAgreed(true);
                  setShowTermsModal(false);
                }}
                disabled={!hasScrolledToEnd}
              >
                <Text style={styles.termsAgreeBtnText}>I Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backIcon: { width: 24, height: 24, justifyContent: "center" },
  progressRow: { flex: 1, flexDirection: "row", gap: 4 },
  progressSeg: { flex: 1, height: 5, borderRadius: 3 },
  stepLabel: { fontSize: 11, width: 44, textAlign: "right" },
  container: { padding: 24, paddingTop: 12, alignItems: "center" },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
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
  hintText: {
    alignSelf: "flex-start",
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  errorText: {
    alignSelf: "flex-start",
    fontSize: 11,
    color: "#EF5350",
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  birthRow: { flexDirection: "row", width: "100%", gap: 8, marginBottom: 12 },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  selectSheet: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  unitRow: { flexDirection: "row", width: "100%", marginBottom: 8, gap: 8 },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  unitBtnActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  unitText: { fontSize: 12, fontWeight: "600" },
  unitTextActive: { color: "#fff" },
  ftRow: { flexDirection: "row", width: "100%", gap: 8 },
  ftInput: { flex: 1, width: undefined },
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
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  backBtn: {
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontWeight: "600", fontSize: 15 },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginText: { fontSize: 13, marginTop: 16 },
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
  termsScrollHint: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  termsBtnRow: { flexDirection: "row", gap: 10 },
  termsDisagreeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  termsDisagreeBtnText: { fontWeight: "600", fontSize: 14 },
  termsAgreeBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  termsAgreeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
