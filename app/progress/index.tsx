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

export default function ProgressScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Stats");
  const [activePeriod, setActivePeriod] = useState("Weekly");

  const weeklyData = {
    weekLabel: "Week 3 Summary",
    dateRange: "Feb 10 - Feb 16",
    phase: "Cutting Phase",
    bodyProgress: { start: 60.5, current: 57.3, change: -3.2 },
    calorieAdherence: { target: 1650, actual: 1610, percentage: 97 },
    recommendations: [
      "Progress is steady",
      "Weight decreased appropriately",
      "Protein intake consistent",
    ],
    dailyCalories: [
      { day: "Mon", target: 1650, actual: 1600 },
      { day: "Tue", target: 1650, actual: 1680 },
      { day: "Wed", target: 1650, actual: 1620 },
      { day: "Thu", target: 1650, actual: 1590 },
      { day: "Fri", target: 1650, actual: 1640 },
      { day: "Sat", target: 1650, actual: 1700 },
      { day: "Sun", target: 1650, actual: 1610 },
    ],
    macros: { protein: 42, carbs: 38, fats: 20 },
    workoutCompletion: 85,
    mealConsistency: 92,
  };

  const maxCalorie = Math.max(
    ...weeklyData.dailyCalories.map((d) => Math.max(d.target, d.actual)),
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status & Progress</Text>
        <View style={styles.periodRow}>
          {["Weekly", "Monthly"].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodBtn,
                activePeriod === p && styles.periodBtnActive,
              ]}
              onPress={() => setActivePeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  activePeriod === p && styles.periodTextActive,
                ]}
              >
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
            <Text style={styles.weekLabel}>{weeklyData.weekLabel}</Text>
            <Text style={styles.weekDate}>{weeklyData.dateRange}</Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>🎯 {weeklyData.phase}</Text>
          </View>
        </View>

        {/* Body Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Body Progress</Text>
          <View style={styles.bodyProgressRow}>
            <View style={styles.bodyStatBox}>
              <Text style={styles.bodyStatLabel}>Start</Text>
              <Text style={styles.bodyStatValue}>
                {weeklyData.bodyProgress.start} kg
              </Text>
            </View>
            <View style={styles.bodyArrow}>
              <Text style={styles.bodyArrowText}>→</Text>
              <Text
                style={[
                  styles.bodyChange,
                  {
                    color:
                      weeklyData.bodyProgress.change < 0
                        ? "#4CAF50"
                        : "#F44336",
                  },
                ]}
              >
                {weeklyData.bodyProgress.change < 0 ? "▼" : "▲"}{" "}
                {Math.abs(weeklyData.bodyProgress.change)} kg
              </Text>
            </View>
            <View style={styles.bodyStatBox}>
              <Text style={styles.bodyStatLabel}>Current</Text>
              <Text style={styles.bodyStatValue}>
                {weeklyData.bodyProgress.current} kg
              </Text>
            </View>
          </View>

          {/* Weight Mini Graph */}
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calorie Adherence</Text>
          <View style={styles.calorieRow}>
            <View style={styles.calorieBox}>
              <Text style={styles.calorieLabel}>Target Avg</Text>
              <Text style={styles.calorieValue}>
                {weeklyData.calorieAdherence.target.toLocaleString()} kcal
              </Text>
              <View style={styles.calorieBar}>
                <View
                  style={[
                    styles.calorieBarFill,
                    { width: "100%", backgroundColor: "#ddd" },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.caloriePercent}>
              {weeklyData.calorieAdherence.percentage}%
            </Text>
          </View>
          <View style={styles.calorieRow}>
            <View style={styles.calorieBox}>
              <Text style={styles.calorieLabel}>Actual Avg</Text>
              <Text style={styles.calorieValue}>
                {weeklyData.calorieAdherence.actual.toLocaleString()} kcal
              </Text>
              <View style={styles.calorieBar}>
                <View
                  style={[
                    styles.calorieBarFill,
                    {
                      width: `${(weeklyData.calorieAdherence.actual / weeklyData.calorieAdherence.target) * 100}%`,
                      backgroundColor: "#4CAF50",
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.caloriePercent}>
              {weeklyData.calorieAdherence.percentage}%
            </Text>
          </View>
        </View>

        {/* Daily Calorie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Calorie Intake</Text>
          <View style={styles.barChart}>
            {weeklyData.dailyCalories.map((day, i) => {
              const targetH = (day.target / maxCalorie) * 80;
              const actualH = (day.actual / maxCalorie) * 80;
              const isOver = day.actual > day.target;
              return (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.bars}>
                    <View
                      style={[
                        styles.bar,
                        styles.barTarget,
                        { height: targetH },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: actualH,
                          backgroundColor: isOver ? "#FF9800" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#ddd" }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.legendText}>Under</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#FF9800" }]}
              />
              <Text style={styles.legendText}>Over</Text>
            </View>
          </View>
        </View>

        {/* Macronutrient Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Macronutrient Breakdown</Text>
          <View style={styles.macroRow}>
            {[
              {
                label: "Protein",
                value: weeklyData.macros.protein,
                color: "#4CAF50",
              },
              {
                label: "Carbs",
                value: weeklyData.macros.carbs,
                color: "#2196F3",
              },
              {
                label: "Fats",
                value: weeklyData.macros.fats,
                color: "#FF9800",
              },
            ].map((macro) => (
              <View key={macro.label} style={styles.macroBox}>
                <View style={styles.macroCircle}>
                  <Text style={[styles.macroPercent, { color: macro.color }]}>
                    {macro.value}%
                  </Text>
                </View>
                <View
                  style={[styles.macroDot, { backgroundColor: macro.color }]}
                />
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <View style={styles.macroBarContainer}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${macro.value}%`,
                        backgroundColor: macro.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Workout + Meal Consistency */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consistency</Text>
          <View style={styles.consistencyRow}>
            <View style={styles.consistencyBox}>
              <Text style={styles.consistencyIcon}>💪</Text>
              <Text style={styles.consistencyValue}>
                {weeklyData.workoutCompletion}%
              </Text>
              <Text style={styles.consistencyLabel}>Workout Completion</Text>
              <View style={styles.consistencyBar}>
                <View
                  style={[
                    styles.consistencyFill,
                    {
                      width: `${weeklyData.workoutCompletion}%`,
                      backgroundColor: "#4CAF50",
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.consistencyBox}>
              <Text style={styles.consistencyIcon}>🍽️</Text>
              <Text style={styles.consistencyValue}>
                {weeklyData.mealConsistency}%
              </Text>
              <Text style={styles.consistencyLabel}>Meal Consistency</Text>
              <View style={styles.consistencyBar}>
                <View
                  style={[
                    styles.consistencyFill,
                    {
                      width: `${weeklyData.mealConsistency}%`,
                      backgroundColor: "#2196F3",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Recommendation for Next Week */}
        <View style={[styles.card, styles.recommendCard]}>
          <View style={styles.recommendHeader}>
            <View style={styles.recommendDot} />
            <Text style={styles.recommendTitle}>Recommendation for Week 4</Text>
          </View>
          {weeklyData.recommendations.map((rec, i) => (
            <View key={i} style={styles.recommendRow}>
              <Text style={styles.recommendCheck}>✓</Text>
              <Text style={styles.recommendText}>{rec}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Week 4 Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
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
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  periodBtnActive: { backgroundColor: "#4CAF50" },
  periodText: { fontSize: 13, fontWeight: "600", color: "#888" },
  periodTextActive: { color: "#fff" },

  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  weekLabel: { fontSize: 16, fontWeight: "700", color: "#111" },
  weekDate: { fontSize: 12, color: "#888", marginTop: 2 },
  phaseBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseText: { fontSize: 12, color: "#4CAF50", fontWeight: "600" },

  card: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 14,
  },

  bodyProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  bodyStatBox: { alignItems: "center" },
  bodyStatLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  bodyStatValue: { fontSize: 18, fontWeight: "bold", color: "#111" },
  bodyArrow: { alignItems: "center" },
  bodyArrowText: { fontSize: 24, color: "#ddd" },
  bodyChange: { fontSize: 14, fontWeight: "700", marginTop: 4 },

  miniGraph: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 70,
    gap: 4,
  },
  miniGraphBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: 70,
  },
  miniGraphDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },

  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  calorieBox: { flex: 1 },
  calorieLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  calorieValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  calorieBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  calorieBarFill: { height: 8, borderRadius: 4 },
  caloriePercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
    width: 45,
    textAlign: "right",
  },

  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 4,
    marginBottom: 10,
  },
  barGroup: { flex: 1, alignItems: "center" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 8, borderRadius: 4 },
  barTarget: { backgroundColor: "#ddd" },
  barLabel: { fontSize: 9, color: "#888", marginTop: 4 },
  legendRow: { flexDirection: "row", gap: 16, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#888" },

  macroRow: { flexDirection: "row", gap: 10 },
  macroBox: { flex: 1, alignItems: "center" },
  macroCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#eee",
  },
  macroPercent: { fontSize: 16, fontWeight: "bold" },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  macroLabel: { fontSize: 12, color: "#555", marginBottom: 6 },
  macroBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBarFill: { height: 6, borderRadius: 3 },

  consistencyRow: { flexDirection: "row", gap: 12 },
  consistencyBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  consistencyIcon: { fontSize: 24, marginBottom: 6 },
  consistencyValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  consistencyLabel: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
  },
  consistencyBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  consistencyFill: { height: 6, borderRadius: 3 },

  recommendCard: { borderColor: "#4CAF50", backgroundColor: "#F1F8E9" },
  recommendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  recommendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },
  recommendTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  recommendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recommendCheck: { fontSize: 14, color: "#4CAF50", fontWeight: "bold" },
  recommendText: { fontSize: 13, color: "#444" },
  applyBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  applyBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { flex: 1, alignItems: "center" },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, color: "#aaa", marginTop: 2 },
  navLabelActive: { color: "#4CAF50", fontWeight: "700" },
});
