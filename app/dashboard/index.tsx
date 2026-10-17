import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  Home,
  Moon,
  Plus,
  Sun,
  Sunrise,
  Trophy,
  User,
  Utensils,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ConfirmModal from "../../components/ConfirmModal";
import NavBadge from "../../components/NavBadge";
import api from "../../constants/api";
import {
  loadWithCache,
  mutate,
  patchCachePrefix,
} from "../../constants/offline";
import { registerAndSavePushToken } from "../../constants/pushNotifications";
import { useTheme } from "../../constants/theme";
import { useUnreadCount } from "../../constants/unread";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type MealEntry = {
  plan_id: string;
  meal_type: string;
  taken: boolean;
  skipped: boolean;
  meal: {
    id: string;
    name: string;
    calories: number;
  };
};

type ExerciseEntry = {
  plan_id: string;
  sets: number;
  reps: string;
  done: boolean;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  };
};

type FoodLogEntry = {
  id: string;
  food_name: string;
  calories: number;
  weight_grams: number | null;
  logged_at: string;
};

const MEAL_PLAN_MODE_KEY = "mealPlanMode";

const mealTypeIcon = (type: string) => {
  if (type === "Breakfast") return Sunrise;
  if (type === "Lunch") return Sun;
  return Moon;
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDayName = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" });

const toNumber = (value: unknown) => parseFloat(String(value ?? 0)) || 0;

export default function DashboardScreen() {
  const router = useRouter();
  const unreadCount = useUnreadCount();
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userName, setUserName] = useState(""); // full name
  const [username, setUsername] = useState(""); // login username (used in greeting)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [goalCalories, setGoalCalories] = useState(2000);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [todayWorkoutFocus, setTodayWorkoutFocus] = useState("Rest Day");
  const [todayExercises, setTodayExercises] = useState<ExerciseEntry[]>([]);
  const [todayFoodLogs, setTodayFoodLogs] = useState<FoodLogEntry[]>([]);

  // Meal Take/Skip confirmation — "Take" ay PERMANENTE (hindi na mababago
  // pagkatapos), pero ang "Skip" ay REVERSIBLE (baka kainin pa rin nila mamaya)
  const [showMealConfirm, setShowMealConfirm] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{
    type: "single" | "all";
    action: "take" | "skip";
    entry?: MealEntry;
  } | null>(null);

  // Workout checkbox confirmation — one-way lang, hindi na maaaring i-uncheck
  // pagkatapos, parehong pattern ng Workout screen
  const [showWorkoutConfirm, setShowWorkoutConfirm] = useState(false);
  const [pendingWorkout, setPendingWorkout] = useState<ExerciseEntry | null>(
    null,
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const loadDashboardData = useCallback(async () => {
    const todayDate = getTodayDateString();
    let user: any = null;

    // Saved user first, for an instant greeting
    try {
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        user = JSON.parse(cachedUser);
        setUserName(user.name || "");
        setUsername(user.username || "");
        setAvatarUrl(user.avatar_url || null);
        if (user.tdee) setGoalCalories(toNumber(user.tdee));
      }
    } catch {
      // ignore unreadable saved user
    }

    // Each section loads on its own and shows saved data first. One slow or failed
    // request no longer blocks the rest of the screen.
    const loadProfile = async () => {
      try {
        const profileRes = await api.get("/users/me");
        user = profileRes.data.user;
        setUserName(user.name);
        setUsername(user.username || "");
        setAvatarUrl(user.avatar_url || null);
        if (user.tdee) setGoalCalories(toNumber(user.tdee));
        await AsyncStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        console.warn("Profile refresh skipped:", err);
      }
    };

    const loadMeals = async () => {
      try {
        // Gamitin ang naka-save na plan mode preference (Weekly o Continuous)
        const savedMode = await AsyncStorage.getItem(MEAL_PLAN_MODE_KEY);
        const mealMode: "weekly" | "continuous" =
          savedMode === "continuous" ? "continuous" : "weekly";

        await loadWithCache<any>(
          `/meals/plan/me?${JSON.stringify({ mode: mealMode })}`,
          async () => {
            let res = await api.get("/meals/plan/me", {
              params: { mode: mealMode },
            });
            if (!res.data.mealPlan || res.data.mealPlan.length === 0) {
              await api.post("/meals/plan/generate", { mode: mealMode });
              res = await api.get("/meals/plan/me", {
                params: { mode: mealMode },
              });
            }
            return res.data;
          },
          (data) => {
            const todayEntry = (data.mealPlan || []).find(
              (d: any) => d.date === todayDate,
            );
            setTodayMeals(todayEntry ? todayEntry.meals : []);
            setLoading(false);
          },
        );
      } catch (err) {
        console.warn("Meal plan load skipped:", err);
      }
    };

    // Manually logged food ("Log Outside Food") for today
    const loadFoodLogs = async () => {
      try {
        await loadWithCache<any>(
          `/meals/log?${JSON.stringify({ date: todayDate })}`,
          async () =>
            (await api.get("/meals/log", { params: { date: todayDate } })).data,
          (data) => setTodayFoodLogs(data.foodLogs || []),
        );
      } catch (err) {
        console.warn("Food logs load skipped:", err);
      }
    };

    const loadWorkout = async () => {
      try {
        await loadWithCache<any>(
          "/workouts/plan/me",
          async () => {
            let res = await api.get("/workouts/plan/me");
            if (!res.data.workoutPlan || res.data.workoutPlan.length === 0) {
              // Use the equipment saved in the user's profile instead of a hardcoded list
              const savedEquipment = user?.available_equipment;
              await api.post("/workouts/plan/generate", {
                mode: "weekly",
                experience_level: "Beginner",
                available_equipment:
                  Array.isArray(savedEquipment) && savedEquipment.length > 0
                    ? savedEquipment
                    : ["Bodyweight"],
              });
              res = await api.get("/workouts/plan/me");
            }
            return res.data;
          },
          (data) => {
            const todayWorkoutEntry = (data.workoutPlan || []).find(
              (d: any) => d.day === getTodayDayName(),
            );
            if (todayWorkoutEntry && todayWorkoutEntry.exercises.length > 0) {
              setTodayExercises(todayWorkoutEntry.exercises);
              const muscleGroups = [
                ...new Set(
                  todayWorkoutEntry.exercises.map(
                    (e: ExerciseEntry) => e.exercise.muscle_group,
                  ),
                ),
              ];
              setTodayWorkoutFocus(muscleGroups.join(" + "));
            } else {
              setTodayExercises([]);
              setTodayWorkoutFocus("Rest Day");
            }
            setLoading(false);
          },
        );
      } catch (err) {
        console.warn("Workout plan load skipped:", err);
      }
    };

    try {
      await Promise.all([
        loadProfile(),
        loadMeals(),
        loadFoodLogs(),
        loadWorkout(),
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    registerAndSavePushToken();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Keep the saved plans in step with what the user just did, so the Meal screen
  // and the next app start show the same thing even when offline.
  const patchMealCaches = (updater: (m: any) => any) =>
    patchCachePrefix<any>("/meals/plan/me", (data) => ({
      ...data,
      mealPlan: (data.mealPlan || []).map((d: any) => ({
        ...d,
        meals: (d.meals || []).map(updater),
      })),
    }));

  // "Take" — PERMANENTE, hindi na maaaring bawiin pagkatapos
  const takeMeal = async (planId: string) => {
    setTodayMeals((prev) =>
      prev.map((m) =>
        m.plan_id === planId ? { ...m, taken: true, skipped: false } : m,
      ),
    );
    try {
      // Offline? It is saved on the phone and sent when the connection is back.
      await mutate("patch", `/meals/plan/${planId}/toggle`, { taken: true });
      await patchMealCaches((m) =>
        m.plan_id === planId ? { ...m, taken: true, skipped: false } : m,
      );
    } catch (err) {
      console.error("Take meal error:", err);
      setTodayMeals((prev) =>
        prev.map((m) =>
          m.plan_id === planId ? { ...m, taken: false, skipped: false } : m,
        ),
      );
    }
  };

  // "Skip" — REVERSIBLE, palaging ipapakita pa rin ang "Take" button pagkatapos
  const skipMeal = async (planId: string) => {
    setTodayMeals((prev) =>
      prev.map((m) =>
        m.plan_id === planId ? { ...m, taken: false, skipped: true } : m,
      ),
    );
    try {
      await mutate("patch", `/meals/plan/${planId}/toggle`, { taken: false });
      await patchMealCaches((m) =>
        m.plan_id === planId ? { ...m, taken: false, skipped: true } : m,
      );
    } catch (err) {
      console.error("Skip meal error:", err);
      setTodayMeals((prev) =>
        prev.map((m) =>
          m.plan_id === planId ? { ...m, taken: false, skipped: false } : m,
        ),
      );
    }
  };

  const takeAllMeals = async () => {
    const previous = todayMeals;
    const ids = previous.filter((m) => !m.taken).map((m) => m.plan_id);
    setTodayMeals((prev) =>
      prev.map((m) => ({ ...m, taken: true, skipped: false })),
    );
    try {
      // One after another, so the saved offline queue keeps the order
      for (const planId of ids) {
        await mutate("patch", `/meals/plan/${planId}/toggle`, { taken: true });
      }
      await patchMealCaches((m) =>
        ids.includes(m.plan_id) ? { ...m, taken: true, skipped: false } : m,
      );
    } catch (err) {
      console.error("Take all meals error:", err);
      setTodayMeals(previous);
    }
  };

  // One-way lang — palaging done:true, hindi na maaaring i-uncheck pagkatapos
  const markWorkoutDone = async (planId: string) => {
    setTodayExercises((prev) =>
      prev.map((e) => (e.plan_id === planId ? { ...e, done: true } : e)),
    );
    try {
      await mutate("patch", `/workouts/plan/${planId}/toggle`, { done: true });
      await patchCachePrefix<any>("/workouts/plan/me", (data) => ({
        ...data,
        workoutPlan: (data.workoutPlan || []).map((d: any) => ({
          ...d,
          exercises: (d.exercises || []).map((e: any) =>
            e.plan_id === planId ? { ...e, done: true } : e,
          ),
        })),
      }));
    } catch (err) {
      console.error("Toggle workout error:", err);
      setTodayExercises((prev) =>
        prev.map((e) => (e.plan_id === planId ? { ...e, done: false } : e)),
      );
    }
  };

  const takenMealsTotal = todayMeals
    .filter((m) => m.taken)
    .reduce((sum, m) => sum + toNumber(m.meal?.calories), 0);

  const foodLogsTotal = todayFoodLogs.reduce(
    (sum, f) => sum + toNumber(f.calories),
    0,
  );

  const totalCalories = takenMealsTotal + foodLogsTotal;
  const remainingCalories = Math.max(goalCalories - totalCalories, 0);
  const percentageConsumed =
    goalCalories > 0 ? Math.round((totalCalories / goalCalories) * 100) : 0;
  const isGoalMet = percentageConsumed >= 90;

  // Over / under calorie warning (compared with the daily goal / TDEE)
  const OVER_LIMIT = 110; // % — clearly over the goal
  const UNDER_LIMIT = 80; // % — clearly under the goal late in the day
  const currentHour = new Date().getHours();
  const overBy = Math.round(totalCalories - goalCalories);
  const isOver = percentageConsumed > OVER_LIMIT;
  const isSlightlyOver = percentageConsumed > 100 && !isOver;
  const isUnder = currentHour >= 18 && percentageConsumed < UNDER_LIMIT;
  const calorieWarning = isOver
    ? {
        color: "#F44336",
        bg: "#FFEBEE",
        title: "You're over your calorie goal",
        message: `You've eaten about ${overBy.toLocaleString()} kcal more than your ${goalCalories.toLocaleString()} kcal goal today. Going over now and then is okay, but doing it often can lead to weight gain. Consider lighter meals for the rest of the day.`,
      }
    : isSlightlyOver
      ? {
          color: "#FF9800",
          bg: "#FFF3E0",
          title: "Slightly over your goal",
          message: `You're ${overBy.toLocaleString()} kcal above your goal. That's close enough, just keep an eye on your next meals.`,
        }
      : isUnder
        ? {
            color: "#2196F3",
            bg: "#E3F2FD",
            title: "You're under your calorie goal",
            message: `You're still ${remainingCalories.toLocaleString()} kcal short of your goal today. Eating too little for several days can slow your progress and energy. Consider a healthy snack or finishing your planned meals.`,
          }
        : null;

  const todayMealsTotal = todayMeals.reduce(
    (sum, m) => sum + toNumber(m.meal?.calories),
    0,
  );

  if (loading) {
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
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
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.push("/profile" as any)}
              hitSlop={HIT_SLOP}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>
                    {userName ? userName[0] : "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flexShrink: 1 }}>
              {userName ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 2,
                  }}
                >
                  {userName}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => router.push("/calendar" as any)}
                style={styles.dateRow}
                hitSlop={HIT_SLOP}
              >
                <Text
                  style={[styles.dateText, { color: colors.textSecondary }]}
                >
                  {today}
                </Text>
                <ChevronDown size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/achievements" as any)}
            hitSlop={HIT_SLOP}
          >
            <Trophy
              size={26}
              color="#FF9800"
              fill="#FF9800"
              fillOpacity={0.15}
            />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={[styles.greeting, { color: colors.text }]}>
          {getGreeting()}
          {username || userName
            ? `, ${username || userName.split(" ")[0]}`
            : ""}
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textMuted }]}>
          {isOver || isSlightlyOver
            ? `${Math.abs(overBy).toLocaleString()} kcal over your `
            : `${remainingCalories.toLocaleString()} kcal left of your `}
          {goalCalories.toLocaleString()} kcal goal
        </Text>

        {/* Calorie Card */}
        <View
          style={[
            styles.calorieCard,
            isOver
              ? styles.calorieCardRed
              : isGoalMet
                ? styles.calorieCardGreen
                : styles.calorieCardOrange,
          ]}
        >
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.calorieNumber}>
                {(isOver || isSlightlyOver
                  ? Math.abs(overBy)
                  : remainingCalories
                ).toLocaleString()}
              </Text>
              <Text style={styles.calorieUnit}>
                {isOver || isSlightlyOver ? "kcal over" : "kcal left"}
              </Text>
            </View>
          </View>
          <Text style={styles.percentageText}>
            {totalCalories.toLocaleString()} kcal consumed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(percentageConsumed, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.goalText}>
            {goalCalories.toLocaleString()} kcal daily goal
          </Text>
        </View>

        {/* Over / under calorie warning */}
        {calorieWarning && (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: calorieWarning.bg,
                borderLeftColor: calorieWarning.color,
              },
            ]}
          >
            <AlertTriangle size={18} color={calorieWarning.color} />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.warningTitle, { color: calorieWarning.color }]}
              >
                {calorieWarning.title}
              </Text>
              <Text style={styles.warningMessage}>
                {calorieWarning.message}
              </Text>
            </View>
          </View>
        )}

        {/* Today's Meal Plan */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {"Today's Meal Plan"}
            </Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.takeAllBtn}
                onPress={() => {
                  setPendingMeal({ type: "all", action: "take" });
                  setShowMealConfirm(true);
                }}
                hitSlop={HIT_SLOP}
              >
                <Text style={styles.takeAllText}>Take all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push("/meal" as any)}
                hitSlop={HIT_SLOP}
              >
                <Text style={styles.editText}>View Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {todayMeals.length === 0 ? (
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
                textAlign: "center",
                paddingVertical: 16,
              }}
            >
              No meals planned for today yet.
            </Text>
          ) : (
            todayMeals.map((meal) => {
              const MealIcon = mealTypeIcon(meal.meal_type);
              return (
                <View
                  key={meal.plan_id}
                  style={[
                    styles.mealRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[styles.mealIcon, { backgroundColor: colors.input }]}
                  >
                    <MealIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text
                      style={[styles.mealType, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {meal.meal_type}
                    </Text>
                    <Text
                      style={[styles.mealName, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {meal.meal?.name}
                    </Text>
                    <Text
                      style={[
                        styles.mealCalories,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ~{toNumber(meal.meal?.calories)} kcal
                    </Text>
                  </View>

                  {meal.taken ? (
                    <View style={styles.statusBadgeTaken}>
                      <Text style={styles.statusBadgeText}>Taken</Text>
                    </View>
                  ) : (
                    <View style={styles.actionBtnRow}>
                      {meal.skipped && (
                        <View style={styles.statusBadgeSkipped}>
                          <Text style={styles.statusBadgeText}>Skipped</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.takeBtn]}
                        onPress={() => {
                          setPendingMeal({
                            type: "single",
                            action: "take",
                            entry: meal,
                          });
                          setShowMealConfirm(true);
                        }}
                        hitSlop={HIT_SLOP}
                      >
                        <Text style={styles.actionBtnText}>Take</Text>
                      </TouchableOpacity>
                      {/* "Skip" ay REVERSIBLE — hindi na kailangan i-disable
                          kahit na-skip na, para maibalik pa rin ang isip */}
                      {!meal.skipped && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.skipBtn]}
                          onPress={() => {
                            setPendingMeal({
                              type: "single",
                              action: "skip",
                              entry: meal,
                            });
                            setShowMealConfirm(true);
                          }}
                          hitSlop={HIT_SLOP}
                        >
                          <Text style={styles.actionBtnText}>Skip</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Manually logged food ("Log Outside Food") */}
          {todayFoodLogs.length > 0 && (
            <>
              {todayFoodLogs.map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.mealRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[styles.mealIcon, { backgroundColor: colors.input }]}
                  >
                    <Plus size={18} color={colors.primary} />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text
                      style={[styles.mealType, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      Logged Food
                    </Text>
                    <Text
                      style={[styles.mealName, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {log.food_name}
                    </Text>
                    <Text
                      style={[
                        styles.mealCalories,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ~{toNumber(log.calories)} kcal
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {(todayMeals.length > 0 || todayFoodLogs.length > 0) && (
            <View style={styles.totalRow}>
              <Flame
                size={16}
                color="#FF9800"
                fill="#FF9800"
                fillOpacity={0.2}
              />
              <Text style={[styles.totalText, { color: colors.text }]}>
                Total kcal |{" "}
                {(todayMealsTotal + foodLogsTotal).toLocaleString()} kcal
              </Text>
            </View>
          )}
        </View>

        {/* Today's Workout Plan */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {"Today's Workout Plan"}
              {todayExercises.length > 0 ? ` - ${todayWorkoutFocus}` : ""}
            </Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push("/workout" as any)}
                hitSlop={HIT_SLOP}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>

          {todayExercises.length === 0 ? (
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
                textAlign: "center",
                paddingVertical: 16,
              }}
            >
              Rest day — no workout scheduled today.
            </Text>
          ) : (
            todayExercises.map((exercise) => (
              <View
                key={exercise.plan_id}
                style={[
                  styles.exerciseRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.exerciseBullet} />
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {exercise.exercise?.name}
                  </Text>
                  <Text
                    style={[styles.exerciseSets, { color: colors.textMuted }]}
                  >
                    {exercise.sets} sets x {exercise.reps}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.exerciseCheck,
                    { borderColor: colors.border },
                    exercise.done && styles.exerciseCheckDone,
                  ]}
                  onPress={() => {
                    // One-way lang — kapag naka-check na, wala nang magagawa
                    if (exercise.done) return;
                    setPendingWorkout(exercise);
                    setShowWorkoutConfirm(true);
                  }}
                  disabled={exercise.done}
                  hitSlop={HIT_SLOP}
                >
                  {exercise.done && (
                    <Check size={14} color="#fff" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* Meal Confirmation — Take (permanente) o Skip (reversible) */}
      <ConfirmModal
        visible={showMealConfirm}
        title={
          pendingMeal?.type === "all"
            ? "Take All Meals?"
            : pendingMeal?.action === "skip"
              ? "Skip This Meal?"
              : "Mark as Taken?"
        }
        message={
          pendingMeal?.type === "all"
            ? "This will mark all meals for today as taken. This cannot be undone."
            : pendingMeal?.action === "skip"
              ? `Skip "${pendingMeal?.entry?.meal?.name}"? You can still mark it as taken later.`
              : `Mark "${pendingMeal?.entry?.meal?.name}" as taken? This cannot be undone.`
        }
        confirmLabel="Confirm"
        onConfirm={() => {
          setShowMealConfirm(false);
          if (pendingMeal?.type === "all") {
            takeAllMeals();
          } else if (pendingMeal?.type === "single" && pendingMeal.entry) {
            if (pendingMeal.action === "skip") {
              skipMeal(pendingMeal.entry.plan_id);
            } else {
              takeMeal(pendingMeal.entry.plan_id);
            }
          }
          setPendingMeal(null);
        }}
        onCancel={() => {
          setShowMealConfirm(false);
          setPendingMeal(null);
        }}
      />

      {/* Workout Confirmation — one-way lang */}
      <ConfirmModal
        visible={showWorkoutConfirm}
        title="Mark as Done?"
        message={`Mark "${pendingWorkout?.exercise?.name}" as done? This cannot be undone.`}
        confirmLabel="Confirm"
        onConfirm={() => {
          setShowWorkoutConfirm(false);
          if (pendingWorkout) {
            markWorkoutDone(pendingWorkout.plan_id);
          }
          setPendingWorkout(null);
        }}
        onCancel={() => {
          setShowWorkoutConfirm(false);
          setPendingWorkout(null);
        }}
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
              <View>
                <tab.Icon
                  size={22}
                  color={isActive ? "#4CAF50" : colors.textMuted}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {tab.name === "Profile" && <NavBadge count={unreadCount} />}
              </View>
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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitial: { color: "#fff", fontWeight: "700", fontSize: 20 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 13, fontWeight: "500" },
  greeting: {
    fontSize: 26,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginTop: 4,
  },
  subGreeting: { fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },
  calorieCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  calorieCardOrange: { backgroundColor: "#FF9800" },
  calorieCardGreen: { backgroundColor: "#4CAF50" },
  calorieCardRed: { backgroundColor: "#F44336" },
  warningCard: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: "flex-start",
  },
  warningTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  warningMessage: { fontSize: 12, lineHeight: 18, color: "#424242" },
  ringOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  ringInner: { alignItems: "center" },
  calorieNumber: { fontSize: 30, fontWeight: "bold", color: "#fff" },
  calorieUnit: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  percentageText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: { height: 8, backgroundColor: "#fff", borderRadius: 4 },
  goalText: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  sectionActions: { flexDirection: "row", gap: 8 },
  takeAllBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  takeAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  editBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  mealInfo: { flex: 1, minWidth: 0 },
  mealType: { fontSize: 13, fontWeight: "700" },
  mealName: { fontSize: 11 },
  mealCalories: { fontSize: 11, marginTop: 2 },
  actionBtnRow: { flexDirection: "row", gap: 6, flexShrink: 0 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  takeBtn: { backgroundColor: "#4CAF50" },
  skipBtn: { backgroundColor: "#FF9800" },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statusBadgeTaken: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeSkipped: {
    backgroundColor: "#9E9E9E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  totalText: { fontSize: 13, fontWeight: "600" },
  seeAllBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  exerciseBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 13, fontWeight: "600" },
  exerciseSets: { fontSize: 11, marginTop: 2 },
  exerciseCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseCheckDone: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
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
