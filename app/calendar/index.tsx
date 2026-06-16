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

const weeklyMeals = [
  {
    day: "Monday",
    date: "2026-06-15",
    meals: [
      {
        type: "Breakfast",
        name: "Egg White Omelette + Oats",
        calories: 400,
        taken: true,
      },
      {
        type: "Lunch",
        name: "Grilled Chicken + Brown Rice",
        calories: 550,
        taken: true,
      },
      {
        type: "Dinner",
        name: "Grilled Chicken + Sweet Potato",
        calories: 480,
        taken: false,
      },
    ],
  },
  {
    day: "Tuesday",
    date: "2026-06-16",
    meals: [
      {
        type: "Breakfast",
        name: "Coconut Yogurt + Banana + Almonds",
        calories: 380,
        taken: false,
      },
      {
        type: "Lunch",
        name: "Turkey Breast + Quinoa + Veggies",
        calories: 560,
        taken: false,
      },
      {
        type: "Dinner",
        name: "Chicken Breast + Steamed Broccoli",
        calories: 460,
        taken: false,
      },
    ],
  },
  {
    day: "Wednesday",
    date: "2026-06-17",
    meals: [
      {
        type: "Breakfast",
        name: "Protein Smoothie + Peanut Butter Toast",
        calories: 420,
        taken: false,
      },
      {
        type: "Lunch",
        name: "Chicken + Steamed Veggies + Rice",
        calories: 510,
        taken: false,
      },
      {
        type: "Dinner",
        name: "Beef Tinola + Kangkong + Rice",
        calories: 480,
        taken: false,
      },
    ],
  },
  {
    day: "Thursday",
    date: "2026-06-18",
    meals: [
      {
        type: "Breakfast",
        name: "Scrambled Eggs + Whole Wheat Toast",
        calories: 390,
        taken: false,
      },
      {
        type: "Lunch",
        name: "Grilled Chicken + Steamed Rice",
        calories: 490,
        taken: false,
      },
      {
        type: "Dinner",
        name: "Chicken Tinola + Vegetables + Rice",
        calories: 460,
        taken: false,
      },
    ],
  },
  {
    day: "Friday",
    date: "2026-06-19",
    meals: [
      {
        type: "Breakfast",
        name: "Oatmeal + Berries + Honey",
        calories: 350,
        taken: false,
      },
      {
        type: "Lunch",
        name: "Pork Sinigang + Brown Rice",
        calories: 580,
        taken: false,
      },
      {
        type: "Dinner",
        name: "Grilled Chicken + Ensalada",
        calories: 390,
        taken: false,
      },
    ],
  },
  {
    day: "Saturday",
    date: "2026-06-20",
    meals: [
      {
        type: "Breakfast",
        name: "Banana Pancakes + Maple Syrup",
        calories: 410,
        taken: false,
      },
      {
        type: "Lunch",
        name: "Chicken Adobo + Cauliflower Rice",
        calories: 480,
        taken: false,
      },
      {
        type: "Dinner",
        name: "Vegetable Curry + Brown Rice",
        calories: 490,
        taken: false,
      },
    ],
  },
  {
    day: "Sunday",
    date: "2026-06-21",
    meals: [
      {
        type: "Breakfast",
        name: "French Toast + Fresh Fruits",
        calories: 400,
        taken: false,
      },
      {
        type: "Lunch",
        name: "Beef Kaldereta + Rice",
        calories: 620,
        taken: false,
      },
      {
        type: "Dinner",
        name: "Steamed Tofu + Mixed Vegetables",
        calories: 380,
        taken: false,
      },
    ],
  },
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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

  const getSelectedDayData = () => {
    const selected = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      selectedDate,
    );
    const dayName = selected.toLocaleDateString("en-US", { weekday: "long" });
    return weeklyMeals.find((d) => d.day === dayName);
  };

  const selectedDayData = getSelectedDayData();

  const getDateLabel = () => {
    const selected = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      selectedDate,
    );
    const diffDays = Math.round(
      (selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Calendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={prevMonth}>
              <Text style={styles.monthArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthName}</Text>
            <TouchableOpacity onPress={nextMonth}>
              <Text style={styles.monthArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Date Grid */}
          <View style={styles.dateGrid}>
            {getDaysInMonth().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCell,
                  day === selectedDate && styles.dateCellSelected,
                  day !== null &&
                    isToday(day) &&
                    day !== selectedDate &&
                    styles.dateCellToday,
                ]}
                onPress={() => day !== null && setSelectedDate(day)}
                disabled={day === null}
              >
                <Text
                  style={[
                    styles.dateText,
                    day === selectedDate && styles.dateTextSelected,
                    day !== null &&
                      isToday(day) &&
                      day !== selectedDate &&
                      styles.dateTextToday,
                  ]}
                >
                  {day ?? ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Day Meals */}
        <View style={styles.mealsSection}>
          {selectedDayData ? (
            <>
              <Text style={styles.dayHeader}>
                {getDateLabel()} — {selectedDayData.day}
              </Text>

              {selectedDayData.meals.map((meal, i) => (
                <View
                  key={i}
                  style={[styles.mealCard, meal.taken && styles.mealCardTaken]}
                >
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>
                      {meal.type === "Breakfast"
                        ? "🌅"
                        : meal.type === "Lunch"
                          ? "☀️"
                          : "🌙"}
                    </Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>{meal.type}</Text>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>~{meal.calories} kcal</Text>
                  </View>
                  {meal.taken && (
                    <View style={styles.takenBadge}>
                      <Text style={styles.takenText}>✓ Taken</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.fireIcon}>🔥</Text>
                <Text style={styles.totalText}>
                  Total kcal |{" "}
                  {selectedDayData.meals
                    .reduce((s, m) => s + m.calories, 0)
                    .toLocaleString()}{" "}
                  kcal
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noPlanCard}>
              <Text style={styles.noPlanIcon}>📅</Text>
              <Text style={styles.noPlanTitle}>No Plan Yet</Text>
              <Text style={styles.noPlanSubtitle}>
                No meal plan found for this date.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backBtn: { fontSize: 16, fontWeight: "600", color: "#4CAF50" },

  calendarCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
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
  monthArrow: { fontSize: 28, color: "#4CAF50", paddingHorizontal: 8 },
  monthTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

  dayLabels: { flexDirection: "row", marginBottom: 8 },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
  },

  dateGrid: { flexDirection: "row", flexWrap: "wrap" },
  dateCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  dateCellSelected: { backgroundColor: "#4CAF50" },
  dateCellToday: { backgroundColor: "#E8F5E9" },
  dateText: { fontSize: 14, color: "#333" },
  dateTextSelected: { color: "#fff", fontWeight: "700" },
  dateTextToday: { color: "#4CAF50", fontWeight: "700" },

  mealsSection: { paddingHorizontal: 16 },
  dayHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },

  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  mealCardTaken: { borderColor: "#4CAF50", backgroundColor: "#F1F8E9" },
  mealIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  mealEmoji: { fontSize: 20 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 13, fontWeight: "700", color: "#111" },
  mealName: { fontSize: 12, color: "#888", marginTop: 2 },
  mealCal: { fontSize: 11, color: "#4CAF50", marginTop: 2 },
  takenBadge: {
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
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginTop: 4,
  },
  fireIcon: { fontSize: 16 },
  totalText: { fontSize: 13, fontWeight: "600", color: "#333" },

  noPlanCard: { alignItems: "center", paddingVertical: 40 },
  noPlanIcon: { fontSize: 48, marginBottom: 12 },
  noPlanTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  noPlanSubtitle: { fontSize: 13, color: "#888" },
});
