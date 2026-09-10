import { useRouter } from "expo-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  Dumbbell,
  Home,
  RefreshCw,
  Scale,
  Target,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type Summary = {
  dailyCalories: { day: string; target: number; actual: number }[];
  bodyProgress: { start: number; current: number; change: number };
  calorieAdherence: { target: number; actual: number; percentage: number };
  macros: { protein: number; carbs: number; fats: number };
  workoutCompletion: number;
  mealConsistency: number;
};

export default function ProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("Stats");
  const [activePeriod, setActivePeriod] = useState("Weekly");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/progress/weekly-summary");
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Load weekly summary error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  const openUpdateModal = async () => {
    // Pre-fill with the user's last known weight, for convenience
    try {
      const cached = await api.get("/users/me");
      if (cached.data.user?.weight) {
        setWeightInput(String(cached.data.user.weight));
      }
    } catch {
      // ignore, just leave the field blank
    }
    setShowUpdateModal(true);
  };

  const handleSyncProgress = async () => {
    const weightNum = parseFloat(weightInput);
    if (!weightInput || isNaN(weightNum) || weightNum <= 0) {
      Alert.alert("Error", "Please enter a valid weight.");
      return;
    }

    setSyncing(true);
    try {
      await api.post("/progress/sync-today", { weight: weightNum });
      setShowUpdateModal(false);
      await loadSummary();
      Alert.alert("Success", "Your progress has been updated!");
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        "Unable to update progress. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !summary) {
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

  const hasData = summary.dailyCalories.length > 0;
  const maxCalorie = hasData
    ? Math.max(
        ...summary.dailyCalories.map((d) => Math.max(d.target, d.actual)),
      )
    : 1;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const dateRangeLabel = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const recommendations: string[] = [];
  if (
    summary.calorieAdherence.percentage >= 90 &&
    summary.calorieAdherence.percentage <= 110
  ) {
    recommendations.push("Calorie intake is well aligned with your target");
  } else if (summary.calorieAdherence.percentage > 110) {
    recommendations.push("You are consistently over your calorie target");
  } else if (summary.calorieAdherence.percentage > 0) {
    recommendations.push("You are consistently under your calorie target");
  }
  if (summary.workoutCompletion >= 80) {
    recommendations.push("Great workout consistency this week");
  } else if (summary.workoutCompletion > 0) {
    recommendations.push("Try to complete more of your scheduled workouts");
  }
  if (summary.mealConsistency >= 80) {
    recommendations.push("Meal logging consistency is strong");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Log your meals and workouts daily to see personalized insights here",
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
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
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Status & Progress
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
          {["Weekly", "Monthly"].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodBtn,
                activePeriod === p && styles.periodBtnActive,
              ]}
              onPress={() => setActivePeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: colors.textMuted },
                  activePeriod === p && styles.periodTextActive,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
        {/* Week Label + Update Progress Button */}
        <View style={styles.weekHeader}>
          <View>
            <Text style={[styles.weekLabel, { color: colors.text }]}>
              Week Summary
            </Text>
            <Text style={[styles.weekDate, { color: colors.textMuted }]}>
              {dateRangeLabel}
            </Text>
          </View>
          <View style={styles.phaseBadge}>
            <Target size={13} color="#4CAF50" />
            <Text style={styles.phaseText}>This Week</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.updateBtn}
          onPress={openUpdateModal}
          hitSlop={HIT_SLOP}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.updateBtnText}>Update Progress</Text>
        </TouchableOpacity>

        {!hasData ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                alignItems: "center",
                paddingVertical: 40,
              },
            ]}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              No progress data logged yet this week. Tap &quot;Update
              Progress&quot; above to log your weight and sync today&apos;s
              stats.
            </Text>
          </View>
        ) : (
          <>
            {/* Body Progress */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Body Progress
              </Text>
              <View style={styles.bodyProgressRow}>
                <View style={styles.bodyStatBox}>
                  <Text
                    style={[styles.bodyStatLabel, { color: colors.textMuted }]}
                  >
                    Start
                  </Text>
                  <Text style={[styles.bodyStatValue, { color: colors.text }]}>
                    {summary.bodyProgress.start} kg
                  </Text>
                </View>
                <View style={styles.bodyArrow}>
                  <ArrowRight size={22} color={colors.border} />
                  <Text
                    style={[
                      styles.bodyChange,
                      {
                        color:
                          summary.bodyProgress.change < 0
                            ? "#4CAF50"
                            : "#F44336",
                      },
                    ]}
                  >
                    {summary.bodyProgress.change < 0 ? "▼" : "▲"}{" "}
                    {Math.abs(summary.bodyProgress.change)} kg
                  </Text>
                </View>
                <View style={styles.bodyStatBox}>
                  <Text
                    style={[styles.bodyStatLabel, { color: colors.textMuted }]}
                  >
                    Current
                  </Text>
                  <Text style={[styles.bodyStatValue, { color: colors.text }]}>
                    {summary.bodyProgress.current} kg
                  </Text>
                </View>
              </View>
            </View>

            {/* Calorie Adherence */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Calorie Adherence
              </Text>
              <View style={styles.calorieRow}>
                <View style={styles.calorieBox}>
                  <Text
                    style={[styles.calorieLabel, { color: colors.textMuted }]}
                  >
                    Target Avg
                  </Text>
                  <Text style={[styles.calorieValue, { color: colors.text }]}>
                    {summary.calorieAdherence.target.toLocaleString()} kcal
                  </Text>
                  <View
                    style={[
                      styles.calorieBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.calorieBarFill,
                        { width: "100%", backgroundColor: colors.border },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.caloriePercent}>
                  {summary.calorieAdherence.percentage}%
                </Text>
              </View>
              <View style={styles.calorieRow}>
                <View style={styles.calorieBox}>
                  <Text
                    style={[styles.calorieLabel, { color: colors.textMuted }]}
                  >
                    Actual Avg
                  </Text>
                  <Text style={[styles.calorieValue, { color: colors.text }]}>
                    {summary.calorieAdherence.actual.toLocaleString()} kcal
                  </Text>
                  <View
                    style={[
                      styles.calorieBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.calorieBarFill,
                        {
                          width: `${Math.min((summary.calorieAdherence.actual / (summary.calorieAdherence.target || 1)) * 100, 100)}%`,
                          backgroundColor: "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.caloriePercent}>
                  {summary.calorieAdherence.percentage}%
                </Text>
              </View>
            </View>

            {/* Daily Calorie Chart */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Daily Calorie Intake
              </Text>
              <View style={styles.barChart}>
                {summary.dailyCalories.map((day, i) => {
                  const targetH = (day.target / maxCalorie) * 80;
                  const actualH = (day.actual / maxCalorie) * 80;
                  const isOver = day.actual > day.target;
                  return (
                    <View key={i} style={styles.barGroup}>
                      <View style={styles.bars}>
                        <View
                          style={[
                            styles.bar,
                            { height: targetH, backgroundColor: colors.border },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            {
                              height: actualH,
                              backgroundColor: isOver ? "#FF9800" : "#4CAF50",
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.barLabel, { color: colors.textMuted }]}
                      >
                        {day.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <Text
                    style={[styles.legendText, { color: colors.textMuted }]}
                  >
                    Target
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
                  />
                  <Text
                    style={[styles.legendText, { color: colors.textMuted }]}
                  >
                    Under
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#FF9800" }]}
                  />
                  <Text
                    style={[styles.legendText, { color: colors.textMuted }]}
                  >
                    Over
                  </Text>
                </View>
              </View>
            </View>

            {/* Macronutrient Breakdown */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Macronutrient Breakdown
              </Text>
              <View style={styles.macroRow}>
                {[
                  {
                    label: "Protein",
                    value: summary.macros.protein,
                    color: "#4CAF50",
                  },
                  {
                    label: "Carbs",
                    value: summary.macros.carbs,
                    color: "#2196F3",
                  },
                  {
                    label: "Fats",
                    value: summary.macros.fats,
                    color: "#FF9800",
                  },
                ].map((macro) => (
                  <View key={macro.label} style={styles.macroBox}>
                    <View
                      style={[
                        styles.macroCircle,
                        { backgroundColor: colors.input },
                      ]}
                    >
                      <Text
                        style={[styles.macroPercent, { color: macro.color }]}
                      >
                        {macro.value}%
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.macroDot,
                        { backgroundColor: macro.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.macroLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {macro.label}
                    </Text>
                    <View
                      style={[
                        styles.macroBarContainer,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.macroBarFill,
                          {
                            width: `${macro.value}%`,
                            backgroundColor: macro.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Consistency */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Consistency
              </Text>
              <View style={styles.consistencyRow}>
                <View
                  style={[
                    styles.consistencyBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Dumbbell
                    size={22}
                    color={colors.text}
                    style={{ marginBottom: 6 }}
                  />
                  <Text
                    style={[styles.consistencyValue, { color: colors.text }]}
                  >
                    {summary.workoutCompletion}%
                  </Text>
                  <Text
                    style={[
                      styles.consistencyLabel,
                      { color: colors.textMuted },
                    ]}
                  >
                    Workout Completion
                  </Text>
                  <View
                    style={[
                      styles.consistencyBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.consistencyFill,
                        {
                          width: `${summary.workoutCompletion}%`,
                          backgroundColor: "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.consistencyBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Utensils
                    size={22}
                    color={colors.text}
                    style={{ marginBottom: 6 }}
                  />
                  <Text
                    style={[styles.consistencyValue, { color: colors.text }]}
                  >
                    {summary.mealConsistency}%
                  </Text>
                  <Text
                    style={[
                      styles.consistencyLabel,
                      { color: colors.textMuted },
                    ]}
                  >
                    Meal Consistency
                  </Text>
                  <View
                    style={[
                      styles.consistencyBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.consistencyFill,
                        {
                          width: `${summary.mealConsistency}%`,
                          backgroundColor: "#2196F3",
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Recommendation */}
            <View style={[styles.card, styles.recommendCard]}>
              <View style={styles.recommendHeader}>
                <View style={styles.recommendDot} />
                <Text style={[styles.recommendTitle, { color: colors.text }]}>
                  Insights This Week
                </Text>
              </View>
              {recommendations.map((rec, i) => (
                <View key={i} style={styles.recommendRow}>
                  <Check size={14} color="#4CAF50" strokeWidth={3} />
                  <Text
                    style={[
                      styles.recommendText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Update Progress Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Update Progress
                </Text>
                <TouchableOpacity
                  onPress={() => setShowUpdateModal(false)}
                  hitSlop={HIT_SLOP}
                >
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View
                style={[styles.iconCircle, { backgroundColor: colors.input }]}
              >
                <Scale size={26} color={colors.primary} />
              </View>

              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Enter your current weight. Your meal, workout, and calorie stats
                for today will be synced automatically.
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
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. 69.5"
                  placeholderTextColor={colors.textMuted}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                  editable={!syncing}
                  autoFocus
                />
                <Text style={[styles.inputUnit, { color: colors.textMuted }]}>
                  kg
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.syncBtn, syncing && { opacity: 0.7 }]}
                onPress={handleSyncProgress}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.syncBtnText}>Save & Sync Progress</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.navBg, borderTopColor: colors.border },
        ]}
      >
        {[
          { name: "Home", Icon: Home, route: "/dashboard" },
          { name: "Stats", Icon: BarChart3, route: "/progress" },
          { name: "Meal", Icon: Utensils, route: "/meal" },
          { name: "Exercise", Icon: Dumbbell, route: "/workout" },
          { name: "Profile", Icon: User, route: "/profile" },
        ].map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(tab.name);
                router.push(tab.route as any);
              }}
            >
              <tab.Icon
                size={22}
                color={isActive ? "#4CAF50" : colors.textMuted}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: colors.textMuted },
                  isActive && styles.navLabelActive,
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  periodRow: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  periodBtnActive: { backgroundColor: "#4CAF50" },
  periodText: { fontSize: 13, fontWeight: "600" },
  periodTextActive: { color: "#fff" },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  weekLabel: { fontSize: 16, fontWeight: "700" },
  weekDate: { fontSize: 12, marginTop: 2 },
  phaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseText: { fontSize: 12, color: "#4CAF50", fontWeight: "600" },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 12,
  },
  updateBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  card: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  bodyProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  bodyStatBox: { alignItems: "center" },
  bodyStatLabel: { fontSize: 12, marginBottom: 4 },
  bodyStatValue: { fontSize: 18, fontWeight: "bold" },
  bodyArrow: { alignItems: "center" },
  bodyChange: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  calorieBox: { flex: 1 },
  calorieLabel: { fontSize: 12, marginBottom: 4 },
  calorieValue: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  calorieBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  calorieBarFill: { height: 8, borderRadius: 4 },
  caloriePercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
    width: 45,
    textAlign: "right",
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 4,
    marginBottom: 10,
  },
  barGroup: { flex: 1, alignItems: "center" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 8, borderRadius: 4 },
  barLabel: { fontSize: 9, marginTop: 4 },
  legendRow: { flexDirection: "row", gap: 16, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  macroRow: { flexDirection: "row", gap: 10 },
  macroBox: { flex: 1, alignItems: "center" },
  macroCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#eee",
  },
  macroPercent: { fontSize: 16, fontWeight: "bold" },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  macroLabel: { fontSize: 12, marginBottom: 6 },
  macroBarContainer: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBarFill: { height: 6, borderRadius: 3 },
  consistencyRow: { flexDirection: "row", gap: 12 },
  consistencyBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  consistencyValue: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  consistencyLabel: { fontSize: 11, textAlign: "center", marginBottom: 8 },
  consistencyBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  consistencyFill: { height: 6, borderRadius: 3 },
  recommendCard: { borderColor: "#4CAF50", backgroundColor: "#F1F8E9" },
  recommendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  recommendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },
  recommendTitle: { fontSize: 15, fontWeight: "700" },
  recommendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recommendText: { fontSize: 13, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 20, fontWeight: "600" },
  inputUnit: { fontSize: 14, fontWeight: "600" },
  syncBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  syncBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  bottomNav: {
    flexDirection: "row",
    paddingVertical: 10,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { flex: 1, alignItems: "center" },
  navLabel: { fontSize: 11, marginTop: 2 },
  navLabelActive: { color: "#4CAF50", fontWeight: "700" },
});
