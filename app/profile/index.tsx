import { useRouter } from "expo-router";
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
import { useTheme } from "../../constants/theme";

type UserProfile = {
  name: string;
  email: string;
  birthday: string;
  sex: string;
  height: string;
  weight: string;
  dietaryGoal: string;
  activityLevel: string;
  allergens: string[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeWeightTab, setActiveWeightTab] = useState("1M");
  const { isDark, toggleTheme, colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile>({
    name: "David Johnson",
    email: "davidjohnson@gmail.com",
    birthday: "04/03/1994",
    sex: "Male",
    height: "5'7 ft",
    weight: "69.39 kg",
    dietaryGoal: "Cutting",
    activityLevel: "Moderate Active",
    allergens: ["Fish", "Soy"],
  });

  const [editForm, setEditForm] = useState<UserProfile>({ ...profile });

  const weightData = {
    "1W": [
      { label: "Mon", value: 70.2 },
      { label: "Tue", value: 70.0 },
      { label: "Wed", value: 69.8 },
      { label: "Thu", value: 69.6 },
      { label: "Fri", value: 69.5 },
      { label: "Sat", value: 69.4 },
      { label: "Today", value: 69.39 },
    ],
    "1M": [
      { label: "Apr 22", value: 72.0 },
      { label: "Apr 29", value: 71.2 },
      { label: "May 5", value: 70.5 },
      { label: "May 10", value: 69.39 },
    ],
    "3M": [
      { label: "Mar", value: 74.5 },
      { label: "Apr", value: 72.0 },
      { label: "May", value: 69.39 },
    ],
    "6M": [
      { label: "Dec", value: 78.0 },
      { label: "Jan", value: 76.5 },
      { label: "Feb", value: 75.0 },
      { label: "Mar", value: 74.5 },
      { label: "Apr", value: 72.0 },
      { label: "May", value: 69.39 },
    ],
    "Last month": [
      { label: "Apr 1", value: 73.0 },
      { label: "Apr 8", value: 72.5 },
      { label: "Apr 15", value: 71.8 },
      { label: "Apr 22", value: 71.0 },
      { label: "Apr 30", value: 70.2 },
    ],
  } as Record<string, { label: string; value: number }[]>;

  const currentData = weightData[activeWeightTab] || [];
  const maxWeight = Math.max(...currentData.map((d) => d.value));
  const minWeight = Math.min(...currentData.map((d) => d.value));
  const weightDiff =
    (currentData[currentData.length - 1]?.value ?? 0) -
    (currentData[0]?.value ?? 0);

  const heightInMeters = 1.7;
  const weightInKg = 69.39;
  const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "#2196F3" };
    if (bmi < 25) return { label: "Normal", color: "#4CAF50" };
    if (bmi < 30) return { label: "Overweight", color: "#FF9800" };
    return { label: "Obese", color: "#F44336" };
  };
  const bmiCategory = getBMICategory(parseFloat(bmi));
  const tdee = Math.round(
    (10 * weightInKg + 6.25 * (heightInMeters * 100) - 5 * 30 + 5) * 1.55,
  );

  const allergenList = ["Eggs", "Peanuts", "Dairy", "Shellfish", "Fish", "Soy"];

  const toggleAllergen = (item: string) => {
    setEditForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(item)
        ? prev.allergens.filter((a) => a !== item)
        : [...prev.allergens, item],
    }));
  };

  const saveProfile = () => {
    setProfile({ ...editForm });
    setShowEditModal(false);
    Alert.alert("✅ Success", "Profile saved successfully!");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
  <TouchableOpacity onPress={() => router.back()}>
    <Text style={[styles.backBtn, { color: colors.primary }]}>←</Text>
  </TouchableOpacity>
  <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
  <View style={styles.headerRight}>
    <TouchableOpacity onPress={toggleTheme}>
      <Text style={styles.notifIcon}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/notifications" as any)}>
      <Text style={styles.notifIcon}>🔔</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.cameraBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile.name}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
            {profile.email}
          </Text>
        </View>

        {/* BMI + TDEE Cards */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>
              {bmi}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              BMI
            </Text>
            <View
              style={[styles.statBadge, { backgroundColor: bmiCategory.color }]}
            >
              <Text style={styles.statBadgeText}>{bmiCategory.label}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>
              {tdee}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              TDEE (kcal)
            </Text>
            <View style={[styles.statBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.statBadgeText}>{profile.dietaryGoal}</Text>
            </View>
          </View>
        </View>

        {/* Personal Info */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Info
            </Text>
          </View>
          {[
            { icon: "📅", label: "Birthday", value: profile.birthday },
            { icon: "⚧️", label: "Sex", value: profile.sex },
            { icon: "📏", label: "Height", value: profile.height },
            { icon: "⚖️", label: "Weight", value: profile.weight },
            { icon: "🎯", label: "Dietary Goal", value: profile.dietaryGoal },
            {
              icon: "🏃",
              label: "Activity Level",
              value: profile.activityLevel,
            },
          ].map((item, i) => (
            <View
              key={i}
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {item.value}
              </Text>
            </View>
          ))}

          {/* Allergens */}
          <View style={styles.allergenRow}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Allergens
            </Text>
            <View style={styles.allergenChips}>
              {profile.allergens.length > 0 ? (
                profile.allergens.map((a) => (
                  <View key={a} style={styles.allergenChip}>
                    <Text style={styles.allergenChipText}>{a}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noAllergen, { color: colors.textMuted }]}>
                  None
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditForm({ ...profile });
              setShowEditModal(true);
            }}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Weight Graph */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.weightTitle, { color: colors.text }]}>
            Current Weight
          </Text>
          <Text style={[styles.weightSub, { color: colors.textMuted }]}>
            {weightInKg} kg • Updated 3 days ago
          </Text>

          <View style={styles.graphContainer}>
            <View style={styles.graph}>
              {currentData.map((point, i) => {
                const height =
                  ((point.value - minWeight) / (maxWeight - minWeight || 1)) *
                    80 +
                  10;
                return (
                  <View key={i} style={styles.graphBarWrapper}>
                    <Text style={styles.graphValue}>{point.value}</Text>
                    <View style={[styles.graphDot, { marginBottom: height }]} />
                    <Text
                      style={[styles.graphLabel, { color: colors.textMuted }]}
                    >
                      {point.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weightTabs}
          >
            {["1W", "1M", "3M", "6M", "Last month"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.weightTab,
                  { backgroundColor: colors.input },
                  activeWeightTab === tab && styles.weightTabActive,
                ]}
                onPress={() => setActiveWeightTab(tab)}
              >
                <Text
                  style={[
                    styles.weightTabText,
                    { color: colors.textMuted },
                    activeWeightTab === tab && styles.weightTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={[
              styles.weightChangeBadge,
              { backgroundColor: weightDiff < 0 ? "#E8F5E9" : "#FFF3E0" },
            ]}
          >
            <Text
              style={[
                styles.weightChangeText,
                { color: weightDiff < 0 ? "#4CAF50" : "#FF9800" },
              ]}
            >
              {weightDiff < 0 ? "▼" : "▲"} {Math.abs(weightDiff).toFixed(1)} kg
              this period
            </Text>
          </View>
        </View>

        {/* Ticket / Feedback */}
        <TouchableOpacity
          style={[
            styles.ticketBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/ticket" as any)}
        >
          <Text style={styles.ticketIcon}>🎫</Text>
          <Text style={[styles.ticketText, { color: colors.text }]}>
            Submit Feedback / Support
          </Text>
          <Text style={[styles.ticketArrow, { color: colors.textMuted }]}>
            ›
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.border }]}
          onPress={() =>
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Logout",
                style: "destructive",
                onPress: () => router.replace("/login"),
              },
            ])
          }
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Edit Profile
                </Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text
                    style={[styles.modalClose, { color: colors.textMuted }]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editForm.name}
                onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
              />

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Birthday
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editForm.birthday}
                onChangeText={(v) =>
                  setEditForm((p) => ({ ...p, birthday: v }))
                }
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textMuted}
              />

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Sex
              </Text>
              <View style={styles.sexRow}>
                {["Male", "Female"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.sexBtn,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.input,
                      },
                      editForm.sex === s &&
                        (s === "Male"
                          ? styles.sexBtnMale
                          : styles.sexBtnFemale),
                    ]}
                    onPress={() => setEditForm((p) => ({ ...p, sex: s }))}
                  >
                    <Text
                      style={[
                        styles.sexBtnText,
                        { color: colors.textSecondary },
                        editForm.sex === s && styles.sexBtnTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Height
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editForm.height}
                onChangeText={(v) => setEditForm((p) => ({ ...p, height: v }))}
                placeholder="e.g. 5'7 ft"
                placeholderTextColor={colors.textMuted}
              />

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Weight (kg)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editForm.weight}
                onChangeText={(v) => setEditForm((p) => ({ ...p, weight: v }))}
                placeholder="e.g. 69.39 kg"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
              />

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Dietary Goal
              </Text>
              <View style={styles.chipRow}>
                {["Maintenance", "Cutting", "Bulking"].map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                      },
                      editForm.dietaryGoal === goal && styles.chipActive,
                    ]}
                    onPress={() =>
                      setEditForm((p) => ({ ...p, dietaryGoal: goal }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.textSecondary },
                        editForm.dietaryGoal === goal && styles.chipTextActive,
                      ]}
                    >
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
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
                    editForm.activityLevel === level && styles.optionBtnActive,
                  ]}
                  onPress={() =>
                    setEditForm((p) => ({ ...p, activityLevel: level }))
                  }
                >
                  <Text style={styles.optionCheck}>
                    {editForm.activityLevel === level ? "✓ " : "   "}
                  </Text>
                  <Text
                    style={[styles.optionText, { color: colors.textSecondary }]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Allergens
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
                      editForm.allergens.includes(item) && styles.chipActive,
                    ]}
                    onPress={() => toggleAllergen(item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.textSecondary },
                        editForm.allergens.includes(item) &&
                          styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { fontSize: 22, fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  notifIcon: { fontSize: 22 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cameraIcon: { fontSize: 14 },
  profileName: { fontSize: 20, fontWeight: "bold" },
  profileEmail: { fontSize: 13, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  statBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoIcon: { fontSize: 16, width: 28 },
  infoLabel: { flex: 1, fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  allergenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    flexWrap: "wrap",
  },
  allergenChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  allergenChip: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allergenChipText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  noAllergen: { fontSize: 13 },
  editBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },
  editBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  weightTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  weightSub: { fontSize: 12, marginBottom: 16 },
  graphContainer: { marginBottom: 12 },
  graph: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
  },
  graphBarWrapper: { alignItems: "center", flex: 1 },
  graphValue: { fontSize: 9, color: "#4CAF50", marginBottom: 4 },
  graphDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  graphLabel: { fontSize: 9, marginTop: 4 },
  weightTabs: { marginBottom: 12 },
  weightTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  weightTabActive: { backgroundColor: "#4CAF50" },
  weightTabText: { fontSize: 12, fontWeight: "600" },
  weightTabTextActive: { color: "#fff" },
  weightChangeBadge: { padding: 10, borderRadius: 12, alignItems: "center" },
  weightChangeText: { fontSize: 13, fontWeight: "700" },
  ticketBtn: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  ticketIcon: { fontSize: 20 },
  ticketText: { flex: 1, fontSize: 14, fontWeight: "600" },
  ticketArrow: { fontSize: 22 },
  darkModeBtn: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  darkModeIcon: { fontSize: 20 },
  darkModeText: { flex: 1, fontSize: 14, fontWeight: "600" },
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  logoutText: { color: "#F44336", fontWeight: "bold", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalClose: { fontSize: 20, padding: 4 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 4,
  },
  sexRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  sexBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  sexBtnMale: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  sexBtnFemale: { backgroundColor: "#E91E8C", borderColor: "#E91E8C" },
  sexBtnText: { fontWeight: "600" },
  sexBtnTextActive: { color: "#fff" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
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
  optionCheck: { fontSize: 14, color: "#4CAF50", width: 20 },
  optionText: { fontSize: 13, flex: 1 },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
