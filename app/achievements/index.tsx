import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Crown,
  Download,
  Dumbbell,
  Flame,
  Lock,
  Medal,
  NotebookPen,
  Salad,
  Scale,
  Share2,
  Sparkle,
  Target,
  TrendingDown,
  Trophy,
  Utensils,
  UtensilsCrossed,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";
import Logo from "../../components/Logo";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// Maps the backend's plain-text iconKey to an actual Lucide icon component,
// since icons can't be sent over JSON
const ICON_MAP: Record<string, LucideIcon> = {
  salad: Salad,
  "clipboard-list": ClipboardList,
  "check-circle": CheckCircle2,
  "notebook-pen": NotebookPen,
  "utensils-crossed": UtensilsCrossed,
  medal: Medal,
  dumbbell: Dumbbell,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  target: Target,
  "bar-chart": BarChart3,
  scale: Scale,
  sparkle: Sparkle,
  trophy: Trophy,
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
  iconKey: string;
  category: "Nutrition" | "Workout" | "Goals";
};

type AchievementStats = {
  weightLost: number;
  mealsTaken: number;
  totalCaloriesBurnedEstimate: number;
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [stats, setStats] = useState<AchievementStats>({
    weightLost: 0,
    mealsTaken: 0,
    totalCaloriesBurnedEstimate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeCategory, setActiveCategory] = useState<
    "Nutrition" | "Workout" | "Goals"
  >("Nutrition");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const shareCardRef = useRef<ViewShot>(null);

  const loadAchievements = useCallback(async () => {
    try {
      const res = await api.get("/achievements/me");
      setAchievements(res.data.achievements);
      setTotalXP(res.data.totalXP);
      setStats(res.data.stats);
    } catch (err) {
      console.error("Load achievements error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAchievements();
  };

  const currentLevel = Math.floor(totalXP / 200) + 1;
  const progressToNext = ((totalXP % 200) / 200) * 100;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const filteredAchievements = achievements.filter(
    (a) => a.category === activeCategory,
  );

  const handleShare = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `I just unlocked "${achievement.title}" on NutriFit!\n\n${achievement.description}\n\n+${achievement.xp} XP earned!\n\n#NutriFit #FitnessGoals`,
      });
    } catch {
      Alert.alert("Error", "Could not share achievement.");
    }
  };

  const captureAndShareProgress = async () => {
    if (!shareCardRef.current?.capture) return;
    setCapturing(true);
    try {
      const uri = await shareCardRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share My NutriFit Progress",
        });
      } else {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not available on this device.",
        );
      }
    } catch (err) {
      console.error("Capture and share error:", err);
      Alert.alert(
        "Error",
        "Unable to create your progress card. Please try again.",
      );
    } finally {
      setCapturing(false);
    }
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
          Achievements
        </Text>
        <View style={{ width: 24 }} />
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
        {/* Level + XP Card */}
        <View
          style={[
            styles.levelCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{currentLevel}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelTitle, { color: colors.text }]}>
                Explorer
              </Text>
              <Text style={[styles.levelSubtitle, { color: colors.textMuted }]}>
                +{200 - (totalXP % 200)} exp to Lv. {currentLevel + 1}
              </Text>
            </View>
            <Text style={[styles.totalXP, { color: colors.primary }]}>
              {totalXP} XP
            </Text>
          </View>
          <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
            <View style={[styles.xpFill, { width: `${progressToNext}%` }]} />
          </View>
          <Text style={[styles.xpProgress, { color: colors.textMuted }]}>
            {totalXP % 200} / 200 XP to next level
          </Text>
        </View>

        {/* Stats Summary */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>
            Great job! Small changes every day lead to big results.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                -{stats.weightLost} kg
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Weight Lost
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.mealsTaken}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Meals Taken
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalCaloriesBurnedEstimate.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Cal. Burned
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shareProgressBtn}
            onPress={() => setShowShareModal(true)}
            hitSlop={HIT_SLOP}
          >
            <Share2 size={14} color={colors.primary} />
            <Text style={[styles.shareProgressText, { color: colors.primary }]}>
              Share My Progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievement Progress */}
        <View style={styles.progressSummary}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {unlockedCount}/{totalCount} Achievements Unlocked
          </Text>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Category Tabs */}
        <View style={[styles.categoryRow, { backgroundColor: colors.surface }]}>
          {(["Nutrition", "Workout", "Goals"] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBtn,
                activeCategory === cat && styles.categoryBtnActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.textMuted },
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Achievement List */}
        <View style={styles.achievementList}>
          {filteredAchievements.map((achievement) => {
            const AchievementIcon = ICON_MAP[achievement.iconKey] || Trophy;
            return (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
                onPress={() => {
                  setSelectedAchievement(achievement);
                  setShowModal(true);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked
                        ? "#E8F5E9"
                        : colors.input,
                    },
                  ]}
                >
                  {achievement.unlocked ? (
                    <AchievementIcon size={22} color="#4CAF50" />
                  ) : (
                    <Lock size={20} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.achievementInfo}>
                  <Text
                    style={[
                      styles.achievementTitle,
                      {
                        color: achievement.unlocked
                          ? colors.text
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {achievement.title}
                  </Text>
                  <Text
                    style={[
                      styles.achievementDesc,
                      { color: colors.textMuted },
                    ]}
                  >
                    {achievement.description}
                  </Text>
                  <Text
                    style={[
                      styles.achievementXP,
                      {
                        color: achievement.unlocked
                          ? "#4CAF50"
                          : colors.textMuted,
                      },
                    ]}
                  >
                    +{achievement.xp} XP
                  </Text>
                </View>
                {achievement.unlocked ? (
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShare(achievement)}
                    hitSlop={HIT_SLOP}
                  >
                    <Text style={styles.shareBtnText}>Share</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lockedBadge}>
                    <Lock size={18} color={colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedAchievement && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedAchievement.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    hitSlop={HIT_SLOP}
                  >
                    <X size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.modalIconContainer,
                    {
                      backgroundColor: selectedAchievement.unlocked
                        ? "#E8F5E9"
                        : colors.input,
                    },
                  ]}
                >
                  {selectedAchievement.unlocked ? (
                    (() => {
                      const ModalIcon =
                        ICON_MAP[selectedAchievement.iconKey] || Trophy;
                      return <ModalIcon size={48} color="#4CAF50" />;
                    })()
                  ) : (
                    <Lock size={44} color={colors.textMuted} />
                  )}
                </View>
                <Text
                  style={[styles.modalDesc, { color: colors.textSecondary }]}
                >
                  {selectedAchievement.description}
                </Text>
                <Text style={styles.modalXP}>+{selectedAchievement.xp} XP</Text>
                <Text
                  style={[styles.modalCategory, { color: colors.textMuted }]}
                >
                  Category: {selectedAchievement.category}
                </Text>
                <View style={styles.modalStatusRow}>
                  {selectedAchievement.unlocked ? (
                    <CheckCircle2 size={14} color={colors.textMuted} />
                  ) : (
                    <Lock size={14} color={colors.textMuted} />
                  )}
                  <Text
                    style={[styles.modalStatus, { color: colors.textMuted }]}
                  >
                    Status:{" "}
                    {selectedAchievement.unlocked ? "Unlocked" : "Locked"}
                  </Text>
                </View>
                {selectedAchievement.unlocked && (
                  <TouchableOpacity
                    style={styles.modalShareBtn}
                    onPress={() => {
                      setShowModal(false);
                      handleShare(selectedAchievement);
                    }}
                  >
                    <Text style={styles.modalShareText}>Share Achievement</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.modalCloseBtn,
                    { backgroundColor: colors.input },
                  ]}
                  onPress={() => setShowModal(false)}
                >
                  <Text
                    style={[styles.modalCloseBtnText, { color: colors.text }]}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Progress Modal — with visual card preview */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Share My Progress
              </Text>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                hitSlop={HIT_SLOP}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* The actual visual card that gets captured as an image */}
            <ViewShot
              ref={shareCardRef}
              options={{ format: "png", quality: 1 }}
              style={styles.shareCardWrapper}
            >
              <View style={styles.shareCard}>
                <View style={styles.shareCardDecorCircle1} />
                <View style={styles.shareCardDecorCircle2} />

                <View style={styles.shareCardHeader}>
                  <Logo size={36} />
                  <Text style={styles.shareCardBrand}>NutriFit</Text>
                </View>

                <Text style={styles.shareCardTagline}>My Progress</Text>
                <View style={styles.shareCardLevelRow}>
                  <View style={styles.shareCardLevelBadge}>
                    <Text style={styles.shareCardLevelText}>
                      Lv.{currentLevel}
                    </Text>
                  </View>
                  <Text style={styles.shareCardXpText}>
                    {totalXP} XP earned
                  </Text>
                </View>

                <View style={styles.shareCardStatsGrid}>
                  <View style={styles.shareCardStatBox}>
                    <TrendingDown size={20} color="#fff" />
                    <Text style={styles.shareCardStatValue}>
                      -{stats.weightLost} kg
                    </Text>
                    <Text style={styles.shareCardStatLabel}>Weight Lost</Text>
                  </View>
                  <View style={styles.shareCardStatBox}>
                    <Utensils size={20} color="#fff" />
                    <Text style={styles.shareCardStatValue}>
                      {stats.mealsTaken}
                    </Text>
                    <Text style={styles.shareCardStatLabel}>Meals Taken</Text>
                  </View>
                  <View style={styles.shareCardStatBox}>
                    <Flame size={20} color="#fff" />
                    <Text style={styles.shareCardStatValue}>
                      {stats.totalCaloriesBurnedEstimate.toLocaleString()}
                    </Text>
                    <Text style={styles.shareCardStatLabel}>Cal. Burned</Text>
                  </View>
                </View>

                <View style={styles.shareCardXpBarTrack}>
                  <View
                    style={[
                      styles.shareCardXpBarFill,
                      { width: `${progressToNext}%` },
                    ]}
                  />
                </View>
                <Text style={styles.shareCardFooterText}>
                  Building healthier habits, one day at a time 🌱
                </Text>
              </View>
            </ViewShot>

            <TouchableOpacity
              style={[styles.captureShareBtn, capturing && { opacity: 0.7 }]}
              onPress={captureAndShareProgress}
              disabled={capturing}
            >
              <Download size={18} color="#fff" />
              <Text style={styles.captureShareBtnText}>
                {capturing ? "Preparing..." : "Save & Share as Image"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: colors.input, marginTop: 8 },
              ]}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
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
  levelCard: { margin: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  levelText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: "700" },
  levelSubtitle: { fontSize: 12, marginTop: 2 },
  totalXP: { fontSize: 16, fontWeight: "bold" },
  xpBar: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 6 },
  xpFill: { height: 10, backgroundColor: "#FF9800", borderRadius: 5 },
  xpProgress: { fontSize: 11, textAlign: "right" },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statsTitle: { fontSize: 13, marginBottom: 14, textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1 },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 11, marginTop: 4 },
  shareProgressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareProgressText: { fontSize: 14, fontWeight: "600" },
  progressSummary: { marginHorizontal: 16, marginBottom: 12 },
  progressText: { fontSize: 13, marginBottom: 6, fontWeight: "600" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#4CAF50", borderRadius: 4 },
  categoryRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  categoryBtnActive: { backgroundColor: "#4CAF50" },
  categoryText: { fontSize: 13, fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  achievementList: { paddingHorizontal: 16 },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  achievementCardLocked: { opacity: 0.6 },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: "700" },
  achievementDesc: { fontSize: 12, marginTop: 2 },
  achievementXP: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  shareBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  lockedBadge: { padding: 8 },
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
  modalTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  modalIconContainer: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalDesc: { fontSize: 14, textAlign: "center", marginBottom: 10 },
  modalXP: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 6,
  },
  modalCategory: { fontSize: 13, textAlign: "center", marginBottom: 4 },
  modalStatusRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  modalStatus: { fontSize: 13 },
  modalShareBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  modalShareText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  modalCloseBtn: { padding: 14, borderRadius: 12, alignItems: "center" },
  modalCloseBtnText: { fontWeight: "bold", fontSize: 15 },

  // ============ Visual Share Card ============
  shareCardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  shareCard: {
    backgroundColor: "#4CAF50",
    padding: 24,
    minHeight: 320,
    overflow: "hidden",
  },
  shareCardDecorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -50,
  },
  shareCardDecorCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    left: -30,
  },
  shareCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  shareCardBrand: { color: "#fff", fontSize: 16, fontWeight: "800" },
  shareCardTagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  shareCardLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  shareCardLevelBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  shareCardLevelText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  shareCardXpText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  shareCardStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shareCardStatBox: { alignItems: "center", flex: 1, gap: 4 },
  shareCardStatValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  shareCardStatLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
  },
  shareCardXpBarTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    marginBottom: 14,
  },
  shareCardXpBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  shareCardFooterText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  captureShareBtn: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  captureShareBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
