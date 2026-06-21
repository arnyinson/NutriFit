import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../constants/theme";

type Achievement = {
  id: string;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
  icon: string;
  category: "Nutrition" | "Workout" | "Goals";
};

const achievements: Achievement[] = [
  {
    id: "a1",
    title: "First Healthy Meal",
    description: "Logged your first nutritious meal",
    xp: 50,
    unlocked: true,
    icon: "🥗",
    category: "Nutrition",
  },
  {
    id: "a2",
    title: "Food Tracker",
    description: "Logged all meals in one day",
    xp: 70,
    unlocked: true,
    icon: "📋",
    category: "Nutrition",
  },
  {
    id: "a3",
    title: "Healthy Choice",
    description: "Selected a recommended meal",
    xp: 50,
    unlocked: true,
    icon: "✅",
    category: "Nutrition",
  },
  {
    id: "a4",
    title: "Meal Logger",
    description: "Logged meals for 3 days",
    xp: 100,
    unlocked: true,
    icon: "📝",
    category: "Nutrition",
  },
  {
    id: "a5",
    title: "Food Explorer",
    description: "Logged 10 different meals",
    xp: 150,
    unlocked: false,
    icon: "🍱",
    category: "Nutrition",
  },
  {
    id: "a6",
    title: "Nutrition Recorder",
    description: "Logged meals for 30 days",
    xp: 300,
    unlocked: false,
    icon: "🏅",
    category: "Nutrition",
  },
  {
    id: "a7",
    title: "First Workout",
    description: "Completed your first workout",
    xp: 50,
    unlocked: true,
    icon: "💪",
    category: "Workout",
  },
  {
    id: "a8",
    title: "Consistency King",
    description: "Worked out 3 days in a row",
    xp: 100,
    unlocked: true,
    icon: "👑",
    category: "Workout",
  },
  {
    id: "a9",
    title: "Sweat Session",
    description: "Logged 5 full workouts",
    xp: 120,
    unlocked: false,
    icon: "🏋️",
    category: "Workout",
  },
  {
    id: "a10",
    title: "Iron Will",
    description: "Completed 10 workouts",
    xp: 200,
    unlocked: false,
    icon: "🔥",
    category: "Workout",
  },
  {
    id: "a11",
    title: "No Days Off",
    description: "Worked out 7 days in a row",
    xp: 250,
    unlocked: false,
    icon: "⚡",
    category: "Workout",
  },
  {
    id: "a12",
    title: "Goal Setter",
    description: "Set your first dietary goal",
    xp: 30,
    unlocked: true,
    icon: "🎯",
    category: "Goals",
  },
  {
    id: "a13",
    title: "On Track",
    description: "Met calorie goal for 3 days",
    xp: 80,
    unlocked: true,
    icon: "📊",
    category: "Goals",
  },
  {
    id: "a14",
    title: "Weight Watcher",
    description: "Lost 1kg toward your goal",
    xp: 150,
    unlocked: false,
    icon: "⚖️",
    category: "Goals",
  },
  {
    id: "a15",
    title: "Halfway There",
    description: "Reached 50% of weight goal",
    xp: 200,
    unlocked: false,
    icon: "🌟",
    category: "Goals",
  },
  {
    id: "a16",
    title: "Goal Crusher",
    description: "Reached your target weight",
    xp: 500,
    unlocked: false,
    icon: "🏆",
    category: "Goals",
  },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<
    "Nutrition" | "Workout" | "Goals"
  >("Nutrition");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const totalXP = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xp, 0);
  const currentLevel = Math.floor(totalXP / 200) + 1;
  const progressToNext = ((totalXP % 200) / 200) * 100;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const weightLost = 1.2;
  const mealsTaken = 21;
  const caloriesBurned = 4850;

  const filteredAchievements = achievements.filter(
    (a) => a.category === activeCategory,
  );

  const handleShare = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `🏆 I just unlocked "${achievement.title}" on NutriFit! ${achievement.icon}\n\n${achievement.description}\n\n+${achievement.xp} XP earned! 💪\n\n#NutriFit #FitnessGoals`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share achievement.");
    }
  };

  const handleShareProgress = async () => {
    try {
      await Share.share({
        message: `💪 My NutriFit Progress!\n\n📉 Weight Lost: ${weightLost} kg\n🍽️ Meals Taken: ${mealsTaken}/21\n🔥 Calories Burned: ${caloriesBurned.toLocaleString()}\n⭐ Total XP: ${totalXP}\n🏅 Level: ${currentLevel}\n\n#NutriFit #FitnessJourney`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share progress.");
    }
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Achievements
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
                +100 exp to Lv. {currentLevel + 1}
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
                -{weightLost} kg
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
                {mealsTaken}/21
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
                {caloriesBurned.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Cal. Burned
              </Text>
            </View>
          </View>

          <View
            style={[styles.recentUnlock, { backgroundColor: colors.input }]}
          >
            <Text style={styles.recentIcon}>🏆</Text>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Achievement Unlocked!</Text>
              <Text style={[styles.recentName, { color: colors.text }]}>
                First Weekly Meal
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shareProgressBtn}
            onPress={() => setShowShareModal(true)}
          >
            <Text style={[styles.shareProgressIcon, { color: colors.primary }]}>
              ＜ Share My Progress
            </Text>
          </TouchableOpacity>
          <View style={styles.socialRow}>
            {["📘", "🔴", "🐦", "📸", "🎵"].map((icon, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.socialBtn, { backgroundColor: colors.input }]}
                onPress={handleShareProgress}
              >
                <Text style={styles.socialIcon}>{icon}</Text>
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
                { width: `${(unlockedCount / totalCount) * 100}%` },
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
          {filteredAchievements.map((achievement) => (
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
                <Text style={styles.achievementEmoji}>
                  {achievement.unlocked ? achievement.icon : "🔒"}
                </Text>
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
                  style={[styles.achievementDesc, { color: colors.textMuted }]}
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
                  <Text style={styles.lockedText}>🔒</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedAchievement && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedAchievement.title}
                  </Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Text
                      style={[styles.modalClose, { color: colors.textMuted }]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalIconContainer}>
                  <Text style={styles.modalIcon}>
                    {selectedAchievement.unlocked
                      ? selectedAchievement.icon
                      : "🔒"}
                  </Text>
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
                <Text style={[styles.modalStatus, { color: colors.textMuted }]}>
                  Status:{" "}
                  {selectedAchievement.unlocked ? "✅ Unlocked" : "🔒 Locked"}
                </Text>
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

      {/* Share Progress Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Share My Progress
              </Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[styles.sharePreview, { backgroundColor: colors.input }]}
            >
              <Text style={[styles.sharePreviewTitle, { color: colors.text }]}>
                💪 My NutriFit Progress
              </Text>
              {[
                { icon: "📉", text: `Weight Lost: ${weightLost} kg` },
                { icon: "🍽️", text: `Meals Taken: ${mealsTaken}/21` },
                {
                  icon: "🔥",
                  text: `Calories Burned: ${caloriesBurned.toLocaleString()}`,
                },
                {
                  icon: "⭐",
                  text: `Total XP: ${totalXP} | Level ${currentLevel}`,
                },
              ].map((item, i) => (
                <View key={i} style={styles.shareStatRow}>
                  <Text style={styles.shareStatIcon}>{item.icon}</Text>
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
              {[
                { name: "Facebook", icon: "📘" },
                { name: "Twitter", icon: "🐦" },
                { name: "Instagram", icon: "📸" },
                { name: "TikTok", icon: "🎵" },
              ].map((platform) => (
                <TouchableOpacity
                  key={platform.name}
                  style={styles.socialShareBtn}
                  onPress={() => {
                    setShowShareModal(false);
                    handleShareProgress();
                  }}
                >
                  <Text style={styles.socialShareIcon}>{platform.icon}</Text>
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
  backBtn: { fontSize: 22, fontWeight: "bold" },
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
  recentIcon: { fontSize: 28 },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 12, fontWeight: "600", color: "#FF9800" },
  recentName: { fontSize: 14, fontWeight: "bold", marginTop: 2 },
  shareProgressBtn: { alignItems: "center", marginBottom: 10 },
  shareProgressIcon: { fontSize: 14, fontWeight: "600" },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  socialIcon: { fontSize: 20 },
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
  achievementEmoji: { fontSize: 24 },
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
  lockedText: { fontSize: 20 },
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
  modalClose: { fontSize: 20, padding: 4 },
  modalIconContainer: { alignItems: "center", marginBottom: 16 },
  modalIcon: { fontSize: 64 },
  modalDesc: { fontSize: 14, textAlign: "center", marginBottom: 10 },
  modalXP: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 6,
  },
  modalCategory: { fontSize: 13, textAlign: "center", marginBottom: 4 },
  modalStatus: { fontSize: 13, textAlign: "center", marginBottom: 16 },
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
  shareStatIcon: { fontSize: 18 },
  shareStatText: { fontSize: 14 },
  socialShareRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  socialShareBtn: { alignItems: "center", gap: 6 },
  socialShareIcon: { fontSize: 32 },
  socialShareName: { fontSize: 11 },
});
