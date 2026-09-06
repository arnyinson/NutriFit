import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerAndSavePushToken } from "../../constants/pushNotifications";
import { useRouter } from "expo-router";
import {
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

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
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("Home");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [goalCalories, setGoalCalories] = useState(2000);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [todayWorkoutFocus, setTodayWorkoutFocus] = useState("Rest Day");
  const [todayExercises, setTodayExercises] = useState<ExerciseEntry[]>([]);
  const [todayFoodLogs, setTodayFoodLogs] = useState<FoodLogEntry[]>([]);

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
    try {
      // Get cached user for instant greeting
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setUserName(parsed.name || "");
        setAvatarUrl(parsed.avatar_url || null);
        if (parsed.tdee) setGoalCalories(toNumber(parsed.tdee));
      }

      // Refresh profile
      const profileRes = await api.get("/users/me");
      const user = profileRes.data.user;
      setUserName(user.name);
      setAvatarUrl(user.avatar_url || null);
      if (user.tdee) setGoalCalories(toNumber(user.tdee));
      await AsyncStorage.setItem("user", JSON.stringify(user));

      const todayDate = getTodayDateString();

      // Gamitin ang naka-save na plan mode preference (Weekly o Continuous)
      const savedMode = await AsyncStorage.getItem(MEAL_PLAN_MODE_KEY);
      const mealMode: "weekly" | "continuous" =
        savedMode === "continuous" ? "continuous" : "weekly";

      // Get meal plan
      let mealPlanRes = await api.get("/meals/plan/me", {
        params: { mode: mealMode },
      });
      if (
        !mealPlanRes.data.mealPlan ||
        mealPlanRes.data.mealPlan.length === 0
      ) {
        await api.post("/meals/plan/generate", { mode: mealMode });
        mealPlanRes = await api.get("/meals/plan/me", {
          params: { mode: mealMode },
        });
      }
      const todayEntry = mealPlanRes.data.mealPlan.find(
        (d: any) => d.date === todayDate,
      );
      setTodayMeals(todayEntry ? todayEntry.meals : []);

      // Get manually logged food ("Log Outside Food") for today
      const foodLogsRes = await api.get("/meals/log", {
        params: { date: todayDate },
      });
      setTodayFoodLogs(foodLogsRes.data.foodLogs || []);

      // Get workout plan
      let workoutPlanRes = await api.get("/workouts/plan/me");
      if (
        !workoutPlanRes.data.workoutPlan ||
        workoutPlanRes.data.workoutPlan.length === 0
      ) {
        await api.post("/workouts/plan/generate", {
          mode: "weekly",
          experience_level: "Beginner",
          available_equipment: ["Bodyweight", "Dumbbell"],
        });
        workoutPlanRes = await api.get("/workouts/plan/me");
      }
      const todayDayName = getTodayDayName();
      const todayWorkoutEntry = workoutPlanRes.data.workoutPlan.find(
        (d: any) => d.day === todayDayName,
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
    } catch (err) {
      console.error("Dashboard load error:", err);
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

  const toggleMeal = async (planId: string, currentlyTaken: boolean) => {
    // Optimistic UI update
    setTodayMeals((prev) =>
      prev.map((m) =>
        m.plan_id === planId ? { ...m, taken: !currentlyTaken } : m,
      ),
    );
    try {
      await api.patch(`/meals/plan/${planId}/toggle`, {
        taken: !currentlyTaken,
      });
    } catch (err) {
      console.error("Toggle meal error:", err);
      // revert on failure
      setTodayMeals((prev) =>
        prev.map((m) =>
          m.plan_id === planId ? { ...m, taken: currentlyTaken } : m,
        ),
      );
    }
  };

  const takeAllMeals = async () => {
    const previous = todayMeals;
    setTodayMeals((prev) => prev.map((m) => ({ ...m, taken: true })));
    try {
      await Promise.all(
        previous
          .filter((m) => !m.taken)
          .map((m) =>
            api.patch(`/meals/plan/${m.plan_id}/toggle`, { taken: true }),
          ),
      );
    } catch (err) {
      console.error("Take all meals error:", err);
    }
  };

  const toggleWorkout = async (planId: string, currentlyDone: boolean) => {
    setTodayExercises((prev) =>
      prev.map((e) =>
        e.plan_id === planId ? { ...e, done: !currentlyDone } : e,
      ),
    );
    try {
      await api.patch(`/workouts/plan/${planId}/toggle`, {
        done: !currentlyDone,
      });
    } catch (err) {
      console.error("Toggle workout error:", err);
      setTodayExercises((prev) =>
        prev.map((e) =>
          e.plan_id === planId ? { ...e, done: currentlyDone } : e,
        ),
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
            <TouchableOpacity
              onPress={() => router.push("/calendar" as any)}
              style={styles.dateRow}
              hitSlop={HIT_SLOP}
            >
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {today}
              </Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
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
          {userName ? `, ${userName.split(" ")[0]}` : ""}
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textMuted }]}>
          {remainingCalories.toLocaleString()} kcal left of your{" "}
          {goalCalories.toLocaleString()} kcal goal
        </Text>

        {/* Calorie Card */}
        <View
          style={[
            styles.calorieCard,
            isGoalMet ? styles.calorieCardGreen : styles.calorieCardOrange,
          ]}
        >
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.calorieNumber}>
                {remainingCalories.toLocaleString()}
              </Text>
              <Text style={styles.calorieUnit}>kcal left</Text>
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
                onPress={takeAllMeals}
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
                    <Text style={[styles.mealType, { color: colors.text }]}>
                      {meal.meal_type}
                    </Text>
                    <Text
                      style={[styles.mealName, { color: colors.textMuted }]}
                    >
                      {meal.meal?.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.mealCalories,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ~{toNumber(meal.meal?.calories)} kcal
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      meal.taken ? styles.takenBtn : styles.takeBtn,
                    ]}
                    onPress={() => toggleMeal(meal.plan_id, meal.taken)}
                    hitSlop={HIT_SLOP}
                  >
                    <Text style={styles.actionBtnText}>
                      {meal.taken ? "Skip" : "Take"}
                    </Text>
                  </TouchableOpacity>
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
                    <Text style={[styles.mealType, { color: colors.text }]}>
                      Logged Food
                    </Text>
                    <Text
                      style={[styles.mealName, { color: colors.textMuted }]}
                    >
                      {log.food_name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.mealCalories,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ~{toNumber(log.calories)} kcal
                  </Text>
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
                  onPress={() => toggleWorkout(exercise.plan_id, exercise.done)}
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

        <View style={{ height: 80 }} />
      </ScrollView>

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
  mealInfo: { flex: 1 },
  mealType: { fontSize: 13, fontWeight: "700" },
  mealName: { fontSize: 11 },
  mealCalories: { fontSize: 12, marginRight: 4 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  takeBtn: { backgroundColor: "#4CAF50" },
  takenBtn: { backgroundColor: "#FF9800" },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
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
