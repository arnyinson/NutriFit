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

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  equipment: string;
  muscleGroup: string;
  instructions: string[];
  done: boolean;
  loggedSets: { reps: string; weight: string }[];
};

type WorkoutDay = {
  day: string;
  date: string;
  focus: string;
  isRest: boolean;
  exercises: Exercise[];
};

const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });
};

const weekDates = getWeekDates();

const weeklyWorkout: WorkoutDay[] = [
  {
    day: "Monday",
    date: weekDates[0],
    focus: "Chest + Core",
    isRest: false,
    exercises: [
      {
        id: "e1",
        name: "Push Ups",
        sets: 4,
        reps: "12 reps",
        equipment: "Bodyweight",
        muscleGroup: "Chest",
        done: false,
        loggedSets: [],
        instructions: [
          "Start in plank position.",
          "Lower chest to floor.",
          "Push back up.",
          "Keep core tight throughout.",
        ],
      },
      {
        id: "e2",
        name: "Incline Push Ups",
        sets: 4,
        reps: "12 reps",
        equipment: "Chair/Bench",
        muscleGroup: "Chest",
        done: false,
        loggedSets: [],
        instructions: [
          "Place hands on elevated surface.",
          "Lower chest toward surface.",
          "Push back up.",
          "Keep body straight.",
        ],
      },
      {
        id: "e3",
        name: "Chair Dips",
        sets: 3,
        reps: "10 reps",
        equipment: "Chair",
        muscleGroup: "Triceps",
        done: false,
        loggedSets: [],
        instructions: [
          "Grip chair edge behind you.",
          "Lower body by bending elbows.",
          "Push back up to start.",
          "Keep back close to chair.",
        ],
      },
      {
        id: "e4",
        name: "Plank",
        sets: 3,
        reps: "45 sec",
        equipment: "Bodyweight",
        muscleGroup: "Core",
        done: false,
        loggedSets: [],
        instructions: [
          "Forearms on floor.",
          "Keep body in straight line.",
          "Hold position.",
          "Breathe steadily.",
        ],
      },
      {
        id: "e5",
        name: "Bicycle Crunch",
        sets: 3,
        reps: "20 reps",
        equipment: "Bodyweight",
        muscleGroup: "Core",
        done: false,
        loggedSets: [],
        instructions: [
          "Lie on back, hands behind head.",
          "Bring opposite elbow to knee.",
          "Alternate sides.",
          "Keep lower back pressed to floor.",
        ],
      },
    ],
  },
  {
    day: "Tuesday",
    date: weekDates[1],
    focus: "Legs + Glutes",
    isRest: false,
    exercises: [
      {
        id: "e6",
        name: "Bodyweight Squats",
        sets: 4,
        reps: "15 reps",
        equipment: "Bodyweight",
        muscleGroup: "Legs",
        done: false,
        loggedSets: [],
        instructions: [
          "Stand feet shoulder-width apart.",
          "Lower hips until thighs parallel.",
          "Push through heels to stand.",
          "Keep chest up.",
        ],
      },
      {
        id: "e7",
        name: "Lunges",
        sets: 3,
        reps: "12 reps each leg",
        equipment: "Bodyweight",
        muscleGroup: "Legs",
        done: false,
        loggedSets: [],
        instructions: [
          "Stand tall, step forward.",
          "Lower back knee toward floor.",
          "Push front foot to return.",
          "Alternate legs.",
        ],
      },
      {
        id: "e8",
        name: "Glute Bridges",
        sets: 3,
        reps: "15 reps",
        equipment: "Bodyweight",
        muscleGroup: "Glutes",
        done: false,
        loggedSets: [],
        instructions: [
          "Lie on back, knees bent.",
          "Push hips toward ceiling.",
          "Squeeze glutes at top.",
          "Lower slowly.",
        ],
      },
      {
        id: "e9",
        name: "Calf Raises",
        sets: 4,
        reps: "20 reps",
        equipment: "Bodyweight",
        muscleGroup: "Calves",
        done: false,
        loggedSets: [],
        instructions: [
          "Stand near wall for balance.",
          "Rise onto toes.",
          "Hold for 1 second.",
          "Lower slowly.",
        ],
      },
      {
        id: "e10",
        name: "Mountain Climbers",
        sets: 3,
        reps: "30 sec",
        equipment: "Bodyweight",
        muscleGroup: "Core",
        done: false,
        loggedSets: [],
        instructions: [
          "Start in plank.",
          "Drive knees to chest alternately.",
          "Keep hips level.",
          "Move fast but controlled.",
        ],
      },
    ],
  },
  {
    day: "Wednesday",
    date: weekDates[2],
    focus: "Rest Day",
    isRest: true,
    exercises: [],
  },
  {
    day: "Thursday",
    date: weekDates[3],
    focus: "Back + Shoulders",
    isRest: false,
    exercises: [
      {
        id: "e11",
        name: "Superman Hold",
        sets: 3,
        reps: "12 reps",
        equipment: "Bodyweight",
        muscleGroup: "Back",
        done: false,
        loggedSets: [],
        instructions: [
          "Lie face down, arms extended.",
          "Lift arms and legs off floor.",
          "Hold for 2 seconds.",
          "Lower slowly.",
        ],
      },
      {
        id: "e12",
        name: "Shoulder Press",
        sets: 3,
        reps: "12 reps",
        equipment: "Dumbbells",
        muscleGroup: "Shoulders",
        done: false,
        loggedSets: [],
        instructions: [
          "Hold dumbbells at shoulder height.",
          "Press overhead until arms straight.",
          "Lower slowly to start.",
          "Keep core tight.",
        ],
      },
      {
        id: "e13",
        name: "Lateral Raises",
        sets: 3,
        reps: "12 reps",
        equipment: "Dumbbells",
        muscleGroup: "Shoulders",
        done: false,
        loggedSets: [],
        instructions: [
          "Hold dumbbells at sides.",
          "Raise arms to shoulder height.",
          "Lower slowly.",
          "Keep slight bend in elbows.",
        ],
      },
      {
        id: "e14",
        name: "Bent Over Rows",
        sets: 3,
        reps: "12 reps",
        equipment: "Dumbbells",
        muscleGroup: "Back",
        done: false,
        loggedSets: [],
        instructions: [
          "Hinge at hips, back flat.",
          "Pull dumbbells to hips.",
          "Squeeze shoulder blades.",
          "Lower slowly.",
        ],
      },
    ],
  },
  {
    day: "Friday",
    date: weekDates[4],
    focus: "Arms + Core",
    isRest: false,
    exercises: [
      {
        id: "e15",
        name: "Bicep Curl",
        sets: 3,
        reps: "12 reps",
        equipment: "Dumbbells",
        muscleGroup: "Biceps",
        done: false,
        loggedSets: [],
        instructions: [
          "Hold dumbbells at sides.",
          "Curl weights to shoulders.",
          "Lower slowly.",
          "Keep elbows at sides.",
        ],
      },
      {
        id: "e16",
        name: "Tricep Kickback",
        sets: 3,
        reps: "12 reps",
        equipment: "Dumbbells",
        muscleGroup: "Triceps",
        done: false,
        loggedSets: [],
        instructions: [
          "Hinge forward at hips.",
          "Upper arm parallel to floor.",
          "Extend forearm back.",
          "Return slowly.",
        ],
      },
      {
        id: "e17",
        name: "Hammer Curl",
        sets: 3,
        reps: "12 reps",
        equipment: "Dumbbells",
        muscleGroup: "Biceps",
        done: false,
        loggedSets: [],
        instructions: [
          "Hold dumbbells thumbs up.",
          "Curl to shoulder height.",
          "Lower slowly.",
          "Keep wrists neutral.",
        ],
      },
      {
        id: "e18",
        name: "Plank",
        sets: 3,
        reps: "45 sec",
        equipment: "Bodyweight",
        muscleGroup: "Core",
        done: false,
        loggedSets: [],
        instructions: [
          "Hold plank position.",
          "Keep body straight.",
          "Breathe steadily.",
          "Don't let hips sag.",
        ],
      },
      {
        id: "e19",
        name: "Russian Twist",
        sets: 3,
        reps: "20 reps",
        equipment: "Bodyweight",
        muscleGroup: "Core",
        done: false,
        loggedSets: [],
        instructions: [
          "Sit with knees bent, lean back.",
          "Twist torso side to side.",
          "Keep feet off floor.",
          "Add weight for more challenge.",
        ],
      },
    ],
  },
  {
    day: "Saturday",
    date: weekDates[5],
    focus: "Full Body",
    isRest: false,
    exercises: [
      {
        id: "e20",
        name: "Burpees",
        sets: 3,
        reps: "10 reps",
        equipment: "Bodyweight",
        muscleGroup: "Full Body",
        done: false,
        loggedSets: [],
        instructions: [
          "Stand, drop to squat.",
          "Jump feet back to plank.",
          "Do a push up.",
          "Jump feet forward and leap up.",
        ],
      },
      {
        id: "e21",
        name: "Jump Squats",
        sets: 3,
        reps: "12 reps",
        equipment: "Bodyweight",
        muscleGroup: "Legs",
        done: false,
        loggedSets: [],
        instructions: [
          "Squat down.",
          "Explode upward.",
          "Land softly.",
          "Immediately go into next squat.",
        ],
      },
      {
        id: "e22",
        name: "Mountain Climbers",
        sets: 3,
        reps: "30 sec",
        equipment: "Bodyweight",
        muscleGroup: "Core",
        done: false,
        loggedSets: [],
        instructions: [
          "Start in plank.",
          "Drive knees to chest alternately.",
          "Keep hips level.",
          "Move fast but controlled.",
        ],
      },
      {
        id: "e23",
        name: "Push Ups",
        sets: 3,
        reps: "12 reps",
        equipment: "Bodyweight",
        muscleGroup: "Chest",
        done: false,
        loggedSets: [],
        instructions: [
          "Plank position.",
          "Lower chest to floor.",
          "Push back up.",
          "Keep core engaged.",
        ],
      },
    ],
  },
  {
    day: "Sunday",
    date: weekDates[6],
    focus: "Rest Day",
    isRest: true,
    exercises: [],
  },
];

