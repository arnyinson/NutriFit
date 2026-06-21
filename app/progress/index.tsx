import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

export default function ProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Stats');
  const [activePeriod, setActivePeriod] = useState('Weekly');

  const weeklyData = {
    weekLabel: 'Week 3 Summary',
    dateRange: 'Feb 10 - Feb 16',
    phase: 'Cutting Phase',
    bodyProgress: { start: 60.5, current: 57.3, change: -3.2 },
    calorieAdherence: { target: 1650, actual: 1610, percentage: 97 },
    recommendations: [
      'Progress is steady',
      'Weight decreased appropriately',
      'Protein intake consistent',
    ],
    dailyCalories: [
      { day: 'Mon', target: 1650, actual: 1600 },
      { day: 'Tue', target: 1650, actual: 1680 },
      { day: 'Wed', target: 1650, actual: 1620 },
      { day: 'Thu', target: 1650, actual: 1590 },
      { day: 'Fri', target: 1650, actual: 1640 },
      { day: 'Sat', target: 1650, actual: 1700 },
      { day: 'Sun', target: 1650, actual: 1610 },
    ],
    macros: { protein: 42, carbs: 38, fats: 20 },
    workoutCompletion: 85,
    mealConsistency: 92,
  };

  const maxCalorie = Math.max(...weeklyData.dailyCalories.map(d => Math.max(d.target, d.actual)));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Status & Progress</Text>
        <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
          {['Weekly', 'Monthly'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, activePeriod === p && styles.periodBtnActive]}
              onPress={() => setActivePeriod(p)}
            >
              <Text style={[styles.periodText, { color: colors.textMuted }, activePeriod === p && styles.periodTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Week Label */}
        <View style={styles.weekHeader}>
          <View>
            <Text style={[styles.weekLabel, { color: colors.text }]}>{weeklyData.weekLabel}</Text>
            <Text style={[styles.weekDate, { color: colors.textMuted }]}>{weeklyData.dateRange}</Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>🎯 {weeklyData.phase}</Text>
          </View>
        </View>

        {/* Body Progress */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Body Progress</Text>
          <View style={styles.bodyProgressRow}>
            <View style={styles.bodyStatBox}>
              <Text style={[styles.bodyStatLabel, { color: colors.textMuted }]}>Start</Text>
              <Text style={[styles.bodyStatValue, { color: colors.text }]}>{weeklyData.bodyProgress.start} kg</Text>
            </View>
            <View style={styles.bodyArrow}>
              <Text style={[styles.bodyArrowText, { color: colors.border }]}>→</Text>
              <Text style={[styles.bodyChange, { color: weeklyData.bodyProgress.change < 0 ? '#4CAF50' : '#F44336' }]}>
                {weeklyData.bodyProgress.change < 0 ? '▼' : '▲'} {Math.abs(weeklyData.bodyProgress.change)} kg
              </Text>
            </View>
            <View style={styles.bodyStatBox}>
              <Text style={[styles.bodyStatLabel, { color: colors.textMuted }]}>Current</Text>
              <Text style={[styles.bodyStatValue, { color: colors.text }]}>{weeklyData.bodyProgress.current} kg</Text>
            </View>
          </View>
          <View style={styles.miniGraph}>
            {[60.5, 60.1, 59.6, 59.0, 58.4, 57.8, 57.3].map((val, i) => {
              const h = ((val - 57) / (61 - 57)) * 50 + 10;
              return (
                <View key={i} style={styles.miniGraphBar}>
                  <View style={[styles.miniGraphDot, { marginBottom: h }]} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Calorie Adherence */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Calorie Adherence</Text>
          <View style={styles.calorieRow}>
            <View style={styles.calorieBox}>
              <Text style={[styles.calorieLabel, { color: colors.textMuted }]}>Target Avg</Text>
              <Text style={[styles.calorieValue, { color: colors.text }]}>{weeklyData.calorieAdherence.target.toLocaleString()} kcal</Text>
              <View style={[styles.calorieBar, { backgroundColor: colors.border }]}>
                <View style={[styles.calorieBarFill, { width: '100%', backgroundColor: colors.border }]} />
              </View>
            </View>
            <Text style={styles.caloriePercent}>{weeklyData.calorieAdherence.percentage}%</Text>
          </View>
          <View style={styles.calorieRow}>
            <View style={styles.calorieBox}>
              <Text style={[styles.calorieLabel, { color: colors.textMuted }]}>Actual Avg</Text>
              <Text style={[styles.calorieValue, { color: colors.text }]}>{weeklyData.calorieAdherence.actual.toLocaleString()} kcal</Text>
              <View style={[styles.calorieBar, { backgroundColor: colors.border }]}>
                <View style={[styles.calorieBarFill, {
                  width: `${(weeklyData.calorieAdherence.actual / weeklyData.calorieAdherence.target) * 100}%`,
                  backgroundColor: '#4CAF50',
                }]} />
              </View>
            </View>
            <Text style={styles.caloriePercent}>{weeklyData.calorieAdherence.percentage}%</Text>
          </View>
        </View>

        {/* Daily Calorie Chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Calorie Intake</Text>
          <View style={styles.barChart}>
            {weeklyData.dailyCalories.map((day, i) => {
              const targetH = (day.target / maxCalorie) * 80;
              const actualH = (day.actual / maxCalorie) * 80;
              const isOver = day.actual > day.target;
              return (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.bars}>
                    <View style={[styles.bar, { height: targetH, backgroundColor: colors.border }]} />
                    <View style={[styles.bar, { height: actualH, backgroundColor: isOver ? '#FF9800' : '#4CAF50' }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Target</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Under</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Over</Text>
            </View>
          </View>
        </View>

        {/* Macronutrient Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Macronutrient Breakdown</Text>
          <View style={styles.macroRow}>
            {[
              { label: 'Protein', value: weeklyData.macros.protein, color: '#4CAF50' },
              { label: 'Carbs', value: weeklyData.macros.carbs, color: '#2196F3' },
              { label: 'Fats', value: weeklyData.macros.fats, color: '#FF9800' },
            ].map(macro => (
              <View key={macro.label} style={styles.macroBox}>
                <View style={[styles.macroCircle, { backgroundColor: colors.input }]}>
                  <Text style={[styles.macroPercent, { color: macro.color }]}>{macro.value}%</Text>
                </View>
                <View style={[styles.macroDot, { backgroundColor: macro.color }]} />
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{macro.label}</Text>
                <View style={[styles.macroBarContainer, { backgroundColor: colors.border }]}>
                  <View style={[styles.macroBarFill, { width: `${macro.value}%`, backgroundColor: macro.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Consistency */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Consistency</Text>
          <View style={styles.consistencyRow}>
            <View style={[styles.consistencyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.consistencyIcon}>💪</Text>
              <Text style={[styles.consistencyValue, { color: colors.text }]}>{weeklyData.workoutCompletion}%</Text>
              <Text style={[styles.consistencyLabel, { color: colors.textMuted }]}>Workout Completion</Text>
              <View style={[styles.consistencyBar, { backgroundColor: colors.border }]}>
                <View style={[styles.consistencyFill, { width: `${weeklyData.workoutCompletion}%`, backgroundColor: '#4CAF50' }]} />
              </View>
            </View>
            <View style={[styles.consistencyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.consistencyIcon}>🍽️</Text>
              <Text style={[styles.consistencyValue, { color: colors.text }]}>{weeklyData.mealConsistency}%</Text>
              <Text style={[styles.consistencyLabel, { color: colors.textMuted }]}>Meal Consistency</Text>
              <View style={[styles.consistencyBar, { backgroundColor: colors.border }]}>
                <View style={[styles.consistencyFill, { width: `${weeklyData.mealConsistency}%`, backgroundColor: '#2196F3' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Recommendation */}
        <View style={[styles.card, styles.recommendCard]}>
          <View style={styles.recommendHeader}>
            <View style={styles.recommendDot} />
            <Text style={[styles.recommendTitle, { color: colors.text }]}>Recommendation for Week 4</Text>
          </View>
          {weeklyData.recommendations.map((rec, i) => (
            <View key={i} style={styles.recommendRow}>
              <Text style={styles.recommendCheck}>✓</Text>
              <Text style={[styles.recommendText, { color: colors.textSecondary }]}>{rec}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Week 4 Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.navBg, borderTopColor: colors.border }]}>
        {[
          { name: 'Home', icon: '🏠', route: '/dashboard' },
          { name: 'Stats', icon: '📊', route: '/progress' },
          { name: 'Meal', icon: '🍽️', route: '/meal' },
          { name: 'Exercise', icon: '💪', route: '/workout' },
          { name: 'Profile', icon: '👤', route: '/profile' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => { setActiveTab(tab.name); router.push(tab.route as any); }}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[styles.navLabel, { color: colors.textMuted }, activeTab === tab.name && styles.navLabelActive]}>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  periodRow: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#4CAF50' },
  periodText: { fontSize: 13, fontWeight: '600' },
  periodTextActive: { color: '#fff' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  weekLabel: { fontSize: 16, fontWeight: '700' },
  weekDate: { fontSize: 12, marginTop: 2 },
  phaseBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  phaseText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  card: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  bodyProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  bodyStatBox: { alignItems: 'center' },
  bodyStatLabel: { fontSize: 12, marginBottom: 4 },
  bodyStatValue: { fontSize: 18, fontWeight: 'bold' },
  bodyArrow: { alignItems: 'center' },
  bodyArrowText: { fontSize: 24 },
  bodyChange: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  miniGraph: { flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 4 },
  miniGraphBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 70 },
  miniGraphDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  calorieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  calorieBox: { flex: 1 },
  calorieLabel: { fontSize: 12, marginBottom: 4 },
  calorieValue: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  calorieBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  calorieBarFill: { height: 8, borderRadius: 4 },
  caloriePercent: { fontSize: 16, fontWeight: '700', color: '#4CAF50', width: 45, textAlign: 'right' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: 10 },
  barGroup: { flex: 1, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 8, borderRadius: 4 },
  barLabel: { fontSize: 9, marginTop: 4 },
  legendRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroBox: { flex: 1, alignItems: 'center' },
  macroCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 3, borderColor: '#eee' },
  macroPercent: { fontSize: 16, fontWeight: 'bold' },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  macroLabel: { fontSize: 12, marginBottom: 6 },
  macroBarContainer: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: 6, borderRadius: 3 },
  consistencyRow: { flexDirection: 'row', gap: 12 },
  consistencyBox: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  consistencyIcon: { fontSize: 24, marginBottom: 6 },
  consistencyValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  consistencyLabel: { fontSize: 11, textAlign: 'center', marginBottom: 8 },
  consistencyBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  consistencyFill: { height: 6, borderRadius: 3 },
  recommendCard: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  recommendHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  recommendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  recommendTitle: { fontSize: 15, fontWeight: '700' },
  recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  recommendCheck: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
  recommendText: { fontSize: 13 },
  applyBtn: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  bottomNav: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, marginTop: 2 },
  navLabelActive: { color: '#4CAF50', fontWeight: '700' },
});