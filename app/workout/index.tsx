import { useRouter } from "expo-router";
import {
  BarChart3,
  Check,
  ChevronLeft,
  Dumbbell,
  Home,
  ListPlus,
  Moon,
  Dumbbell as MuscleIcon,
  NotebookPen,
  Play,
  Search,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import ConfirmModal from "../../components/ConfirmModal";
import SuccessModal from "../../components/SuccessModal";
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
  date: string;
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

const isFutureDay = (dateStr: string) => dateStr > getTodayDateString();

const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
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

const sanitizeNumericInput = (text: string) => text.replace(/[^0-9]/g, "");

const sanitizeSetsRepsInput = (text: string) => {
  const cleaned = text.replace(/[^0-9]/g, "");
  if (cleaned === "") return cleaned;
  const num = parseInt(cleaned, 10);
  if (num > 99) return "99";
  return cleaned;
};

const DAY_SECTION_ESTIMATED_HEIGHT = 280;

type VideoType = "uploaded" | "youtube" | "exercisedb" | "none" | null;

export default function WorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);
  const hasAutoScrolledRef = useRef(false);

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([]);
  const [activeTab, setActiveTab] = useState("Workout");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showLogModal, setShowLogModal] = useState(false);
  const [logEntry, setLogEntry] = useState<ExerciseEntry | null>(null);
  const [logSets, setLogSets] = useState("");
  const [logReps, setLogReps] = useState("");
  const [logWeight, setLogWeight] = useState("");

  const [showCustomLogModal, setShowCustomLogModal] = useState(false);
  const [customDayIndex, setCustomDayIndex] = useState<number | null>(null);
  const [customLogTab, setCustomLogTab] = useState<"search" | "manual">(
    "search",
  );
  const [customSearch, setCustomSearch] = useState("");
  const [customSearchResults, setCustomSearchResults] = useState<Exercise[]>(
    [],
  );
  const [searchingCustom, setSearchingCustom] = useState(false);
  const [customSelectedExercise, setCustomSelectedExercise] =
    useState<Exercise | null>(null);
  const [manualExerciseName, setManualExerciseName] = useState("");
  const [customSets, setCustomSets] = useState("");
  const [customReps, setCustomReps] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [savingCustomLog, setSavingCustomLog] = useState(false);
  const [showCustomLogConfirm, setShowCustomLogConfirm] = useState(false);

  const [successModalTitle, setSuccessModalTitle] = useState("Logged!");
  const [successModalMessage, setSuccessModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [youtubeVideoIds, setYoutubeVideoIds] = useState<string[]>([]);
  const [videoSource, setVideoSource] = useState<VideoType>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

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

  const openExerciseDetail = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
    setVideoUrl(null);
    setYoutubeVideoIds([]);
    setVideoSource(null);
    setLoadingVideo(true);

    try {
      const res = await api.get(`/workouts/${exercise.id}/video`);

      if (res.data.type === "youtube" && res.data.videoIds?.length > 0) {
        setYoutubeVideoIds(res.data.videoIds);
        setVideoSource("youtube");
      } else if (res.data.type === "image" || res.data.type === "video") {
        const url = res.data.url;
        const fullUrl =
          url && url.startsWith("/api/")
            ? `https://nutrifit-backend-api-t21p.onrender.com${url}`
            : url;
        setVideoUrl(fullUrl);
        setVideoSource(res.data.source);
      } else {
        setVideoSource("none");
      }
    } catch (err) {
      console.error("Load exercise video error:", err);
      setVideoSource("none");
    } finally {
      setLoadingVideo(false);
    }
  };

  const openLogModal = (entry: ExerciseEntry) => {
    setLogEntry(entry);
    setLogSets(String(entry.sets));
    setLogReps("");
    setLogWeight("");
    setShowLogModal(true);
  };

  const saveLog = async () => {
    if (!logSets) {
      Alert.alert("Error", "Please enter sets.");
      return;
    }
    if (!logReps) {
      Alert.alert("Error", "Please enter reps.");
      return;
    }
    if (!logEntry) return;

    try {
      await api.post("/workouts/log", {
        exercise_id: logEntry.exercise.id,
        sets_completed: logSets,
        reps_completed: logReps,
        weight_used: logWeight || null,
      });

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
      setSuccessModalTitle("Logged!");
      setSuccessModalMessage(
        `${logEntry.exercise.name} — ${logSets} sets x ${logReps} reps${logWeight ? ` @ ${logWeight}` : ""}`,
      );
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Save log error:", err);
      Alert.alert("Error", "Unable to save workout log. Please try again.");
    }
  };

  const openCustomLogModal = (dayIndex: number) => {
    setCustomDayIndex(dayIndex);
    setCustomLogTab("search");
    setCustomSearch("");
    setCustomSearchResults([]);
    setCustomSelectedExercise(null);
    setManualExerciseName("");
    setCustomSets("");
    setCustomReps("");
    setCustomWeight("");
    setShowCustomLogModal(true);
  };

  useEffect(() => {
    if (!showCustomLogModal || customSelectedExercise) return;
    if (customLogTab !== "search" || customSearch.trim() === "") {
      setCustomSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingCustom(true);
      try {
        const res = await api.get("/workouts", {
          params: { search: customSearch },
        });
        setCustomSearchResults(res.data.exercises || []);
      } catch (err) {
        console.error("Search exercises error:", err);
      } finally {
        setSearchingCustom(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [customSearch, customLogTab, showCustomLogModal, customSelectedExercise]);

  const pickCustomExercise = (exercise: Exercise) => {
    setCustomSelectedExercise(exercise);
    setCustomSets("");
    setCustomReps("");
    setCustomWeight("");
  };

  const getCustomExerciseName = () =>
    customSelectedExercise?.name || manualExerciseName.trim();

  const requestSaveCustomLog = () => {
    const name = getCustomExerciseName();
    if (!name) {
      Alert.alert("Error", "Please enter or select an exercise.");
      return;
    }
    if (!customSets) {
      Alert.alert("Error", "Please enter sets.");
      return;
    }
    if (!customReps) {
      Alert.alert("Error", "Please enter reps.");
      return;
    }
    setShowCustomLogConfirm(true);
  };

  const saveCustomLog = async () => {
    if (customDayIndex === null) return;
    const dayName = workoutPlan[customDayIndex]?.day;
    const name = getCustomExerciseName();

    setSavingCustomLog(true);
    try {
      await api.post("/workouts/plan/custom", {
        day: dayName,
        exercise_id: customSelectedExercise?.id || undefined,
        custom_exercise_name: customSelectedExercise
          ? undefined
          : manualExerciseName.trim(),
        sets: customSets,
        reps: customReps,
        weight_used: customWeight || null,
      });

      setShowCustomLogModal(false);
      await loadWorkoutPlan();
      setSuccessModalTitle("Added!");
      setSuccessModalMessage(
        `${name} — ${customSets} sets x ${customReps} reps${customWeight ? ` @ ${customWeight}` : ""} added to ${dayName}.`,
      );
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Save custom log error:", err);
      Alert.alert("Error", "Unable to save workout. Please try again.");
    } finally {
      setSavingCustomLog(false);
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
          const isFuture = isFutureDay(day.date);
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
              <View style={[styles.dayHeader, { alignItems: "flex-start" }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.dayTitle,
                        { color: colors.text, flexShrink: 1 },
                      ]}
                    >
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
                <View style={[styles.dayActions, { flexShrink: 0 }]}>
                  {!isRest && (
                    <TouchableOpacity
                      style={[styles.logAllBtn, isFuture && styles.disabledBtn]}
                      onPress={() => !isFuture && logAllExercises(dayIndex)}
                      disabled={isFuture}
                    >
                      <Text style={styles.logAllText}>Log all</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.logOwnBtn,
                      { borderColor: colors.border },
                      isFuture && styles.disabledBtnOutline,
                    ]}
                    onPress={() => !isFuture && openCustomLogModal(dayIndex)}
                    disabled={isFuture}
                    hitSlop={HIT_SLOP}
                  >
                    <ListPlus
                      size={14}
                      color={isFuture ? colors.textMuted : colors.primary}
                    />
                  </TouchableOpacity>
                </View>
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
                    Recovery is part of progress! Tap the{" "}
                    <ListPlus size={12} color={colors.primary} /> button above
                    if you did a workout anyway.
                  </Text>
                </View>
              ) : (
                <>
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
                      onPress={() => openExerciseDetail(entry.exercise)}
                      activeOpacity={0.8}
                    >
                      <TouchableOpacity
                        style={[
                          styles.exerciseCheck,
                          { borderColor: colors.border },
                          entry.done && styles.exerciseCheckDone,
                        ]}
                        onPress={() =>
                          !isFuture && toggleExercise(dayIndex, entry)
                        }
                        disabled={isFuture}
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
                        style={[styles.logBtn, isFuture && styles.disabledBtn]}
                        onPress={() => !isFuture && openLogModal(entry)}
                        disabled={isFuture}
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
        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* EXERCISE DETAIL MODAL */}
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

                  {loadingVideo ? (
                    <View style={styles.videoPlaceholder}>
                      <ActivityIndicator color="#fff" />
                      <Text style={styles.videoText}>
                        Loading demonstration...
                      </Text>
                    </View>
                  ) : videoSource === "youtube" &&
                    youtubeVideoIds.length > 0 ? (
                    <TouchableOpacity
                      style={styles.youtubeFallback}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.youtube.com/watch?v=${youtubeVideoIds[0]}`,
                        )
                      }
                    >
                      <Image
                        source={{
                          uri: `https://img.youtube.com/vi/${youtubeVideoIds[0]}/hqdefault.jpg`,
                        }}
                        style={styles.videoImage}
                        resizeMode="cover"
                      />
                      <View style={styles.youtubeFallbackOverlay}>
                        <View style={styles.playButtonCircle}>
                          <Play size={24} color="#fff" fill="#fff" />
                        </View>
                        <Text style={styles.youtubeFallbackText}>
                          Tap to watch on YouTube
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : videoUrl ? (
                    <View style={styles.videoImageWrapper}>
                      <Image
                        source={{ uri: videoUrl }}
                        style={styles.videoImage}
                        resizeMode="cover"
                      />
                      {videoSource === "exercisedb" && (
                        <View style={styles.videoSourceBadge}>
                          <Text style={styles.videoSourceBadgeText}>
                            GIF Demo
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.videoPlaceholder}>
                      <View style={styles.playButtonCircle}>
                        <Play size={24} color="#fff" fill="#fff" />
                      </View>
                      <Text style={styles.videoText}>Video Demonstration</Text>
                      <Text style={styles.videoSubtext}>
                        Not available for this exercise
                      </Text>
                    </View>
                  )}

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

      {/* LOG EXERCISE MODAL */}
      <Modal
        visible={showLogModal}
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
                  <Text
                    style={[styles.logExerciseName, { color: colors.text }]}
                  >
                    {logEntry.exercise.name}
                  </Text>
                  <Text
                    style={[styles.logLabel, { color: colors.textSecondary }]}
                  >
                    Sets Completed
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
                    placeholder={`e.g. ${logEntry.sets}`}
                    placeholderTextColor={colors.textMuted}
                    value={logSets}
                    onChangeText={(text) =>
                      setLogSets(sanitizeSetsRepsInput(text))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
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
                    onChangeText={(text) =>
                      setLogReps(sanitizeSetsRepsInput(text))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text
                    style={[styles.logLabel, { color: colors.textSecondary }]}
                  >
                    Weight Used in kg (optional)
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
                    placeholder="e.g. 10"
                    placeholderTextColor={colors.textMuted}
                    value={logWeight}
                    onChangeText={(text) =>
                      setLogWeight(sanitizeNumericInput(text))
                    }
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.saveLogBtn} onPress={saveLog}>
                    <Text style={styles.saveLogText}>Save Log</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* LOG OWN WORKOUT MODAL */}
      <Modal
        visible={showCustomLogModal}
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
              style={[styles.logModalContent, { backgroundColor: colors.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Log Own Workout
                  {customDayIndex !== null
                    ? ` — ${workoutPlan[customDayIndex]?.day}`
                    : ""}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (customSelectedExercise) {
                      setCustomSelectedExercise(null);
                    } else {
                      setShowCustomLogModal(false);
                    }
                  }}
                  hitSlop={HIT_SLOP}
                >
                  {customSelectedExercise ? (
                    <ChevronLeft size={20} color={colors.textMuted} />
                  ) : (
                    <X size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {!customSelectedExercise && (
                <View
                  style={[
                    styles.customTabRow,
                    { backgroundColor: colors.input },
                  ]}
                >
                  {(
                    [
                      { key: "search", label: "Search", Icon: Search },
                      { key: "manual", label: "Manual", Icon: NotebookPen },
                    ] as const
                  ).map((tab) => {
                    const isActive = customLogTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.customTabBtn,
                          isActive && styles.customTabActive,
                        ]}
                        onPress={() => setCustomLogTab(tab.key)}
                      >
                        <tab.Icon
                          size={14}
                          color={isActive ? "#fff" : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.customTabText,
                            { color: colors.textMuted },
                            isActive && styles.customTabTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {!customSelectedExercise && customLogTab === "search" && (
                <>
                  <View
                    style={[
                      styles.searchBar,
                      { backgroundColor: colors.input },
                    ]}
                  >
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="e.g. Push-up, Squat, Bench Press"
                      placeholderTextColor={colors.textMuted}
                      value={customSearch}
                      onChangeText={setCustomSearch}
                      autoFocus
                    />
                  </View>
                  {searchingCustom ? (
                    <ActivityIndicator
                      color={colors.primary}
                      style={{ marginTop: 16 }}
                    />
                  ) : (
                    <FlatList
                      data={customSearchResults}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.dbExerciseCard,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => pickCustomExercise(item)}
                        >
                          <View style={styles.dbExerciseInfo}>
                            <Text
                              style={[
                                styles.dbExerciseName,
                                { color: colors.text },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                styles.dbExerciseMeta,
                                { color: colors.textMuted },
                              ]}
                            >
                              {item.muscle_group} • {item.equipment}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      style={{ maxHeight: 280 }}
                    />
                  )}
                </>
              )}

              {!customSelectedExercise && customLogTab === "manual" && (
                <>
                  <Text
                    style={[
                      styles.logLabel,
                      { color: colors.textSecondary, marginBottom: 6 },
                    ]}
                  >
                    Exercise Name
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
                    placeholder="e.g. Basketball, Swimming, Zumba"
                    placeholderTextColor={colors.textMuted}
                    value={manualExerciseName}
                    onChangeText={setManualExerciseName}
                  />
                  <Text
                    style={[styles.logLabel, { color: colors.textSecondary }]}
                  >
                    Sets Completed
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
                    placeholder="e.g. 3"
                    placeholderTextColor={colors.textMuted}
                    value={customSets}
                    onChangeText={(text) =>
                      setCustomSets(sanitizeSetsRepsInput(text))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
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
                    placeholder="e.g. 12"
                    placeholderTextColor={colors.textMuted}
                    value={customReps}
                    onChangeText={(text) =>
                      setCustomReps(sanitizeSetsRepsInput(text))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text
                    style={[styles.logLabel, { color: colors.textSecondary }]}
                  >
                    Weight Used in kg (optional)
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
                    placeholder="e.g. 10"
                    placeholderTextColor={colors.textMuted}
                    value={customWeight}
                    onChangeText={(text) =>
                      setCustomWeight(sanitizeNumericInput(text))
                    }
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[
                      styles.saveLogBtn,
                      savingCustomLog && { opacity: 0.7 },
                    ]}
                    onPress={requestSaveCustomLog}
                    disabled={savingCustomLog}
                  >
                    {savingCustomLog ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveLogText}>Save Log</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {customSelectedExercise && (
                <>
                  <Text
                    style={[styles.logExerciseName, { color: colors.text }]}
                  >
                    {customSelectedExercise.name}
                  </Text>
                  <Text
                    style={[styles.logLabel, { color: colors.textSecondary }]}
                  >
                    Sets Completed
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
                    placeholder="e.g. 3"
                    placeholderTextColor={colors.textMuted}
                    value={customSets}
                    onChangeText={(text) =>
                      setCustomSets(sanitizeSetsRepsInput(text))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
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
                    placeholder="e.g. 12"
                    placeholderTextColor={colors.textMuted}
                    value={customReps}
                    onChangeText={(text) =>
                      setCustomReps(sanitizeSetsRepsInput(text))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text
                    style={[styles.logLabel, { color: colors.textSecondary }]}
                  >
                    Weight Used in kg (optional)
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
                    placeholder="e.g. 10"
                    placeholderTextColor={colors.textMuted}
                    value={customWeight}
                    onChangeText={(text) =>
                      setCustomWeight(sanitizeNumericInput(text))
                    }
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[
                      styles.saveLogBtn,
                      savingCustomLog && { opacity: 0.7 },
                    ]}
                    onPress={requestSaveCustomLog}
                    disabled={savingCustomLog}
                  >
                    {savingCustomLog ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveLogText}>Save Log</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        title={successModalTitle}
        message={successModalMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      <ConfirmModal
        visible={showCustomLogConfirm}
        title="Add This Workout?"
        message={`Add "${getCustomExerciseName()}" (${customSets} sets x ${customReps} reps${customWeight ? ` @ ${customWeight}kg` : ""}) to ${customDayIndex !== null ? workoutPlan[customDayIndex]?.day : "this day"}?`}
        confirmLabel="Add Workout"
        onConfirm={() => {
          setShowCustomLogConfirm(false);
          saveCustomLog();
        }}
        onCancel={() => setShowCustomLogConfirm(false)}
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
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
  dayActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  logAllBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logOwnBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: { backgroundColor: "#B0BEC5", opacity: 0.6 },
  disabledBtnOutline: { opacity: 0.4 },
  logAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  restCard: { alignItems: "center", paddingVertical: 20, gap: 8 },
  restTitle: { fontSize: 16, fontWeight: "700" },
  restSubtitle: { fontSize: 12, textAlign: "center", paddingHorizontal: 12 },
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
    maxHeight: "85%",
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
  youtubeFallback: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  youtubeFallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  youtubeFallbackText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  videoImageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  videoImage: {
    width: "100%",
    height: 220,
  },
  videoSourceBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoSourceBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
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
  customTabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  customTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  customTabActive: { backgroundColor: "#4CAF50" },
  customTabText: { fontSize: 12, fontWeight: "600" },
  customTabTextActive: { color: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  dbExerciseCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dbExerciseInfo: { flex: 1 },
  dbExerciseName: { fontSize: 14, fontWeight: "600" },
  dbExerciseMeta: { fontSize: 12, marginTop: 2 },
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
