import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, Modal, Alert, Share
} from 'react-native';
import { useRouter } from 'expo-router';

type Achievement = {
  id: string;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
  icon: string;
  category: 'Nutrition' | 'Workout' | 'Goals';
};

const achievements: Achievement[] = [
  // Nutrition
  { id: 'a1', title: 'First Healthy Meal', description: 'Logged your first nutritious meal', xp: 50, unlocked: true, icon: '🥗', category: 'Nutrition' },
  { id: 'a2', title: 'Food Tracker', description: 'Logged all meals in one day', xp: 70, unlocked: true, icon: '📋', category: 'Nutrition' },
  { id: 'a3', title: 'Healthy Choice', description: 'Selected a recommended meal', xp: 50, unlocked: true, icon: '✅', category: 'Nutrition' },
  { id: 'a4', title: 'Meal Logger', description: 'Logged meals for 3 days', xp: 100, unlocked: true, icon: '📝', category: 'Nutrition' },
  { id: 'a5', title: 'Food Explorer', description: 'Logged 10 different meals', xp: 150, unlocked: false, icon: '🍱', category: 'Nutrition' },
  { id: 'a6', title: 'Nutrition Recorder', description: 'Logged meals for 30 days', xp: 300, unlocked: false, icon: '🏅', category: 'Nutrition' },
  // Workout
  { id: 'a7', title: 'First Workout', description: 'Completed your first workout', xp: 50, unlocked: true, icon: '💪', category: 'Workout' },
  { id: 'a8', title: 'Consistency King', description: 'Worked out 3 days in a row', xp: 100, unlocked: true, icon: '👑', category: 'Workout' },
  { id: 'a9', title: 'Sweat Session', description: 'Logged 5 full workouts', xp: 120, unlocked: false, icon: '🏋️', category: 'Workout' },
  { id: 'a10', title: 'Iron Will', description: 'Completed 10 workouts', xp: 200, unlocked: false, icon: '🔥', category: 'Workout' },
  { id: 'a11', title: 'No Days Off', description: 'Worked out 7 days in a row', xp: 250, unlocked: false, icon: '⚡', category: 'Workout' },
  // Goals
  { id: 'a12', title: 'Goal Setter', description: 'Set your first dietary goal', xp: 30, unlocked: true, icon: '🎯', category: 'Goals' },
  { id: 'a13', title: 'On Track', description: 'Met calorie goal for 3 days', xp: 80, unlocked: true, icon: '📊', category: 'Goals' },
  { id: 'a14', title: 'Weight Watcher', description: 'Lost 1kg toward your goal', xp: 150, unlocked: false, icon: '⚖️', category: 'Goals' },
  { id: 'a15', title: 'Halfway There', description: 'Reached 50% of weight goal', xp: 200, unlocked: false, icon: '🌟', category: 'Goals' },
  { id: 'a16', title: 'Goal Crusher', description: 'Reached your target weight', xp: 500, unlocked: false, icon: '🏆', category: 'Goals' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'Nutrition' | 'Workout' | 'Goals'>('Nutrition');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const currentLevel = Math.floor(totalXP / 200) + 1;
  const nextLevelXP = currentLevel * 200;
  const progressToNext = ((totalXP % 200) / 200) * 100;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const weightLost = 1.2;
  const mealsTaken = 21;
  const caloriesBurned = 4850;

  const filteredAchievements = achievements.filter(a => a.category === activeCategory);

  const handleShare = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `🏆 I just unlocked "${achievement.title}" on NutriFit! ${achievement.icon}\n\n${achievement.description}\n\n+${achievement.xp} XP earned! 💪\n\n#NutriFit #FitnessGoals #HealthyLiving`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share achievement.');
    }
  };

  const handleShareProgress = async () => {
    try {
      await Share.share({
        message: `💪 My NutriFit Progress Update!\n\n📉 Weight Lost: ${weightLost} kg\n🍽️ Meals Taken: ${mealsTaken}/21\n🔥 Calories Burned: ${caloriesBurned.toLocaleString()}\n⭐ Total XP: ${totalXP}\n🏅 Level: ${currentLevel}\n\n#NutriFit #FitnessJourney #HealthyLiving`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share progress.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Level + XP Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{currentLevel}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Explorer</Text>
              <Text style={styles.levelSubtitle}>+100 exp to Lv. {currentLevel + 1}</Text>
            </View>
            <Text style={styles.totalXP}>{totalXP} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${progressToNext}%` }]} />
          </View>
          <Text style={styles.xpProgress}>{totalXP % 200} / 200 XP to next level</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Great job! Small changes every day lead to big results.</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>-{weightLost} kg</Text>
              <Text style={styles.statLabel}>Weight Lost</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{mealsTaken}/21</Text>
              <Text style={styles.statLabel}>Meal Taken</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{caloriesBurned.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Cal. Burned</Text>
            </View>
          </View>

          {/* Recently Unlocked */}
          <View style={styles.recentUnlock}>
            <Text style={styles.recentIcon}>🏆</Text>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Achievement Unlocked!</Text>
              <Text style={styles.recentName}>First Weekly Meal</Text>
            </View>
          </View>

          {/* Share Progress */}
          <TouchableOpacity style={styles.shareProgressBtn} onPress={() => setShowShareModal(true)}>
            <Text style={styles.shareProgressIcon}>＜ Share My Progress</Text>
          </TouchableOpacity>
          <View style={styles.socialRow}>
            {['Facebook', 'Google', 'Twitter', 'Instagram', 'TikTok'].map((platform, i) => (
              <TouchableOpacity
                key={platform}
                style={styles.socialBtn}
                onPress={handleShareProgress}
              >
                <Text style={styles.socialIcon}>
                  {['📘', '🔴', '🐦', '📸', '🎵'][i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Achievement Progress */}
        <View style={styles.progressSummary}>
          <Text style={styles.progressText}>
            {unlockedCount}/{totalCount} Achievements Unlocked
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(unlockedCount / totalCount) * 100}%` }]} />
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryRow}>
          {(['Nutrition', 'Workout', 'Goals'] as const).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Achievement List */}
        <View style={styles.achievementList}>
          {filteredAchievements.map(achievement => (
            <TouchableOpacity
              key={achievement.id}
              style={[styles.achievementCard, !achievement.unlocked && styles.achievementCardLocked]}
              onPress={() => { setSelectedAchievement(achievement); setShowModal(true); }}
              activeOpacity={0.8}
            >
              <View style={[styles.achievementIcon, !achievement.unlocked && styles.achievementIconLocked]}>
                <Text style={styles.achievementEmoji}>
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, !achievement.unlocked && styles.achievementTitleLocked]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
                <Text style={[styles.achievementXP, { color: achievement.unlocked ? '#4CAF50' : '#bbb' }]}>
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
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalIconContainer}>
                  <Text style={styles.modalIcon}>
                    {selectedAchievement.unlocked ? selectedAchievement.icon : '🔒'}
                  </Text>
                </View>

                <Text style={styles.modalDesc}>{selectedAchievement.description}</Text>
                <Text style={styles.modalXP}>+{selectedAchievement.xp} XP</Text>
                <Text style={styles.modalCategory}>Category: {selectedAchievement.category}</Text>
                <Text style={styles.modalStatus}>
                  Status: {selectedAchievement.unlocked ? '✅ Unlocked' : '🔒 Locked'}
                </Text>

                {selectedAchievement.unlocked && (
                  <TouchableOpacity
                    style={styles.modalShareBtn}
                    onPress={() => { setShowModal(false); handleShare(selectedAchievement); }}
                  >
                    <Text style={styles.modalShareText}>Share Achievement</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Progress Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share My Progress</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sharePreview}>
              <Text style={styles.sharePreviewTitle}>💪 My NutriFit Progress</Text>
              <View style={styles.shareStatRow}>
                <Text style={styles.shareStatIcon}>📉</Text>
                <Text style={styles.shareStatText}>Weight Lost: {weightLost} kg</Text>
              </View>
              <View style={styles.shareStatRow}>
                <Text style={styles.shareStatIcon}>🍽️</Text>
                <Text style={styles.shareStatText}>Meals Taken: {mealsTaken}/21</Text>
              </View>
              <View style={styles.shareStatRow}>
                <Text style={styles.shareStatIcon}>🔥</Text>
                <Text style={styles.shareStatText}>Calories Burned: {caloriesBurned.toLocaleString()}</Text>
              </View>
              <View style={styles.shareStatRow}>
                <Text style={styles.shareStatIcon}>⭐</Text>
                <Text style={styles.shareStatText}>Total XP: {totalXP} | Level {currentLevel}</Text>
              </View>
            </View>

            <View style={styles.socialShareRow}>
              {[
                { name: 'Facebook', icon: '📘' },
                { name: 'Twitter', icon: '🐦' },
                { name: 'Instagram', icon: '📸' },
                { name: 'TikTok', icon: '🎵' },
              ].map(platform => (
                <TouchableOpacity
                  key={platform.name}
                  style={styles.socialShareBtn}
                  onPress={() => { setShowShareModal(false); handleShareProgress(); }}
                >
                  <Text style={styles.socialShareIcon}>{platform.icon}</Text>
                  <Text style={styles.socialShareName}>{platform.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { fontSize: 22, color: '#4CAF50', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  levelCard: {
    margin: 16, backgroundColor: '#fafafa', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#f0f0f0',
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  levelBadge: {
    backgroundColor: '#FF9800', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 12,
  },
  levelText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  levelSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  totalXP: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  xpBar: { height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: 10, backgroundColor: '#FF9800', borderRadius: 5 },
  xpProgress: { fontSize: 11, color: '#888', textAlign: 'right' },

  statsCard: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#fafafa',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0f0f0',
  },
  statsTitle: { fontSize: 13, color: '#555', marginBottom: 14, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#f0f0f0' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },

  recentUnlock: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFE082',
  },
  recentIcon: { fontSize: 28 },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 12, fontWeight: '600', color: '#FF9800' },
  recentName: { fontSize: 14, fontWeight: 'bold', color: '#111', marginTop: 2 },

  shareProgressBtn: { alignItems: 'center', marginBottom: 10 },
  shareProgressIcon: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  socialBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
  },
  socialIcon: { fontSize: 20 },

  progressSummary: { marginHorizontal: 16, marginBottom: 12 },
  progressText: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#4CAF50', borderRadius: 4 },

  categoryRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4, gap: 4,
  },
  categoryBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  categoryBtnActive: { backgroundColor: '#4CAF50' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTextActive: { color: '#fff' },

  achievementList: { paddingHorizontal: 16 },
  achievementCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: '#f0f0f0', marginBottom: 10, backgroundColor: '#fff',
  },
  achievementCardLocked: { backgroundColor: '#fafafa', opacity: 0.7 },
  achievementIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  achievementIconLocked: { backgroundColor: '#f5f5f5' },
  achievementEmoji: { fontSize: 24 },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  achievementTitleLocked: { color: '#999' },
  achievementDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  achievementXP: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  shareBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  shareBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  lockedBadge: { padding: 8 },
  lockedText: { fontSize: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', flex: 1 },
  modalClose: { fontSize: 20, color: '#999', padding: 4 },
  modalIconContainer: { alignItems: 'center', marginBottom: 16 },
  modalIcon: { fontSize: 64 },
  modalDesc: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 10 },
  modalXP: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', marginBottom: 6 },
  modalCategory: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 4 },
  modalStatus: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  modalShareBtn: {
    backgroundColor: '#4CAF50', padding: 14,
    borderRadius: 12, alignItems: 'center', marginBottom: 10,
  },
  modalShareText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalCloseBtn: { backgroundColor: '#f5f5f5', padding: 14, borderRadius: 12, alignItems: 'center' },
  modalCloseBtnText: { color: '#555', fontWeight: 'bold', fontSize: 15 },

  sharePreview: {
    backgroundColor: '#F1F8E9', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#C8E6C9',
  },
  sharePreviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 12, textAlign: 'center' },
  shareStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  shareStatIcon: { fontSize: 18 },
  shareStatText: { fontSize: 14, color: '#333' },
  socialShareRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  socialShareBtn: { alignItems: 'center', gap: 6 },
  socialShareIcon: { fontSize: 32 },
  socialShareName: { fontSize: 11, color: '#888' },
});