import { useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../constants/theme";

const meals = [
  {
    id: 1,
    type: "Breakfast",
    name: "Egg White Omelette + Oats",
    calories: 400,
    taken: false,
  },
  {
    id: 2,
    type: "Lunch",
    name: "Grilled Chicken + Brown Rice",
    calories: 550,
    taken: false,
  },
  {
    id: 3,
    type: "Dinner",
    name: "Tuna Salad + Sweet Potato",
    calories: 450,
    taken: false,
  },
];

const workouts = [
  { name: "Push Ups", sets: "4 sets x 12 reps" },
  { name: "Incline Push Ups", sets: "4 sets x 12 reps" },
  { name: "Chair Dips", sets: "3 sets x 10 reps" },
  { name: "Plank", sets: "3 sets x 45 sec" },
  { name: "Bicycle Crunch", sets: "3 sets x 20 reps" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [mealList, setMealList] = useState(meals);
  const [workoutList, setWorkoutList] = useState(
    workouts.map((w) => ({ ...w, done: false })),
  );
  const [activeTab, setActiveTab] = useState("Home");

  const totalCalories = 1450;
  const goalCalories = 3000;
  const percentage = Math.round((totalCalories / goalCalories) * 100);
  const isGoalMet = percentage >= 90;

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

  const toggleMeal = (id: number, action: "take" | "skip") => {
    setMealList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: action === "take" } : m)),
    );
  };

  const toggleWorkout = (index: number) => {
    setWorkoutList((prev) =>
      prev.map((w, i) => (i === index ? { ...w, done: !w.done } : w)),
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push("/profile" as any)}>
              <View style={styles.avatar} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/calendar" as any)}>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {today} ▼
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push("/achievements" as any)}>
            <Text style={styles.trophy}>🏆</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={[styles.greeting, { color: colors.text }]}>
          {getGreeting()}
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textMuted }]}>
          {"You're "}
          {percentage}% toward {"today's"} goal 🔥
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
                {totalCalories.toLocaleString()}
              </Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
          </View>
          <Text style={styles.percentageText}>{percentage}% of Daily Goal</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.goalText}>
            {goalCalories.toLocaleString()} kcal target
          </Text>
          <View style={styles.dotRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
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
                onPress={() =>
                  setMealList((prev) =>
                    prev.map((m) => ({ ...m, taken: true })),
                  )
                }
              >
                <Text style={styles.takeAllText}>Take all</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>Edit Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {mealList.map((meal) => (
            <View
              key={meal.id}
              style={[
                styles.mealRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[styles.mealIcon, { backgroundColor: colors.input }]}
              >
                <Text style={styles.mealEmoji}>
                  {meal.type === "Breakfast"
                    ? "🌅"
                    : meal.type === "Lunch"
                      ? "☀️"
                      : "🌙"}
                </Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={[styles.mealType, { color: colors.text }]}>
                  {meal.type}
                </Text>
                <Text style={[styles.mealName, { color: colors.textMuted }]}>
                  {meal.name}
                </Text>
              </View>
              <Text
                style={[styles.mealCalories, { color: colors.textSecondary }]}
              >
                ~{meal.calories} kcal
              </Text>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  meal.taken ? styles.takenBtn : styles.takeBtn,
                ]}
                onPress={() =>
                  toggleMeal(meal.id, meal.taken ? "skip" : "take")
                }
              >
                <Text style={styles.actionBtnText}>
                  {meal.taken ? "Skip" : "Take"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.fireIcon}>🔥</Text>
            <Text style={[styles.totalText, { color: colors.text }]}>
              Total kcal |{" "}
              {mealList
                .reduce((sum, m) => sum + m.calories, 0)
                .toLocaleString()}{" "}
              kcal
            </Text>
          </View>
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
              {"Today's Workout Plan - Chest + Core"}
            </Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.logBtn}
                onPress={() =>
                  setWorkoutList((prev) =>
                    prev.map((w) => ({ ...w, done: true })),
                  )
                }
              >
                <Text style={styles.logText}>Log all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push("/workout" as any)}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>

          {workoutList.map((exercise, index) => (
            <View
              key={index}
              style={[styles.exerciseRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.exerciseBullet} />
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {exercise.name}
                </Text>
                <Text
                  style={[styles.exerciseSets, { color: colors.textMuted }]}
                >
                  {exercise.sets}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.exerciseCheck,
                  { borderColor: colors.border },
                  exercise.done && styles.exerciseCheckDone,
                ]}
                onPress={() => toggleWorkout(index)}
              >
                {exercise.done && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            </View>
          ))}
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
          { name: "Home", icon: "🏠", route: "/dashboard" },
          { name: "Stats", icon: "📊", route: "/progress" },
          { name: "Meal", icon: "🍽️", route: "/meal" },
          { name: "Exercise", icon: "💪", route: "/workout" },
          { name: "Profile", icon: "👤", route: "/profile" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => {
              setActiveTab(tab.name);
              router.push(tab.route as any);
            }}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.navLabel,
                { color: colors.textMuted },
                activeTab === tab.name && styles.navLabelActive,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4CAF50",
  },
  dateText: { fontSize: 13, fontWeight: "500" },
  trophy: { fontSize: 24 },
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
  calorieNumber: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  calorieUnit: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
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
  dotRow: { flexDirection: "row", gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "#fff" },
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
  mealEmoji: { fontSize: 18 },
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
  fireIcon: { fontSize: 16 },
  totalText: { fontSize: 13, fontWeight: "600" },
  logBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logText: { color: "#fff", fontSize: 12, fontWeight: "600" },
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
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "bold" },
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
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, marginTop: 2 },
  navLabelActive: { color: "#4CAF50", fontWeight: "700" },
});