export default function WorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [workout, setWorkout] = useState(weeklyWorkout);
  const [activeTab, setActiveTab] = useState("Exercise");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDay, setLogDay] = useState<number | null>(null);
  const [logExercise, setLogExercise] = useState<Exercise | null>(null);
  const [logReps, setLogReps] = useState("");
  const [logWeight, setLogWeight] = useState("");

  const toggleExercise = (dayIndex: number, exIndex: number) => {
    setWorkout((prev) =>
      prev.map((day, di) =>
        di === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((ex, ei) =>
                ei === exIndex ? { ...ex, done: !ex.done } : ex,
              ),
            }
          : day,
      ),
    );
  };

  const logAllExercises = (dayIndex: number) => {
    setWorkout((prev) =>
      prev.map((day, di) =>
        di === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((ex) => ({ ...ex, done: true })),
            }
          : day,
      ),
    );
  };

  const openLogModal = (dayIndex: number, exercise: Exercise) => {
    setLogDay(dayIndex);
    setLogExercise(exercise);
    setLogReps("");
    setLogWeight("");
    setShowLogModal(true);
  };

  const saveLog = () => {
    if (!logReps) {
      Alert.alert("Error", "Please enter reps.");
      return;
    }
    if (logDay === null || !logExercise) return;
    setWorkout((prev) =>
      prev.map((day, di) =>
        di === logDay
          ? {
              ...day,
              exercises: day.exercises.map((ex) =>
                ex.id === logExercise.id
                  ? {
                      ...ex,
                      done: true,
                      loggedSets: [
                        ...ex.loggedSets,
                        { reps: logReps, weight: logWeight || "BW" },
                      ],
                    }
                  : ex,
              ),
            }
          : day,
      ),
    );
    setShowLogModal(false);
  };

  const getDayProgress = (exercises: Exercise[]) => {
    if (exercises.length === 0) return 0;
    return Math.round(
      (exercises.filter((e) => e.done).length / exercises.length) * 100,
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Weekly Workout Plan
        </Text>
        <TouchableOpacity>
          <Text style={[styles.headerIcon, { color: colors.textMuted }]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {workout.map((day, dayIndex) => (
          <View
            key={day.day}
            style={[
              styles.daySection,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Day Header */}
            <View style={styles.dayHeader}>
              <View>
                <Text style={[styles.dayTitle, { color: colors.text }]}>
                  {day.day} — {day.focus}
                </Text>
                <Text style={[styles.dayDate, { color: colors.textMuted }]}>
                  {day.date}
                </Text>
              </View>
              {!day.isRest && (
                <View style={styles.dayActions}>
                  <TouchableOpacity
                    style={styles.logAllBtn}
                    onPress={() => logAllExercises(dayIndex)}
                  >
                    <Text style={styles.logAllText}>Log all</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editPlanBtn}>
                    <Text style={styles.editPlanText}>Edit Plan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {day.isRest ? (
              <View style={styles.restCard}>
                <Text style={styles.restIcon}>😴</Text>
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
                {day.exercises.map((exercise, exIndex) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[
                      styles.exerciseRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      exercise.done && styles.exerciseRowDone,
                    ]}
                    onPress={() => {
                      setSelectedExercise(exercise);
                      setShowDetailModal(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <TouchableOpacity
                      style={[
                        styles.exerciseCheck,
                        { borderColor: colors.border },
                        exercise.done && styles.exerciseCheckDone,
                      ]}
                      onPress={() => toggleExercise(dayIndex, exIndex)}
                    >
                      {exercise.done && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                    <View style={styles.exerciseInfo}>
                      <Text
                        style={[
                          styles.exerciseName,
                          { color: colors.text },
                          exercise.done && styles.exerciseNameDone,
                        ]}
                      >
                        {exercise.name}
                      </Text>
                      <Text
                        style={[
                          styles.exerciseSets,
                          { color: colors.textMuted },
                        ]}
                      >
                        {exercise.sets} sets × {exercise.reps} •{" "}
                        {exercise.equipment}
                      </Text>
                      <Text style={styles.exerciseMuscle}>
                        💪 {exercise.muscleGroup}
                      </Text>
                      {exercise.loggedSets.length > 0 && (
                        <View style={styles.loggedRow}>
                          {exercise.loggedSets.map((log, li) => (
                            <View key={li} style={styles.loggedBadge}>
                              <Text style={styles.loggedBadgeText}>
                                {log.reps} reps @ {log.weight}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.logBtn}
                      onPress={() => openLogModal(dayIndex, exercise)}
                    >
                      <Text style={styles.logBtnText}>Log</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Exercise Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedExercise && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedExercise.name}
                    </Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                      <Text
                        style={[styles.modalClose, { color: colors.textMuted }]}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exerciseInfoGrid}>
                    {[
                      { label: "Sets", value: `${selectedExercise.sets}` },
                      { label: "Reps", value: selectedExercise.reps },
                      { label: "Muscle", value: selectedExercise.muscleGroup },
                      { label: "Equipment", value: selectedExercise.equipment },
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
                    <Text style={styles.videoIcon}>▶️</Text>
                    <Text style={styles.videoText}>Video Demonstration</Text>
                    <Text style={styles.videoSubtext}>
                      Available in full version
                    </Text>
                  </View>
                  <Text style={[styles.modalSection, { color: colors.text }]}>
                    Instructions
                  </Text>
                  {selectedExercise.instructions.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{i + 1}</Text>
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                  ))}
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
      <Modal visible={showLogModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.logModalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Log Exercise
              </Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            {logExercise && (
              <>
                <Text style={[styles.logExerciseName, { color: colors.text }]}>
                  {logExercise.name}
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
                  placeholder={`e.g. ${logExercise.reps}`}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerIcon: { fontSize: 20 },
  daySection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
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
  editPlanBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editPlanText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  restCard: { alignItems: "center", paddingVertical: 20 },
  restIcon: { fontSize: 36, marginBottom: 8 },
  restTitle: { fontSize: 16, fontWeight: "700" },
  restSubtitle: { fontSize: 12, marginTop: 4 },
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
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: "700" },
  exerciseNameDone: { color: "#4CAF50" },
  exerciseSets: { fontSize: 12, marginTop: 2 },
  exerciseMuscle: { fontSize: 11, color: "#4CAF50", marginTop: 2 },
  loggedRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  loggedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  loggedBadgeText: { fontSize: 10, color: "#2E7D32", fontWeight: "600" },
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
  modalClose: { fontSize: 20, padding: 4 },
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
  },
  videoIcon: { fontSize: 40, marginBottom: 8 },
  videoText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  videoSubtext: { fontSize: 12, color: "#888", marginTop: 4 },
  modalSection: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
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
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, marginTop: 2 },
  navLabelActive: { color: "#4CAF50", fontWeight: "700" },
});
