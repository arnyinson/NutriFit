import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import {
  BarChart3,
  Check,
  ChevronLeft,
  Dumbbell,
  Home,
  RefreshCw,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import ConfirmModal from "../../components/ConfirmModal";
import SuccessModal from "../../components/SuccessModal";
import api from "../../constants/api";
import {
  apiGetCached,
  isNetworkError,
  mutate,
  patchCache,
} from "../../constants/offline";
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

type Profile = {
  id: string;
  birthday: string;
  sex: string;
  height: string;
  weight: string;
  dietary_goal: string;
  activity_level: string;
  allergens: string[];
  available_equipment: string[];
  tdee: string;
};

const PERIODS = [
  { key: "Daily", apiValue: "daily" },
  { key: "Weekly", apiValue: "weekly" },
  { key: "Monthly", apiValue: "monthly" },
] as const;

// Weight change smaller than this (kg) is treated as "stable"
const WEIGHT_STABLE_THRESHOLD = 0.3;

// The weight is NOT asked daily (panel feedback). The user is only prompted to
// re-enter it once per week; the value is saved to the profile so Stats and
// Profile always show the same weight.
const WEIGH_IN_INTERVAL_DAYS = 7;
const weighInKey = (userId: string) => `lastWeighIn:${userId}`;

// ~7700 kcal of surplus/deficit is roughly 1 kg of body weight
const KCAL_PER_KG = 7700;

const CHART_HEIGHT = 130;
const CHART_PAD_X = 8;
const CHART_PAD_TOP = 12;
const CHART_PAD_BOTTOM = 8;

const toISODate = (value: string) => {
  const d = new Date(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function ProgressScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState("Weekly");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const [weighInDue, setWeighInDue] = useState(false);
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showWeighInConfirm, setShowWeighInConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  const didAutoSync = useRef(false);

  const dietaryGoal = profile?.dietary_goal || "Maintenance";

  const loadSummary = useCallback(async (period: string) => {
    try {
      const apiPeriod =
        PERIODS.find((p) => p.key === period)?.apiValue || "weekly";
      // Saved stats show right away; fresh numbers replace them when they arrive
      await apiGetCached<any>(
        "/progress/weekly-summary",
        (data) => {
          if (data?.summary) setSummary(data.summary);
          setLoading(false);
        },
        { period: apiPeriod },
      );
    } catch (err) {
      console.error("Load summary error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const holder: { user: Profile | null } = { user: null };
      await apiGetCached<any>("/users/me", (data) => {
        holder.user = data.user as Profile;
        setProfile(holder.user);
      });
      if (!holder.user) return null;
      const profileUser: Profile = holder.user;

      // Decide whether the weekly weigh-in prompt is due. First time on this
      // device we just start the clock instead of nagging immediately.
      const key = weighInKey(profileUser.id);
      const stored = await AsyncStorage.getItem(key);
      if (!stored) {
        await AsyncStorage.setItem(key, String(Date.now()));
        setWeighInDue(false);
      } else {
        const days = (Date.now() - Number(stored)) / (1000 * 60 * 60 * 24);
        setWeighInDue(days >= WEIGH_IN_INTERVAL_DAYS);
      }
      return profileUser;
    } catch (err) {
      console.error("Load profile error:", err);
      return null;
    }
  }, []);

  // Real-time sync: instead of asking the user to type their weight and tap a
  // button every day, today's meal/workout/calorie stats are synced
  // automatically whenever this screen opens or is pulled to refresh. The
  // weight used is the one saved in the profile.
  const autoSync = useCallback(async (user: Profile | null) => {
    if (!user) return;
    const weight = parseFloat(user.weight);
    if (!Number.isFinite(weight) || weight <= 0) return;
    setSyncing(true);
    try {
      const savedMode = await AsyncStorage.getItem("mealPlanMode");
      const mode = savedMode === "continuous" ? "continuous" : "weekly";
      await api.post("/progress/sync-today", { weight, mode });
      setLastSynced(new Date());
    } catch (err) {
      // No signal is normal here; the saved stats are shown instead
      if (!isNetworkError(err)) console.error("Auto sync error:", err);
    } finally {
      setSyncing(false);
    }
  }, []);

  const refreshAll = useCallback(
    async (period: string) => {
      const user = await loadProfile();
      await autoSync(user);
      await loadSummary(period);
    },
    [loadProfile, autoSync, loadSummary],
  );

  // First open: profile -> sync -> summary
  useEffect(() => {
    if (didAutoSync.current) return;
    didAutoSync.current = true;
    refreshAll(activePeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switching Daily / Weekly / Monthly only re-reads the summary
  const firstPeriodRun = useRef(true);
  useEffect(() => {
    if (firstPeriodRun.current) {
      firstPeriodRun.current = false;
      return;
    }
    setLoading(true);
    loadSummary(activePeriod);
  }, [activePeriod, loadSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshAll(activePeriod);
  };

  const openWeighIn = () => {
    setWeightInput(profile?.weight ? String(profile.weight) : "");
    setShowWeighInModal(true);
  };

  const handleWeighInSubmit = () => {
    const w = parseFloat(weightInput);
    if (!weightInput || isNaN(w) || w < 20 || w > 300) {
      Alert.alert("Error", "Please enter a realistic weight (20–300 kg).");
      return;
    }
    setShowWeighInConfirm(true);
  };

  // Saves the new weight to the PROFILE (single source of truth), logs it to the
  // weight history, then re-syncs the stats.
  const performWeighIn = async () => {
    if (!profile) return;
    const weightKg = parseFloat(weightInput);
    setSavingWeight(true);
    try {
      // Offline? Both are saved on the phone and sent, in order, when back online.
      const { queued } = await mutate("put", "/users/me", {
        birthday: toISODate(profile.birthday),
        sex: profile.sex,
        height: parseFloat(profile.height),
        weight: weightKg,
        dietary_goal: profile.dietary_goal,
        activity_level: profile.activity_level,
        allergens: profile.allergens,
        available_equipment: profile.available_equipment,
      });
      await mutate("post", "/progress/log", { weight: weightKg });
      await AsyncStorage.setItem(weighInKey(profile.id), String(Date.now()));
      setWeighInDue(false);
      setShowWeighInModal(false);

      if (queued) {
        // Show the new weight right away and keep the saved profile in step
        setProfile({ ...profile, weight: String(weightKg) });
        await patchCache<any>("/users/me", (data) => ({
          ...data,
          user: { ...data.user, weight: String(weightKg) },
        }));
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                bodyProgress: { ...prev.bodyProgress, current: weightKg },
              }
            : prev,
        );
        Alert.alert(
          "Saved offline",
          "Your new weight will be saved to your profile when you're back online.",
        );
        return;
      }

      const user = await loadProfile();
      await autoSync(user);
      await loadSummary(activePeriod);
      setShowSuccessModal(true);
    } catch (err: any) {
      const message =
        err.response?.data?.error || "Unable to save weight. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSavingWeight(false);
    }
  };

  // Arrow symbol + color for the weight change, based on the dietary goal:
  // - Maintenance: stable = green, any big change = red
  // - Cutting: down = green, up = red
  // - Bulking: up = green, down = red
  const getWeightChangeDisplay = (change: number, goal: string) => {
    const isStable = Math.abs(change) < WEIGHT_STABLE_THRESHOLD;

    if (goal === "Cutting") {
      if (isStable) return { symbol: "~", color: "#9E9E9E" };
      return change < 0
        ? { symbol: "▼", color: "#4CAF50" }
        : { symbol: "▲", color: "#F44336" };
    }
    if (goal === "Bulking") {
      if (isStable) return { symbol: "~", color: "#9E9E9E" };
      return change > 0
        ? { symbol: "▲", color: "#4CAF50" }
        : { symbol: "▼", color: "#F44336" };
    }
    if (isStable) return { symbol: "~", color: "#4CAF50" };
    return change < 0
      ? { symbol: "▼", color: "#F44336" }
      : { symbol: "▲", color: "#F44336" };
  };

  if (!loading && !summary) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          },
        ]}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 14,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Unable to load your stats. Check your connection and try again.
        </Text>
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={() => {
            setLoading(true);
            refreshAll(activePeriod);
          }}
        >
          <Text style={styles.syncBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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

  const days = summary.dailyCalories;
  const hasData = days.length > 0;
  const loggedDays = days.filter((d) => d.actual > 0);

  // ---- Single line chart: target vs actual calories ----
  const maxCalorie = hasData
    ? Math.max(...days.map((d) => Math.max(d.target, d.actual)), 1)
    : 1;
  const innerW = Math.max(chartWidth - CHART_PAD_X * 2, 1);
  const innerH = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const xAt = (i: number) =>
    days.length === 1
      ? chartWidth / 2
      : CHART_PAD_X + (innerW / (days.length - 1)) * i;
  const yAt = (v: number) => CHART_PAD_TOP + innerH - (v / maxCalorie) * innerH;
  const pathFor = (key: "target" | "actual") =>
    days
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(d[key])}`)
      .join(" ");
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));

  // ---- Forecast (energy balance estimate) ----
  const tdee = parseFloat(profile?.tdee || "");
  const avgActual = summary.calorieAdherence.actual;
  let forecast: {
    perWeek: number;
    in4Weeks: number;
    text: string;
  } | null = null;
  if (
    Number.isFinite(tdee) &&
    tdee > 0 &&
    avgActual > 0 &&
    loggedDays.length >= 1
  ) {
    const perWeek = ((avgActual - tdee) * 7) / KCAL_PER_KG;
    const current = summary.bodyProgress.current;
    const in4Weeks = Math.round((current + perWeek * 4) * 10) / 10;
    const dir =
      Math.abs(perWeek) < 0.05
        ? "stay about the same"
        : perWeek > 0
          ? `gain about ${perWeek.toFixed(2)} kg per week`
          : `lose about ${Math.abs(perWeek).toFixed(2)} kg per week`;
    forecast = {
      perWeek,
      in4Weeks,
      text: `If you keep eating like this, you will ${dir}.`,
    };
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const monthStart = new Date(today);
  monthStart.setDate(today.getDate() - 29);

  const dateRangeLabel =
    activePeriod === "Daily"
      ? today.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      : activePeriod === "Monthly"
        ? `${monthStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const summaryLabel =
    activePeriod === "Daily"
      ? "Today's Summary"
      : activePeriod === "Monthly"
        ? "Month Summary"
        : "Week Summary";

  const periodBadgeLabel =
    activePeriod === "Daily"
      ? "Today"
      : activePeriod === "Monthly"
        ? "This Month"
        : "This Week";

  const insightsTitle =
    activePeriod === "Daily"
      ? "Insights Today"
      : activePeriod === "Monthly"
        ? "Insights This Month"
        : "Insights This Week";

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
    recommendations.push("Great workout consistency this period");
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

  const weightChangeDisplay = getWeightChangeDisplay(
    summary.bodyProgress.change,
    dietaryGoal,
  );

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

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
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodBtn,
                activePeriod === p.key && styles.periodBtnActive,
              ]}
              onPress={() => setActivePeriod(p.key)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: colors.textMuted },
                  activePeriod === p.key && styles.periodTextActive,
                ]}
              >
                {p.key}
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
        {/* Period Label */}
        <View style={styles.weekHeader}>
          <View>
            <Text style={[styles.weekLabel, { color: colors.text }]}>
              {summaryLabel}
            </Text>
            <Text style={[styles.weekDate, { color: colors.textMuted }]}>
              {dateRangeLabel}
            </Text>
          </View>
          <View style={styles.phaseBadge}>
            <Target size={13} color="#4CAF50" />
            <Text style={styles.phaseText}>{periodBadgeLabel}</Text>
          </View>
        </View>

        {/* Sync status — stats sync automatically, no daily weight entry */}
        <View style={styles.syncRow}>
          <RefreshCw size={12} color={colors.textMuted} />
          <Text style={[styles.syncText, { color: colors.textMuted }]}>
            {syncing
              ? "Syncing today's stats..."
              : lastSynced
                ? `Synced ${lastSynced.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · pull down to refresh`
                : "Pull down to sync"}
          </Text>
        </View>

        {/* Weekly weigh-in prompt */}
        {weighInDue && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#2A2113" : "#FFF8E1",
                borderColor: "#FF9800",
              },
            ]}
          >
            <View style={styles.weighInHeader}>
              <Scale size={18} color="#FF9800" />
              <Text style={[styles.weighInTitle, { color: colors.text }]}>
                Time for your weekly weigh-in
              </Text>
            </View>
            <Text style={[styles.weighInBody, { color: colors.textSecondary }]}>
              Your weight may have changed this week. Enter your current weight
              so your targets and progress stay accurate. It will also update
              your profile.
            </Text>
            <TouchableOpacity style={styles.weighInBtn} onPress={openWeighIn}>
              <Text style={styles.weighInBtnText}>Update my weight</Text>
            </TouchableOpacity>
          </View>
        )}

        {!hasData ? (
          <View
            style={[
              ...cardStyle,
              { alignItems: "center", paddingVertical: 40 },
            ]}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              No records for this period yet. Log your meals and workouts and
              they will appear here automatically.
            </Text>
          </View>
        ) : (
          <>
            {/* Summary numbers (no extra charts) */}
            <View style={cardStyle}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Overview
              </Text>
              <View style={styles.tileRow}>
                <View
                  style={[
                    styles.tile,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.tileLabel, { color: colors.textMuted }]}>
                    Weight
                  </Text>
                  <Text style={[styles.tileValue, { color: colors.text }]}>
                    {summary.bodyProgress.current} kg
                  </Text>
                  <Text
                    style={[
                      styles.tileSub,
                      { color: weightChangeDisplay.color },
                    ]}
                  >
                    {weightChangeDisplay.symbol}{" "}
                    {Math.abs(summary.bodyProgress.change)} kg
                  </Text>
                </View>
                <View
                  style={[
                    styles.tile,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.tileLabel, { color: colors.textMuted }]}>
                    Calories vs target
                  </Text>
                  <Text style={[styles.tileValue, { color: colors.text }]}>
                    {summary.calorieAdherence.percentage}%
                  </Text>
                  <Text style={[styles.tileSub, { color: colors.textMuted }]}>
                    {summary.calorieAdherence.actual.toLocaleString()} /{" "}
                    {summary.calorieAdherence.target.toLocaleString()} kcal
                  </Text>
                </View>
              </View>
              <View style={[styles.tileRow, { marginTop: 10 }]}>
                <View
                  style={[
                    styles.tile,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Dumbbell size={16} color={colors.text} />
                  <Text style={[styles.tileValue, { color: colors.text }]}>
                    {summary.workoutCompletion}%
                  </Text>
                  <Text style={[styles.tileSub, { color: colors.textMuted }]}>
                    Workout completion
                  </Text>
                </View>
                <View
                  style={[
                    styles.tile,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Utensils size={16} color={colors.text} />
                  <Text style={[styles.tileValue, { color: colors.text }]}>
                    {summary.mealConsistency}%
                  </Text>
                  <Text style={[styles.tileSub, { color: colors.textMuted }]}>
                    Meal consistency
                  </Text>
                </View>
              </View>
              <Text style={[styles.macroLine, { color: colors.textMuted }]}>
                Avg macros: Protein {summary.macros.protein}% · Carbs{" "}
                {summary.macros.carbs}% · Fats {summary.macros.fats}%
              </Text>
            </View>

            {/* The ONE chart: calories (actual vs target) */}
            <View style={cardStyle}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Calorie Intake
              </Text>
              {days.length > 1 ? (
                <View
                  onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
                >
                  {chartWidth > 0 && (
                    <Svg width={chartWidth} height={CHART_HEIGHT}>
                      {[0, 0.5, 1].map((t) => (
                        <Line
                          key={t}
                          x1={CHART_PAD_X}
                          x2={chartWidth - CHART_PAD_X}
                          y1={CHART_PAD_TOP + innerH * t}
                          y2={CHART_PAD_TOP + innerH * t}
                          stroke={colors.border}
                          strokeWidth={1}
                        />
                      ))}
                      <Path
                        d={pathFor("target")}
                        stroke={colors.textMuted}
                        strokeWidth={2}
                        strokeDasharray="5,4"
                        fill="none"
                      />
                      <Path
                        d={pathFor("actual")}
                        stroke="#4CAF50"
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {days.map((d, i) => (
                        <Circle
                          key={i}
                          cx={xAt(i)}
                          cy={yAt(d.actual)}
                          r={3.5}
                          fill={d.actual > d.target ? "#FF9800" : "#4CAF50"}
                        />
                      ))}
                    </Svg>
                  )}
                  <View style={styles.axisRow}>
                    {days.map((d, i) => (
                      <Text
                        key={i}
                        style={[styles.axisLabel, { color: colors.textMuted }]}
                      >
                        {i % labelEvery === 0 ? d.day : ""}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  A trend line needs at least 2 days. See today&apos;s record
                  below.
                </Text>
              )}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendLine,
                      { backgroundColor: colors.textMuted },
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
                    Under / on target
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

            {/* Records: one row per day, for Daily / Weekly / Monthly */}
            <View style={cardStyle}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {activePeriod === "Daily" ? "Today's Record" : "Daily Records"}
              </Text>
              {[...days].reverse().map((d, i) => {
                const isOver = d.actual > d.target;
                const noLog = d.actual === 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.recordRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.recordDay, { color: colors.text }]}>
                      {d.day}
                    </Text>
                    <Text
                      style={[
                        styles.recordKcal,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {d.actual.toLocaleString()} / {d.target.toLocaleString()}{" "}
                      kcal
                    </Text>
                    <View
                      style={[
                        styles.recordBadge,
                        {
                          backgroundColor: noLog
                            ? colors.input
                            : isOver
                              ? "#FFF3E0"
                              : "#E8F5E9",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: noLog
                            ? colors.textMuted
                            : isOver
                              ? "#FF9800"
                              : "#4CAF50",
                        }}
                      >
                        {noLog ? "No log" : isOver ? "Over" : "On track"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Forecast */}
            <View style={cardStyle}>
              <View style={styles.weighInHeader}>
                {forecast && forecast.perWeek < 0 ? (
                  <TrendingDown size={18} color="#4CAF50" />
                ) : (
                  <TrendingUp size={18} color="#4CAF50" />
                )}
                <Text
                  style={[
                    styles.cardTitle,
                    { color: colors.text, marginBottom: 0 },
                  ]}
                >
                  Forecast
                </Text>
              </View>
              {forecast ? (
                <>
                  <Text
                    style={[
                      styles.forecastText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {forecast.text}
                  </Text>
                  <Text style={[styles.forecastValue, { color: colors.text }]}>
                    ≈ {forecast.in4Weeks} kg in 4 weeks
                  </Text>
                  <Text
                    style={[styles.forecastNote, { color: colors.textMuted }]}
                  >
                    Estimate only, based on your average logged calories versus
                    your TDEE. Real results vary.
                  </Text>
                </>
              ) : (
                <Text
                  style={[styles.forecastText, { color: colors.textMuted }]}
                >
                  Log your meals for a few days to see a weight forecast.
                </Text>
              )}
            </View>

            {/* Insights */}
            <View
              style={[
                styles.card,
                styles.recommendCard,
                {
                  backgroundColor: isDark ? "#16281C" : "#F1F8E9",
                  borderColor: "#4CAF50",
                },
              ]}
            >
              <View style={styles.recommendHeader}>
                <View style={styles.recommendDot} />
                <Text style={[styles.recommendTitle, { color: colors.text }]}>
                  {insightsTitle}
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

        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* Weekly Weigh-in Modal */}
      <Modal
        visible={showWeighInModal}
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
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.card,
                  paddingBottom: 24 + insets.bottom,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Weekly Weigh-in
                </Text>
                <TouchableOpacity
                  onPress={() => setShowWeighInModal(false)}
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
                Enter your current weight. It will be saved to your profile and
                used for your progress.
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
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9.]/g, "");
                    const parts = cleaned.split(".");
                    if (parts.length > 2) {
                      cleaned = parts[0] + "." + parts.slice(1).join("");
                    }
                    setWeightInput(cleaned);
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!savingWeight}
                  autoFocus
                />
                <Text style={[styles.inputUnit, { color: colors.textMuted }]}>
                  kg
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.syncBtn, savingWeight && { opacity: 0.7 }]}
                onPress={handleWeighInSubmit}
                disabled={savingWeight}
              >
                {savingWeight ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.syncBtnText}>Save Weight</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        title="Success"
        message="Your weight has been updated!"
        onClose={() => setShowSuccessModal(false)}
      />

      <ConfirmModal
        visible={showWeighInConfirm}
        title="Confirm Weight"
        message={`Save ${weightInput} kg as your current weight?`}
        confirmLabel="Save"
        onConfirm={() => {
          setShowWeighInConfirm(false);
          performWeighIn();
        }}
        onCancel={() => setShowWeighInConfirm(false)}
      />

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.navBg,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 6,
            height: 56 + insets.bottom,
          },
        ]}
      >
        {[
          { name: "Home", Icon: Home, route: "/dashboard" },
          { name: "Stats", Icon: BarChart3, route: "/progress" },
          { name: "Meal", Icon: Utensils, route: "/meal" },
          { name: "Workout", Icon: Dumbbell, route: "/workout" },
          { name: "Profile", Icon: User, route: "/profile" },
        ].map((tab) => {
          const isActive = pathname === tab.route;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => router.push(tab.route as any)}
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
  recommendCard: {},
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
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  syncText: { fontSize: 11 },
  weighInHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  weighInTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  weighInBody: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  weighInBtn: {
    backgroundColor: "#FF9800",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  weighInBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tileRow: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  tileLabel: { fontSize: 11, marginBottom: 4 },
  tileValue: { fontSize: 20, fontWeight: "bold", marginVertical: 2 },
  tileSub: { fontSize: 11, textAlign: "center" },
  macroLine: { fontSize: 11, textAlign: "center", marginTop: 12 },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  axisLabel: { fontSize: 9, flex: 1, textAlign: "center" },
  legendLine: { width: 14, height: 3, borderRadius: 2 },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  recordDay: { width: 70, fontSize: 13, fontWeight: "600" },
  recordKcal: { flex: 1, fontSize: 12 },
  recordBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  forecastText: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  forecastValue: { fontSize: 20, fontWeight: "bold", marginTop: 8 },
  forecastNote: { fontSize: 11, marginTop: 8, lineHeight: 16 },
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
