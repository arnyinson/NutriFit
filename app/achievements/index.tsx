import { useRouter } from "expo-router";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Crown,
  Dumbbell,
  Flame,
  Lock,
  Medal,
  NotebookPen,
  Salad,
  Scale,
  Share2,
  Sparkle,
  Star,
  Target,
  TrendingDown,
  Trophy,
  Utensils,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
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
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

const ICON_MAP: Record<string, any> = {
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
  iconKey: string;
  category: "Nutrition" | "Workout" | "Goals";
  unlocked: boolean;
};

const socialPlatforms = [
  { name: "Facebook" },
  { name: "Twitter" },
  { name: "Instagram" },
  { name: "TikTok" },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
const [activeCategory, setActiveCategory] = useState
<"Nutrition" | "Workout" | "Goals">("Nutrition");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [stats, setStats] = useState({
    weightLost: 0,
    mealsTaken: 0,
    totalCaloriesBurnedEstimate: 0,
  });

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

  const mostRecentUnlocked = achievements
    .filter((a) => a.unlocked)
    .slice(-1)[0];

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

  const handleShareProgress = async () => {
    try {
      await Share.share({
        message: `My NutriFit Progress!\n\nWeight Lost: ${stats.weightLost} kg\nMeals Taken: ${stats.mealsTaken}\nCalories Burned: ${stats.totalCaloriesBurnedEstimate.toLocaleString()}\nTotal XP: ${totalXP}\nLevel: ${currentLevel}\n\n#NutriFit #FitnessJourney`,
      });
    } catch {
      Alert.alert("Error", "Could not share progress.");
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
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Achievements
        </Text>
        <View style={{ width: 30 }} />
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
                Meal Taken
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

          {mostRecentUnlocked && (
            <View
              style={[styles.recentUnlock, { backgroundColor: colors.input }]}
            >
              <Trophy
                size={28}
                color="#FF9800"
                fill="#FF9800"
                fillOpacity={0.15}
              />
              <View style={styles.recentInfo}>
                <Text style={styles.recentTitle}>Achievement Unlocked!</Text>
                <Text style={[styles.recentName, { color: colors.text }]}>
                  {mostRecentUnlocked.title}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.shareProgressBtn}
            onPress={() => setShowShareModal(true)}
          >
            <Share2 size={14} color={colors.primary} />
            <Text style={[styles.shareProgressText, { color: colors.primary }]}>
              Share My Progress
            </Text>
          </TouchableOpacity>
          <View style={styles.socialRow}>
            {socialPlatforms.map((platform, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.socialBtn, { backgroundColor: colors.input }]}
                onPress={handleShareProgress}
              >
                <Share2 size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
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
            const AchievementIcon = ICON_MAP[achievement.iconKey] || Star;
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
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedAchievement &&
              (() => {
                const DetailIcon =
                  ICON_MAP[selectedAchievement.iconKey] || Star;
                return (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {selectedAchievement.title}
                      </Text>
                      <TouchableOpacity onPress={() => setShowModal(false)}>
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
                        <DetailIcon size={48} color="#4CAF50" />
                      ) : (
                        <Lock size={44} color={colors.textMuted} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.modalDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {selectedAchievement.description}
                    </Text>
                    <Text style={styles.modalXP}>
                      +{selectedAchievement.xp} XP
                    </Text>
                    <Text
                      style={[
                        styles.modalCategory,
                        { color: colors.textMuted },
                      ]}
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
                        style={[
                          styles.modalStatus,
                          { color: colors.textMuted },
                        ]}
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
                        <Text style={styles.modalShareText}>
                          Share Achievement
                        </Text>
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
                        style={[
                          styles.modalCloseBtnText,
                          { color: colors.text },
                        ]}
                      >
                        Close
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>

      {/* Share Progress Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Share My Progress
              </Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View
              style={[styles.sharePreview, { backgroundColor: colors.input }]}
            >
              <Text style={[styles.sharePreviewTitle, { color: colors.text }]}>
                My NutriFit Progress
              </Text>
              {[
                {
                  Icon: TrendingDown,
                  text: `Weight Lost: ${stats.weightLost} kg`,
                },
                { Icon: Utensils, text: `Meals Taken: ${stats.mealsTaken}` },
                {
                  Icon: Flame,
                  text: `Calories Burned: ${stats.totalCaloriesBurnedEstimate.toLocaleString()}`,
                },
                {
                  Icon: Star,
                  text: `Total XP: ${totalXP} | Level ${currentLevel}`,
                },
              ].map((item, i) => (
                <View key={i} style={styles.shareStatRow}>
                  <item.Icon size={18} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.shareStatText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.socialShareRow}>
              {socialPlatforms.map((platform) => (
                <TouchableOpacity
                  key={platform.name}
                  style={styles.socialShareBtn}
                  onPress={() => {
                    setShowShareModal(false);
                    handleShareProgress();
                  }}
                >
                  <View
                    style={[
                      styles.socialShareIconBox,
                      { backgroundColor: colors.input },
                    ]}
                  >
                    <Share2 size={20} color={colors.textSecondary} />
                  </View>
                  <Text
                    style={[
                      styles.socialShareName,
                      { color: colors.textMuted },
                    ]}
                  >
                    {platform.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.input }]}
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
  recentUnlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 12, fontWeight: "600", color: "#FF9800" },
  recentName: { fontSize: 14, fontWeight: "bold", marginTop: 2 },
  shareProgressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  shareProgressText: { fontSize: 14, fontWeight: "600" },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
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
    maxHeight: "85%",
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
  sharePreview: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sharePreviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  shareStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  shareStatText: { fontSize: 14 },
  socialShareRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  socialShareBtn: { alignItems: "center", gap: 6 },
  socialShareIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  socialShareName: { fontSize: 11 },
});
