import { useRouter } from "expo-router";
import {
  BarChart3,
  Check,
  ChevronLeft,
  Dumbbell,
  Home,
  Moon,
  Dumbbell as MuscleIcon,
  Play,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  video_url: string | null;
};

type ExerciseEntry = {
  plan_id: string;
  sets: number;
  reps: string;
  done: boolean;
  exercise: Exercise;
};

type WorkoutDay = {
  day: string;
  date: string; // YYYY-MM-DD
  exercises: ExerciseEntry[];
};

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => formatLocalDate(new Date());

// Kinukuha ang petsa ng Lunes ng kasalukuyang linggo, tapos ang bawat araw pagkatapos nito
const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return ALL_DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatLocalDate(d);
  });
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Rough estimated height (in px) ng bawat collapsed day card, para sa scroll positioning
const DAY_SECTION_ESTIMATED_HEIGHT = 280;

export default function WorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const hasAutoScrolledRef = useRef(false);

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([]);
  const [activeTab, setActiveTab] = useState("Exercise");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logEntry, setLogEntry] = useState<ExerciseEntry | null>(null);
  const [logReps, setLogReps] = useState("");
  const [logWeight, setLogWeight] = useState("");

  const loadWorkoutPlan = useCallback(async () => {
    try {
      let res = await api.get("/workouts/plan/me");
      if (!res.data.workoutPlan || res.data.workoutPlan.length === 0) {
        await api.post("/workouts/plan/generate", {
          mode: "weekly",
          experience_level: "Beginner",
          available_equipment: ["Bodyweight", "Dumbbell"],
        });
        res = await api.get("/workouts/plan/me");
      }

      // I-fill ang buong linggo (Mon-Sun) para makita ang Rest Days na walang entry mula sa API
      const weekDates = getWeekDates();
      const existingDays = new Map<string, ExerciseEntry[]>(
        res.data.workoutPlan.map(
          (d: { day: string; exercises: ExerciseEntry[] }) => [
            d.day,
            d.exercises,
          ],
        ),
      );
      const fullWeek: WorkoutDay[] = ALL_DAYS.map((day, i) => ({
        day,
        date: weekDates[i],
        exercises: existingDays.get(day) || [],
      }));

      setWorkoutPlan(fullWeek);
    } catch (err) {
      console.error("Load workout plan error:", err);
      Alert.alert(
        "Error",
        "Unable to load your workout plan. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    hasAutoScrolledRef.current = false;
    loadWorkoutPlan();
  }, [loadWorkoutPlan]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkoutPlan();
  };

  // Auto-scroll papuntang kasalukuyang araw sa unang pagkakataon lang na na-load ang plan
  useEffect(() => {
    if (loading || workoutPlan.length === 0 || hasAutoScrolledRef.current)
      return;

    const todayKey = getTodayDateString();
    const todayIndex = workoutPlan.findIndex((d) => d.date === todayKey);

    if (todayIndex > 0) {
      const timeout = setTimeout(() => {
        const yOffset = todayIndex * DAY_SECTION_ESTIMATED_HEIGHT;
        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
      }, 300);
      hasAutoScrolledRef.current = true;
      return () => clearTimeout(timeout);
    }
    hasAutoScrolledRef.current = true;
  }, [loading, workoutPlan]);

  const toggleExercise = async (dayIndex: number, entry: ExerciseEntry) => {
    const newDone = !entry.done;
    setWorkoutPlan((prev) =>
      prev.map((day, di) =>
        di === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((e) =>
                e.plan_id === entry.plan_id ? { ...e, done: newDone } : e,
              ),
            }
          : day,
      ),
    );
    try {
      await api.patch(`/workouts/plan/${entry.plan_id}/toggle`, {
        done: newDone,
      });
    } catch (err) {
      console.error("Toggle exercise error:", err);
      setWorkoutPlan((prev) =>
        prev.map((day, di) =>
          di === dayIndex
            ? {
                ...day,
                exercises: day.exercises.map((e) =>
                  e.plan_id === entry.plan_id ? { ...e, done: entry.done } : e,
                ),
              }
            : day,
        ),
      );
    }
  };

  const logAllExercises = async (dayIndex: number) => {
    const day = workoutPlan[dayIndex];
    const previous = day.exercises;
    setWorkoutPlan((prev) =>
      prev.map((d, di) =>
        di === dayIndex
          ? { ...d, exercises: d.exercises.map((e) => ({ ...e, done: true })) }
          : d,
      ),
    );
    try {
      await Promise.all(
        previous
          .filter((e) => !e.done)
          .map((e) =>
            api.patch(`/workouts/plan/${e.plan_id}/toggle`, { done: true }),
          ),
      );
    } catch (err) {
      console.error("Log all error:", err);
    }
  };

  const openLogModal = (entry: ExerciseEntry) => {
    setLogEntry(entry);
    setLogReps("");
    setLogWeight("");
    setShowLogModal(true);
  };

  const saveLog = async () => {
    if (!logReps) {
      Alert.alert("Error", "Please enter reps.");
      return;
    }
    if (!logEntry) return;

    try {
      await api.post("/workouts/log", {
        exercise_id: logEntry.exercise.id,
        sets_completed: logEntry.sets,
        reps_completed: logReps,
        weight_used: logWeight || "BW",
      });

      // markahan din bilang done kung hindi pa
      if (!logEntry.done) {
        await api.patch(`/workouts/plan/${logEntry.plan_id}/toggle`, {
          done: true,
        });
        setWorkoutPlan((prev) =>
          prev.map((day) => ({
            ...day,
            exercises: day.exercises.map((e) =>
              e.plan_id === logEntry.plan_id ? { ...e, done: true } : e,
            ),
          })),
        );
      }

      setShowLogModal(false);
      Alert.alert(
        "Logged!",
        `${logEntry.exercise.name} — ${logReps} reps @ ${logWeight || "BW"}`,
      );
    } catch (err) {
      console.error("Save log error:", err);
      Alert.alert("Error", "Unable to save workout log. Please try again.");
    }
  };

  const getDayProgress = (exercises: ExerciseEntry[]) => {
    if (exercises.length === 0) return 0;
    return Math.round(
      (exercises.filter((e) => e.done).length / exercises.length) * 100,
    );
  };

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
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Weekly Workout Plan
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/dashboard" as any)}
          hitSlop={HIT_SLOP}
        >
          <X size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
          />
        }
      >
        {workoutPlan.map((day, dayIndex) => {
          const isRest = day.exercises.length === 0;
          const isToday = day.date === getTodayDateString();
          const focus = isRest
            ? "Rest Day"
            : [
                ...new Set(day.exercises.map((e) => e.exercise.muscle_group)),
              ].join(" + ");

          return (
            <View
              key={day.date}
              style={[
                styles.daySection,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isToday && styles.daySectionToday,
              ]}
            >
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={[styles.dayTitle, { color: colors.text }]}>
                      {day.day} — {focus}
                    </Text>
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.dayDate, { color: colors.textMuted }]}>
                    {formatDateLabel(day.date)}
                  </Text>
                </View>
                {!isRest && (
                  <View style={styles.dayActions}>
                    <TouchableOpacity
                      style={styles.logAllBtn}
                      onPress={() => logAllExercises(dayIndex)}
                    >
                      <Text style={styles.logAllText}>Log all</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {isRest ? (
                <View style={styles.restCard}>
                  <Moon size={36} color={colors.textMuted} />
                  <Text style={[styles.restTitle, { color: colors.text }]}>
                    Rest Day
                  </Text>
                  <Text
                    style={[styles.restSubtitle, { color: colors.textMuted }]}
                  >
                    Recovery is part of progress!
                  </Text>
                </View>
              ) : (
                <>
                  {/* Progress Bar */}
                  <View style={styles.progressRow}>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${getDayProgress(day.exercises)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {getDayProgress(day.exercises)}%
                    </Text>
                  </View>

                  {/* Exercises */}
                  {day.exercises.map((entry) => (
                    <TouchableOpacity
                      key={entry.plan_id}
                      style={[
                        styles.exerciseRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                        entry.done && styles.exerciseRowDone,
                      ]}
                      onPress={() => {
                        setSelectedExercise(entry.exercise);
                        setShowDetailModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <TouchableOpacity
                        style={[
                          styles.exerciseCheck,
                          { borderColor: colors.border },
                          entry.done && styles.exerciseCheckDone,
                        ]}
                        onPress={() => toggleExercise(dayIndex, entry)}
                        hitSlop={HIT_SLOP}
                      >
                        {entry.done && (
                          <Check size={14} color="#fff" strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                      <View style={styles.exerciseInfo}>
                        <Text
                          style={[
                            styles.exerciseName,
                            { color: colors.text },
                            entry.done && styles.exerciseNameDone,
                          ]}
                        >
                          {entry.exercise.name}
                        </Text>
                        <Text
                          style={[
                            styles.exerciseSets,
                            { color: colors.textMuted },
                          ]}
                        >
                          {entry.sets} sets × {entry.reps} •{" "}
                          {entry.exercise.equipment}
                        </Text>
                        <View style={styles.muscleRow}>
                          <MuscleIcon size={11} color="#4CAF50" />
                          <Text style={styles.exerciseMuscle}>
                            {entry.exercise.muscle_group}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.logBtn}
                        onPress={() => openLogModal(entry)}
                        hitSlop={HIT_SLOP}
                      >
                        <Text style={styles.logBtnText}>Log</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Exercise Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedExercise && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedExercise.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDetailModal(false)}
                      hitSlop={HIT_SLOP}
                    >
                      <X size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exerciseInfoGrid}>
                    {[
                      { label: "Muscle", value: selectedExercise.muscle_group },
                      { label: "Equipment", value: selectedExercise.equipment },
                      {
                        label: "Difficulty",
                        value: selectedExercise.difficulty,
                      },
                    ].map((info) => (
                      <View
                        key={info.label}
                        style={[
                          styles.infoBox,
                          { backgroundColor: colors.input },
                        ]}
                      >
                        <Text style={styles.infoValue}>{info.value}</Text>
                        <Text
                          style={[
                            styles.infoLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {info.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.videoPlaceholder}>
                    <View style={styles.playButtonCircle}>
                      <Play size={24} color="#fff" fill="#fff" />
                    </View>
                    <Text style={styles.videoText}>Video Demonstration</Text>
                    <Text style={styles.videoSubtext}>
                      {selectedExercise.video_url
                        ? "Tap to play"
                        : "Available in full version"}
                    </Text>
                  </View>
                  <Text style={[styles.modalSection, { color: colors.text }]}>
                    Instructions
                  </Text>
                  <Text
                    style={[
                      styles.stepText,
                      { color: colors.textSecondary, marginBottom: 16 },
                    ]}
                  >
                    {selectedExercise.instructions}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.modalCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Log Exercise Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.logModalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Log Exercise
              </Text>
              <TouchableOpacity
                onPress={() => setShowLogModal(false)}
                hitSlop={HIT_SLOP}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {logEntry && (
              <>
                <Text style={[styles.logExerciseName, { color: colors.text }]}>
                  {logEntry.exercise.name}
                </Text>
                <Text
                  style={[styles.logLabel, { color: colors.textSecondary }]}
                >
                  Reps Completed
                </Text>
                <TextInput
                  style={[
                    styles.logInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder={`e.g. ${logEntry.reps}`}
                  placeholderTextColor={colors.textMuted}
                  value={logReps}
                  onChangeText={setLogReps}
                  keyboardType="numeric"
                />
                <Text
                  style={[styles.logLabel, { color: colors.textSecondary }]}
                >
                  Weight Used (optional)
                </Text>
                <TextInput
                  style={[
                    styles.logInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. 10kg or BW (bodyweight)"
                  placeholderTextColor={colors.textMuted}
                  value={logWeight}
                  onChangeText={setLogWeight}
                />
                <TouchableOpacity style={styles.saveLogBtn} onPress={saveLog}>
                  <Text style={styles.saveLogText}>Save Log</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  daySection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  daySectionToday: { borderColor: "#4CAF50", borderWidth: 2 },
  todayBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dayTitle: { fontSize: 15, fontWeight: "700" },
  dayDate: { fontSize: 11, marginTop: 2 },
  dayActions: { flexDirection: "row", gap: 8 },
  logAllBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  restCard: { alignItems: "center", paddingVertical: 20, gap: 8 },
  restTitle: { fontSize: 16, fontWeight: "700" },
  restSubtitle: { fontSize: 12 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: "#4CAF50", borderRadius: 3 },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    width: 35,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  exerciseRowDone: { borderColor: "#4CAF50" },
  exerciseCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseCheckDone: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: "700" },
  exerciseNameDone: { color: "#4CAF50" },
  exerciseSets: { fontSize: 12, marginTop: 2 },
  muscleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  exerciseMuscle: { fontSize: 11, color: "#4CAF50" },
  logBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  logBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  logModalContent: {
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
  modalTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  exerciseInfoGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  infoBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  infoValue: { fontSize: 14, fontWeight: "bold", color: "#4CAF50" },
  infoLabel: { fontSize: 10, marginTop: 4 },
  videoPlaceholder: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  playButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  videoSubtext: { fontSize: 12, color: "#888" },
  modalSection: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  stepText: { fontSize: 13, flex: 1, lineHeight: 20 },
  modalCloseBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  modalCloseBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  logExerciseName: { fontSize: 15, fontWeight: "700", marginBottom: 16 },
  logLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  logInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  saveLogBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveLogText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
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
