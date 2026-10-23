import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Moon,
  Repeat,
  Sun,
  Sunrise,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type Meal = {
  id: string;
  name: string;
  calories: number;
};

type MealEntry = {
  plan_id: string;
  meal_type: string;
  taken: boolean;
  meal: Meal;
};

type WorkoutEntry = {
  plan_id: string;
  sets: number;
  reps: string;
  done: boolean;
  exercise: { name: string; muscle_group: string };
};

type WorkoutDay = {
  date: string; // YYYY-MM-DD
  day: string;
  exercises: WorkoutEntry[];
};

type DayPlan = {
  date: string; // YYYY-MM-DD
  day: string;
  meals: MealEntry[];
};

const MEAL_PLAN_MODE_KEY = "mealPlanMode";
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const mealTypeIcon = (type: string) => {
  if (type === "Breakfast") return Sunrise;
  if (type === "Lunch") return Sun;
  return Moon;
};

const toDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const today = new Date();

  const [planMode, setPlanMode] = useState<"weekly" | "continuous">("weekly");
  const [modeLoaded, setModeLoaded] = useState(false);
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Basahin ang saved mode preference mula sa Meal screen — read-only lang dito
  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(MEAL_PLAN_MODE_KEY);
        if (savedMode === "weekly" || savedMode === "continuous") {
          setPlanMode(savedMode);
        }
      } catch (err) {
        console.error("Load saved mode error:", err);
      } finally {
        setModeLoaded(true);
      }
    })();
  }, []);

  const loadMealPlan = useCallback(async (mode: "weekly" | "continuous") => {
    try {
      let res = await api.get("/meals/plan/me", {
        params: { mode, history: true },
      });
      if (!res.data.mealPlan || res.data.mealPlan.length === 0) {
        await api.post("/meals/plan/generate", { mode });
        res = await api.get("/meals/plan/me", {
          params: { mode, history: true },
        });
      }
      setMealPlan(res.data.mealPlan);
    } catch (err) {
      console.error("Load calendar meal plan error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Saved workout plans (past weeks + this week). If it fails, the calendar
  // still works with meals only.
  const loadWorkoutHistory = useCallback(async () => {
    try {
      const res = await api.get("/workouts/plan/me", {
        params: { history: true },
      });
      setWorkoutHistory(res.data.workoutPlan || []);
    } catch (err) {
      console.error("Load calendar workout history error:", err);
    }
  }, []);

  useEffect(() => {
    if (!modeLoaded) return;
    setLoading(true);
    loadMealPlan(planMode);
    loadWorkoutHistory();
  }, [modeLoaded, planMode, loadMealPlan, loadWorkoutHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMealPlan(planMode);
    loadWorkoutHistory();
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  };

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  const selectDate = (day: number) => {
    setSelectedDate(day);
    setSelectedMonth(currentMonth.getMonth());
    setSelectedYear(currentMonth.getFullYear());
  };

  const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDate);
  const selectedDateKey = toDateKey(selectedDateObj);
  const selectedDayData = mealPlan.find((d) => d.date === selectedDateKey);
  const selectedWorkout = workoutHistory.find(
    (d) => d.date === selectedDateKey,
  );
  const workoutDone = selectedWorkout
    ? selectedWorkout.exercises.filter((e) => e.done).length
    : 0;

  const getDateLabel = () => {
    const diffDays = Math.round(
      (selectedDateObj.setHours(0, 0, 0, 0) -
        new Date(today).setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const selectedDayName = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "long",
  });

  if (!modeLoaded) {
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackRow}
          hitSlop={HIT_SLOP}
        >
          <ChevronLeft size={20} color={colors.primary} />
          <Text style={[styles.backBtn, { color: colors.primary }]}>
            Calendar
          </Text>
        </TouchableOpacity>

        {/* Read-only mode badge — hindi na toggle, sinusunod na lang ang preference sa Meal screen */}
        <View style={[styles.modeBadge, { backgroundColor: colors.surface }]}>
          {planMode === "weekly" ? (
            <CalendarDays size={13} color={colors.primary} />
          ) : (
            <Repeat size={13} color={colors.primary} />
          )}
          <Text style={[styles.modeBadgeText, { color: colors.text }]}>
            {planMode === "weekly" ? "Weekly Mode" : "Continuous Mode"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
          {/* Calendar Card */}
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Month Navigation */}
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={prevMonth} hitSlop={HIT_SLOP}>
                <ChevronLeft size={26} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {monthName}
              </Text>
              <TouchableOpacity onPress={nextMonth} hitSlop={HIT_SLOP}>
                <ChevronRight size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabels}>
              {DAYS.map((d, i) => (
                <Text
                  key={i}
                  style={[styles.dayLabel, { color: colors.textMuted }]}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Date Grid */}
            <View style={styles.dateGrid}>
              {getDaysInMonth().map((day, index) => {
                const isSelected =
                  day === selectedDate &&
                  currentMonth.getMonth() === selectedMonth &&
                  currentMonth.getFullYear() === selectedYear;

                const hasPlan =
                  day !== null &&
                  mealPlan.some(
                    (d) =>
                      d.date ===
                      toDateKey(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth(),
                          day,
                        ),
                      ),
                  );

                const hasWorkout =
                  day !== null &&
                  workoutHistory.some(
                    (d) =>
                      d.date ===
                      toDateKey(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth(),
                          day,
                        ),
                      ),
                  );

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCell,
                      isSelected && styles.dateCellSelected,
                      day !== null &&
                        isToday(day) &&
                        !isSelected && { backgroundColor: colors.input },
                    ]}
                    onPress={() => day !== null && selectDate(day)}
                    disabled={day === null}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        { color: hasPlan ? colors.text : colors.textMuted },
                        isSelected && styles.dateTextSelected,
                        day !== null &&
                          isToday(day) &&
                          !isSelected && { color: colors.primary },
                      ]}
                    >
                      {day ?? ""}
                    </Text>
                    {day !== null && (hasPlan || hasWorkout) && (
                      <View style={styles.dotRow}>
                        {hasPlan && (
                          <View
                            style={[
                              styles.planDot,
                              {
                                backgroundColor: isSelected
                                  ? "#fff"
                                  : colors.primary,
                              },
                            ]}
                          />
                        )}
                        {hasWorkout && (
                          <View
                            style={[
                              styles.planDot,
                              {
                                backgroundColor: isSelected
                                  ? "#fff"
                                  : "#FF9800",
                              },
                            ]}
                          />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.planDot, { backgroundColor: colors.primary }]}
                />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>
                  Meals
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.planDot, { backgroundColor: "#FF9800" }]}
                />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>
                  Workout
                </Text>
              </View>
            </View>
          </View>

          {/* Selected Day Meals */}
          <View style={styles.mealsSection}>
            {selectedDayData ? (
              <>
                <Text style={[styles.dayHeader, { color: colors.text }]}>
                  {getDateLabel()} — {selectedDayName}
                </Text>
                {selectedDayData.meals.map((entry) => {
                  const MealIcon = mealTypeIcon(entry.meal_type);
                  return (
                    <View
                      key={entry.plan_id}
                      style={[
                        styles.mealCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                        entry.taken && styles.mealCardTaken,
                      ]}
                    >
                      <View
                        style={[
                          styles.mealIcon,
                          { backgroundColor: colors.input },
                        ]}
                      >
                        <MealIcon size={18} color={colors.primary} />
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={[styles.mealType, { color: colors.text }]}>
                          {entry.meal_type}
                        </Text>
                        <Text
                          style={[styles.mealName, { color: colors.textMuted }]}
                        >
                          {entry.meal?.name}
                        </Text>
                        <Text style={styles.mealCal}>
                          ~{entry.meal?.calories} kcal
                        </Text>
                      </View>
                      {entry.taken && (
                        <View style={styles.takenBadge}>
                          <Check size={12} color="#fff" strokeWidth={3} />
                          <Text style={styles.takenText}>Taken</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                <View
                  style={[styles.totalRow, { backgroundColor: colors.surface }]}
                >
                  <Flame
                    size={16}
                    color="#FF9800"
                    fill="#FF9800"
                    fillOpacity={0.2}
                  />
                  <Text style={[styles.totalText, { color: colors.text }]}>
                    Total kcal |{" "}
                    {selectedDayData.meals
                      .reduce(
                        (s, m) => s + parseFloat(String(m.meal?.calories || 0)),
                        0,
                      )
                      .toLocaleString()}{" "}
                    kcal
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noPlanCard}>
                <CalendarX size={44} color={colors.textMuted} />
                <Text style={[styles.noPlanTitle, { color: colors.text }]}>
                  No Plan Yet
                </Text>
                <Text
                  style={[styles.noPlanSubtitle, { color: colors.textMuted }]}
                >
                  {planMode === "weekly"
                    ? "This date is outside your current weekly plan."
                    : "No meal plan found for this date."}
                </Text>
              </View>
            )}

            {/* Selected Day Workout */}
            <View style={styles.workoutHeaderRow}>
              <Text
                style={[
                  styles.dayHeader,
                  { color: colors.text, marginBottom: 0 },
                ]}
              >
                Workout
              </Text>
              {selectedWorkout && (
                <View style={styles.workoutCountBadge}>
                  <Text style={styles.workoutCountText}>
                    {workoutDone} of {selectedWorkout.exercises.length} done
                  </Text>
                </View>
              )}
            </View>
            {selectedWorkout ? (
              selectedWorkout.exercises.map((entry) => (
                <View
                  key={entry.plan_id}
                  style={[
                    styles.mealCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    entry.done && styles.mealCardTaken,
                  ]}
                >
                  <View
                    style={[styles.mealIcon, { backgroundColor: colors.input }]}
                  >
                    <Dumbbell size={18} color="#FF9800" />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealType, { color: colors.text }]}>
                      {entry.exercise?.name}
                    </Text>
                    <Text
                      style={[styles.mealName, { color: colors.textMuted }]}
                    >
                      {entry.sets} sets × {entry.reps}
                      {entry.exercise?.muscle_group
                        ? ` • ${entry.exercise.muscle_group}`
                        : ""}
                    </Text>
                  </View>
                  {entry.done ? (
                    <View style={styles.takenBadge}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                      <Text style={styles.takenText}>Done</Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.notDoneText, { color: colors.textMuted }]}
                    >
                      Not done
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View
                style={[
                  styles.noWorkoutCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[styles.noPlanSubtitle, { color: colors.textMuted }]}
                >
                  No workout for this date.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  headerBackRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtn: { fontSize: 16, fontWeight: "600" },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeBadgeText: { fontSize: 11, fontWeight: "600" },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthTitle: { fontSize: 18, fontWeight: "700" },
  dayLabels: { flexDirection: "row", marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600" },
  dateGrid: { flexDirection: "row", flexWrap: "wrap" },
  dateCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  dateCellSelected: { backgroundColor: "#4CAF50" },
  dateText: { fontSize: 14 },
  dateTextSelected: { color: "#fff", fontWeight: "700" },
  planDot: { width: 4, height: 4, borderRadius: 2 },
  dotRow: { flexDirection: "row", gap: 3, marginTop: 2 },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendText: { fontSize: 11 },
  workoutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 12,
  },
  workoutCountBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutCountText: { color: "#E65100", fontSize: 12, fontWeight: "700" },
  notDoneText: { fontSize: 12, fontWeight: "600" },
  noWorkoutCard: { borderRadius: 12, padding: 16, alignItems: "center" },
  mealsSection: { paddingHorizontal: 16 },
  dayHeader: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  mealCardTaken: { borderColor: "#4CAF50" },
  mealIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 13, fontWeight: "700" },
  mealName: { fontSize: 12, marginTop: 2 },
  mealCal: { fontSize: 11, color: "#4CAF50", marginTop: 2 },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  takenText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  totalText: { fontSize: 13, fontWeight: "600" },
  noPlanCard: { alignItems: "center", paddingVertical: 40, gap: 8 },
  noPlanTitle: { fontSize: 18, fontWeight: "700" },
  noPlanSubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
});
