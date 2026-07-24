import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Moon,
  Ruler,
  Sun,
  Target,
  Ticket,
  User,
  VenusAndMars,
  Weight,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  birthday: string;
  sex: string;
  height: string;
  weight: string;
  dietary_goal: string;
  activity_level: string;
  allergens: string[];
  bmi: string;
  tdee: string;
  avatar_url?: string | null;
};

const formatDateDisplay = (isoDate: string) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const parseDateInput = (mmddyyyy: string) => {
  const parts = mmddyyyy.split("/");
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts;
  if (!mm || !dd || !yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, toggleTheme, colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [birthdayInput, setBirthdayInput] = useState("");

  const [activeWeightTab, setActiveWeightTab] = useState("1M");
  const [weightHistory, setWeightHistory] = useState<
    { date: string; weight: string }[]
  >([]);
  const [loadingWeight, setLoadingWeight] = useState(true);

  const allergenList = ["Eggs", "Peanuts", "Dairy", "Shellfish", "Fish", "Soy"];

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get("/users/me");
      setProfile(res.data.user);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      console.error("Load profile error:", err);
      Alert.alert("Error", "Unable to load your profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadWeightHistory = useCallback(async (range: string) => {
    setLoadingWeight(true);
    try {
      const res = await api.get("/progress/weight-history", {
        params: { range },
      });
      setWeightHistory(res.data.weightHistory);
    } catch (err) {
      console.error("Load weight history error:", err);
    } finally {
      setLoadingWeight(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadWeightHistory(activeWeightTab);
  }, [activeWeightTab, loadWeightHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
    loadWeightHistory(activeWeightTab);
  };

  const handlePickAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to change your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      const filename = asset.uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const res = await api.post("/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile((prev) =>
        prev ? { ...prev, avatar_url: res.data.avatar_url } : prev,
      );
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, avatar_url: res.data.avatar_url }),
        );
      }
      Alert.alert("Success", "Profile picture updated!");
    } catch (err: any) {
      console.error("Upload avatar error:", err);
      Alert.alert(
        "Error",
        "Unable to upload profile picture. Please try again.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditForm({
      height: profile.height,
      weight: profile.weight,
      dietary_goal: profile.dietary_goal,
      activity_level: profile.activity_level,
      allergens: [...profile.allergens],
      sex: profile.sex,
    });
    setBirthdayInput(formatDateDisplay(profile.birthday));
    setShowEditModal(true);
  };

  const handleBirthdayChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "");
    let formatted = digitsOnly;
    if (digitsOnly.length >= 5) {
      formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    } else if (digitsOnly.length >= 3) {
      formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    }
    setBirthdayInput(formatted);
  };

  const toggleAllergen = (item: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      allergens: prev.allergens.includes(item)
        ? prev.allergens.filter((a: string) => a !== item)
        : [...prev.allergens, item],
    }));
  };

  const saveProfile = async () => {
    const isoBirthday = parseDateInput(birthdayInput);
    if (!isoBirthday) {
      Alert.alert(
        "Error",
        "Please enter a valid birthday in MM/DD/YYYY format.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/users/me", {
        birthday: isoBirthday,
        sex: editForm.sex,
        height: parseFloat(editForm.height),
        weight: parseFloat(editForm.weight),
        dietary_goal: editForm.dietary_goal,
        activity_level: editForm.activity_level,
        allergens: editForm.allergens,
      });
      setProfile(res.data.user);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

      await api.post("/progress/log", { weight: parseFloat(editForm.weight) });
      loadWeightHistory(activeWeightTab);

      setShowEditModal(false);
      Alert.alert("Success", "Profile saved successfully!");
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        "Unable to save profile. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const bmiValue = parseFloat(profile.bmi);
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "#2196F3" };
    if (bmi < 25) return { label: "Normal", color: "#4CAF50" };
    if (bmi < 30) return { label: "Overweight", color: "#FF9800" };
    return { label: "Obese", color: "#F44336" };
  };
  const bmiCategory = getBMICategory(bmiValue);

  const chartData = weightHistory.map((w) => ({
    label: new Date(w.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: parseFloat(w.weight),
  }));
  const maxWeight =
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const minWeight =
    chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const weightDiff =
    chartData.length > 1
      ? chartData[chartData.length - 1].value - chartData[0].value
      : 0;

  const personalInfoItems = [
    {
      Icon: Calendar,
      label: "Birthday",
      value: formatDateDisplay(profile.birthday),
    },
    { Icon: VenusAndMars, label: "Sex", value: profile.sex },
    { Icon: Ruler, label: "Height", value: `${profile.height} cm` },
    { Icon: Weight, label: "Weight", value: `${profile.weight} kg` },
    { Icon: Target, label: "Dietary Goal", value: profile.dietary_goal },
    {
      Icon: Activity,
      label: "Activity Level",
      value: profile.activity_level.split(" (")[0],
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
          />
        }
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profile
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme}>
              {isDark ? (
                <Sun size={22} color={colors.textMuted} />
              ) : (
                <Moon size={22} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/notifications" as any)}
            >
              <Bell size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.cameraBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Camera size={14} color={colors.textSecondary} />
              )}
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
              {bmiValue.toFixed(1)}
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
              {profile.tdee}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              TDEE (kcal)
            </Text>
            <View style={[styles.statBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.statBadgeText}>{profile.dietary_goal}</Text>
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
            <User size={18} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Info
            </Text>
          </View>
          {personalInfoItems.map((item, i) => (
            <View
              key={i}
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIconBox}>
                <item.Icon size={16} color={colors.textSecondary} />
              </View>
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
            <View style={styles.infoIconBox}>
              <AlertTriangle size={16} color={colors.textSecondary} />
            </View>
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

          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
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
            {profile.weight} kg
          </Text>

          {loadingWeight ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: 40 }}
            />
          ) : chartData.length === 0 ? (
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                textAlign: "center",
                marginVertical: 40,
              }}
            >
              No weight history yet for this period.
            </Text>
          ) : (
            <View style={styles.graphContainer}>
              <View style={styles.graph}>
                {chartData.map((point, i) => {
                  const height =
                    ((point.value - minWeight) / (maxWeight - minWeight || 1)) *
                      80 +
                    10;
                  return (
                    <View key={i} style={styles.graphBarWrapper}>
                      <Text style={styles.graphValue}>{point.value}</Text>
                      <View
                        style={[styles.graphDot, { marginBottom: height }]}
                      />
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
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weightTabs}
          >
            {["1W", "1M", "3M", "6M"].map((tab) => (
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

          {chartData.length > 1 && (
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
                {weightDiff < 0 ? "▼" : "▲"} {Math.abs(weightDiff).toFixed(1)}{" "}
                kg this period
              </Text>
            </View>
          )}
        </View>

        {/* Ticket / Feedback */}
        <TouchableOpacity
          style={[
            styles.ticketBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/ticket" as any)}
        >
          <Ticket size={20} color={colors.primary} />
          <Text style={[styles.ticketText, { color: colors.text }]}>
            Submit Feedback / Support
          </Text>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.border }]}
          onPress={handleLogout}
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
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {editForm && (
                <>
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
                    value={birthdayInput}
                    onChangeText={handleBirthdayChange}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
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
                        onPress={() =>
                          setEditForm((p: any) => ({ ...p, sex: s }))
                        }
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
                    Height (cm)
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
                    value={String(editForm.height)}
                    onChangeText={(v) =>
                      setEditForm((p: any) => ({ ...p, height: v }))
                    }
                    placeholder="e.g. 170"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
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
                    value={String(editForm.weight)}
                    onChangeText={(v) =>
                      setEditForm((p: any) => ({ ...p, weight: v }))
                    }
                    placeholder="e.g. 69.39"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
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
                          editForm.dietary_goal === goal && styles.chipActive,
                        ]}
                        onPress={() =>
                          setEditForm((p: any) => ({
                            ...p,
                            dietary_goal: goal,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: colors.textSecondary },
                            editForm.dietary_goal === goal &&
                              styles.chipTextActive,
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
                        editForm.activity_level === level &&
                          styles.optionBtnActive,
                      ]}
                      onPress={() =>
                        setEditForm((p: any) => ({
                          ...p,
                          activity_level: level,
                        }))
                      }
                    >
                      <View style={styles.optionCheck}>
                        {editForm.activity_level === level && (
                          <Check size={14} color="#4CAF50" strokeWidth={3} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.textSecondary },
                        ]}
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
                          editForm.allergens.includes(item) &&
                            styles.chipActive,
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

                  <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={saveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

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
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
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
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoIconBox: { width: 28, alignItems: "flex-start" },
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
  ticketText: { flex: 1, fontSize: 14, fontWeight: "600" },
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
  optionCheck: { width: 20, alignItems: "center" },
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

