import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Home,
  Moon,
  NotebookPen,
  Pencil,
  Repeat,
  Search,
  Sun,
  Sunrise,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

type Meal = {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  allergens: string[];
  ingredients: string[];
  instructions: string;
};

type MealEntry = {
  plan_id: string;
  meal_type: string;
  taken: boolean;
  skipped: boolean;
  meal: Meal;
};

type DayPlan = {
  date: string;
  day: string;
  meals: MealEntry[];
};

const MealTypeIcon = ({
  type,
  size = 18,
  color,
}: {
  type: string;
  size?: number;
  color: string;
}) => {
  if (type === "Breakfast") return <Sunrise size={size} color={color} />;
  if (type === "Lunch") return <Sun size={size} color={color} />;
  return <Moon size={size} color={color} />;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function MealScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [activeTab, setActiveTab] = useState("Meal");
  const [planMode, setPlanMode] = useState<"weekly" | "continuous">("weekly");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);

  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editPlanDayIndex, setEditPlanDayIndex] = useState<number | null>(null);
  const [editPlanSlot, setEditPlanSlot] = useState<MealEntry | null>(null);
  const [editPlanSearch, setEditPlanSearch] = useState("");
  const [editPlanResults, setEditPlanResults] = useState<Meal[]>([]);
  const [searchingPlan, setSearchingPlan] = useState(false);

  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);
  const [editTab, setEditTab] = useState<"replace" | "log">("replace");
  const [editMealSearch, setEditMealSearch] = useState("");
  const [editMealResults, setEditMealResults] = useState<Meal[]>([]);
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualWeight, setManualWeight] = useState("");

  const loadMealPlan = useCallback(async (mode: "weekly" | "continuous") => {
    try {
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        setUserAllergens(JSON.parse(cachedUser).allergens || []);
      }

      let res = await api.get("/meals/plan/me", { params: { mode } });
      if (!res.data.mealPlan || res.data.mealPlan.length === 0) {
        await api.post("/meals/plan/generate", { mode });
        res = await api.get("/meals/plan/me", { params: { mode } });
      }
      setMealPlan(res.data.mealPlan);
    } catch (err) {
      console.error("Load meal plan error:", err);
      Alert.alert("Error", "Unable to load your meal plan. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadMealPlan(planMode);
  }, [planMode, loadMealPlan]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMealPlan(planMode);
  };

  const toggleMeal = async (dayIndex: number, entry: MealEntry) => {
    const newTaken = !entry.taken;
    setMealPlan((prev) =>
      prev.map((day, di) =>
        di === dayIndex
          ? {
              ...day,
              meals: day.meals.map((m) =>
                m.plan_id === entry.plan_id ? { ...m, taken: newTaken } : m,
              ),
            }
          : day,
      ),
    );
    try {
      await api.patch(`/meals/plan/${entry.plan_id}/toggle`, {
        taken: newTaken,
      });
    } catch (err) {
      console.error("Toggle meal error:", err);
      setMealPlan((prev) =>
        prev.map((day, di) =>
          di === dayIndex
            ? {
                ...day,
                meals: day.meals.map((m) =>
                  m.plan_id === entry.plan_id
                    ? { ...m, taken: entry.taken }
                    : m,
                ),
              }
            : day,
        ),
      );
    }
  };

  const takeAllMeals = async (dayIndex: number) => {
    const day = mealPlan[dayIndex];
    const previous = day.meals;
    setMealPlan((prev) =>
      prev.map((d, di) =>
        di === dayIndex
          ? { ...d, meals: d.meals.map((m) => ({ ...m, taken: true })) }
          : d,
      ),
    );
    try {
      await Promise.all(
        previous
          .filter((m) => !m.taken)
          .map((m) =>
            api.patch(`/meals/plan/${m.plan_id}/toggle`, { taken: true }),
          ),
      );
    } catch (err) {
      console.error("Take all error:", err);
    }
  };

  const getDayTotal = (meals: MealEntry[]) =>
    meals.reduce((sum, m) => sum + (m.meal?.calories || 0), 0);

  // ============ EDIT PLAN (replace a slot) ============
  const openEditPlan = (dayIndex: number) => {
    setEditPlanDayIndex(dayIndex);
    setEditPlanSlot(null);
    setEditPlanSearch("");
    setEditPlanResults([]);
    setShowEditPlanModal(true);
  };

  const searchMealsForSlot = async (mealType: string, search: string) => {
    setSearchingPlan(true);
    try {
      const res = await api.get("/meals", {
        params: { meal_type: mealType, search: search || undefined },
      });
      setEditPlanResults(res.data.meals);
    } catch (err) {
      console.error("Search meals error:", err);
    } finally {
      setSearchingPlan(false);
    }
  };

  useEffect(() => {
    if (showEditPlanModal && editPlanSlot) {
      searchMealsForSlot(editPlanSlot.meal_type, editPlanSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPlanSearch, editPlanSlot]);

  const replaceMealSlot = async (newMeal: Meal) => {
    if (editPlanDayIndex === null || !editPlanSlot) return;
    try {
      await api.patch(`/meals/plan/${editPlanSlot.plan_id}/replace`, {
        new_meal_id: newMeal.id,
      });
      setMealPlan((prev) =>
        prev.map((day, di) =>
          di === editPlanDayIndex
            ? {
                ...day,
                meals: day.meals.map((m) =>
                  m.plan_id === editPlanSlot.plan_id
                    ? { ...m, meal: newMeal, taken: false }
                    : m,
                ),
              }
            : day,
        ),
      );
      setEditPlanSlot(null);
      setEditPlanSearch("");
      setShowEditPlanModal(false);
    } catch (err) {
      console.error("Replace meal error:", err);
      Alert.alert("Error", "Unable to replace meal. Please try again.");
    }
  };

  // ============ EDIT MEAL (per-row pencil: replace or log outside) ============
  const openEditMeal = (dayIndex: number, entry: MealEntry) => {
    setEditPlanDayIndex(dayIndex);
    setEditingEntry(entry);
    setEditMealSearch("");
    setEditMealResults([]);
    setEditTab("replace");
    setManualFoodName("");
    setManualKcal("");
    setManualWeight("");
    setShowEditMealModal(true);
  };

  useEffect(() => {
    if (showEditMealModal && editTab === "replace" && editingEntry) {
      (async () => {
        try {
          const res = await api.get("/meals", {
            params: {
              meal_type: editingEntry.meal_type,
              search: editMealSearch || undefined,
            },
          });
          setEditMealResults(res.data.meals);
        } catch (err) {
          console.error("Search error:", err);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMealSearch, editTab, showEditMealModal]);

  const replaceWholeMeal = async (newMeal: Meal) => {
    if (editPlanDayIndex === null || !editingEntry) return;
    try {
      await api.patch(`/meals/plan/${editingEntry.plan_id}/replace`, {
        new_meal_id: newMeal.id,
      });
      setMealPlan((prev) =>
        prev.map((day, di) =>
          di === editPlanDayIndex
            ? {
                ...day,
                meals: day.meals.map((m) =>
                  m.plan_id === editingEntry.plan_id
                    ? { ...m, meal: newMeal, taken: false }
                    : m,
                ),
              }
            : day,
        ),
      );
      setShowEditMealModal(false);
    } catch (err) {
      console.error("Replace whole meal error:", err);
      Alert.alert("Error", "Unable to replace meal. Please try again.");
    }
  };

  const [logSearchResults, setLogSearchResults] = useState<Meal[]>([]);

  useEffect(() => {
    if (
      showEditMealModal &&
      editTab === "log" &&
      manualFoodName === "" &&
      editMealSearch !== ""
    ) {
      (async () => {
        try {
          const res = await api.get("/meals", {
            params: { search: editMealSearch },
          });
          setLogSearchResults(res.data.meals);
        } catch (err) {
          console.error("Log search error:", err);
        }
      })();
    } else if (editMealSearch === "") {
      setLogSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMealSearch, editTab]);

  const logFoodFromDb = async (meal: Meal) => {
    try {
      await api.post("/meals/log", {
        food_name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      });
      Alert.alert(
        "Logged!",
        `${meal.name} (${meal.calories} kcal) added to your log.`,
      );
      setEditMealSearch("");
      setShowEditMealModal(false);
    } catch (err) {
      console.error("Log food error:", err);
      Alert.alert("Error", "Unable to log food. Please try again.");
    }
  };

  const logManualFood = async () => {
    if (!manualFoodName || !manualKcal) {
      Alert.alert("Error", "Please enter food name and calories.");
      return;
    }
    try {
      await api.post("/meals/log", {
        food_name: manualFoodName,
        calories: Number(manualKcal),
        weight_grams: manualWeight ? Number(manualWeight) : undefined,
      });
      Alert.alert(
        "Logged!",
        `${manualFoodName} — ${manualKcal} kcal added to your log.`,
      );
      setManualFoodName("");
      setManualKcal("");
      setManualWeight("");
      setShowEditMealModal(false);
    } catch (err) {
      console.error("Log manual food error:", err);
      Alert.alert("Error", "Unable to log food. Please try again.");
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Weekly Meal Plan
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Plan Mode Toggle */}
      <View style={[styles.modeRow, { backgroundColor: colors.surface }]}>
        {(["weekly", "continuous"] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeBtn, planMode === mode && styles.modeBtnActive]}
            onPress={() => setPlanMode(mode)}
          >
            <Text
              style={[
                styles.modeBtnText,
                { color: colors.textMuted },
                planMode === mode && styles.modeBtnTextActive,
              ]}
            >
              {mode === "weekly" ? "Weekly" : "Continuous"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Allergen Notice */}
      {userAllergens.length > 0 && (
        <View style={styles.allergenNotice}>
          <AlertTriangle size={14} color="#E65100" />
          <Text style={styles.allergenText}>
            Allergen filter: {userAllergens.join(", ")} — meals adjusted
            automatically
          </Text>
        </View>
      )}

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
        {mealPlan.length === 0 ? (
          <Text
            style={{
              color: colors.textMuted,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No meal plan available yet.
          </Text>
        ) : (
          mealPlan.map((day, dayIndex) => (
            <View
              key={day.date}
              style={[
                styles.daySection,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.dayHeader}>
                <View>
                  <Text style={[styles.dayTitle, { color: colors.text }]}>
                    {day.day}
                  </Text>
                  <Text style={[styles.dayDate, { color: colors.textMuted }]}>
                    {formatDateLabel(day.date)}
                  </Text>
                </View>
                <View style={styles.dayActions}>
                  <TouchableOpacity
                    style={styles.takeAllBtn}
                    onPress={() => takeAllMeals(dayIndex)}
                  >
                    <Text style={styles.takeAllText}>Take all</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditPlan(dayIndex)}
                  >
                    <Text style={styles.editText}>Edit Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {day.meals.map((entry) => (
                <TouchableOpacity
                  key={entry.plan_id}
                  style={[
                    styles.mealRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedMeal(entry.meal);
                    setShowMealModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.mealIcon, { backgroundColor: colors.input }]}
                  >
                    <MealTypeIcon
                      type={entry.meal_type}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealType, { color: colors.text }]}>
                      {entry.meal_type}
                    </Text>
                    <Text
                      style={[styles.mealName, { color: colors.textMuted }]}
                    >
                      {entry.meal?.name}
                    </Text>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroText}>
                        P: {entry.meal?.protein}g
                      </Text>
                      <Text style={styles.macroText}>
                        C: {entry.meal?.carbs}g
                      </Text>
                      <Text style={styles.macroText}>
                        F: {entry.meal?.fats}g
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealRight}>
                    <Text
                      style={[
                        styles.mealCalories,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ~{entry.meal?.calories} kcal
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        entry.taken ? styles.skipBtn : styles.takeBtn,
                      ]}
                      onPress={() => toggleMeal(dayIndex, entry)}
                    >
                      <Text style={styles.actionBtnText}>
                        {entry.taken ? "Skip" : "Take"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pencilBtn}
                      onPress={() => openEditMeal(dayIndex, entry)}
                    >
                      <Pencil size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              <View
                style={[styles.totalRow, { borderTopColor: colors.border }]}
              >
                <Flame
                  size={16}
                  color="#FF9800"
                  fill="#FF9800"
                  fillOpacity={0.2}
                />
                <Text style={[styles.totalText, { color: colors.text }]}>
                  Total kcal | {getDayTotal(day.meals).toLocaleString()} kcal
                </Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* MEAL DETAIL MODAL */}
      <Modal visible={showMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMeal && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedMeal.name}
                    </Text>
                    <TouchableOpacity onPress={() => setShowMealModal(false)}>
                      <X size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.modalSection, { color: colors.text }]}>
                    Nutritional Info
                  </Text>
                  <View style={styles.nutritionGrid}>
                    {[
                      { label: "Calories", value: `${selectedMeal.calories}` },
                      { label: "Protein", value: `${selectedMeal.protein}g` },
                      { label: "Carbs", value: `${selectedMeal.carbs}g` },
                      { label: "Fats", value: `${selectedMeal.fats}g` },
                    ].map((n) => (
                      <View
                        key={n.label}
                        style={[
                          styles.nutritionBox,
                          { backgroundColor: colors.input },
                        ]}
                      >
                        <Text style={styles.nutritionValue}>{n.value}</Text>
                        <Text
                          style={[
                            styles.nutritionLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {n.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {selectedMeal.allergens?.length > 0 && (
                    <>
                      <Text
                        style={[styles.modalSection, { color: colors.text }]}
                      >
                        Allergens
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        {selectedMeal.allergens.map((a, i) => (
                          <View
                            key={i}
                            style={{
                              backgroundColor: "#FFF3E0",
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#E65100",
                                fontWeight: "600",
                              }}
                            >
                              {a}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  <Text style={[styles.modalSection, { color: colors.text }]}>
                    Ingredients
                  </Text>
                  {(selectedMeal.ingredients || []).map((ing, i) => (
                    <View key={i} style={styles.ingredientRow}>
                      <View style={styles.ingredientBullet} />
                      <Text
                        style={[
                          styles.ingredientText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {ing}
                      </Text>
                    </View>
                  ))}
                  <Text style={[styles.modalSection, { color: colors.text }]}>
                    Cooking Instructions
                  </Text>
                  <Text
                    style={[
                      styles.stepText,
                      { color: colors.textSecondary, marginBottom: 16 },
                    ]}
                  >
                    {selectedMeal.instructions}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowMealModal(false)}
                  >
                    <Text style={styles.modalCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT PLAN MODAL */}
      <Modal visible={showEditPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editPlanSlot
                  ? `Choose ${editPlanSlot.meal_type}`
                  : `Edit ${editPlanDayIndex !== null ? mealPlan[editPlanDayIndex]?.day : ""} Plan`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (editPlanSlot) {
                    setEditPlanSlot(null);
                    setEditPlanSearch("");
                  } else setShowEditPlanModal(false);
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                {editPlanSlot ? (
                  <>
                    <ChevronLeft size={18} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                      Back
                    </Text>
                  </>
                ) : (
                  <X size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {!editPlanSlot ? (
              <ScrollView>
                <Text
                  style={[styles.editPlanSubtitle, { color: colors.textMuted }]}
                >
                  Select a meal slot to replace:
                </Text>
                {editPlanDayIndex !== null &&
                  mealPlan[editPlanDayIndex]?.meals.map((entry) => (
                    <TouchableOpacity
                      key={entry.plan_id}
                      style={[
                        styles.slotCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setEditPlanSlot(entry)}
                    >
                      <View
                        style={[
                          styles.slotIconBox,
                          { backgroundColor: colors.input },
                        ]}
                      >
                        <MealTypeIcon
                          type={entry.meal_type}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.slotInfo}>
                        <Text style={[styles.slotType, { color: colors.text }]}>
                          {entry.meal_type}
                        </Text>
                        <Text
                          style={[styles.slotName, { color: colors.textMuted }]}
                        >
                          {entry.meal?.name}
                        </Text>
                        <Text style={styles.slotCal}>
                          {entry.meal?.calories} kcal
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            ) : (
              <>
                <View
                  style={[styles.searchBar, { backgroundColor: colors.input }]}
                >
                  <Search size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={`Search ${editPlanSlot.meal_type} meals...`}
                    placeholderTextColor={colors.textMuted}
                    value={editPlanSearch}
                    onChangeText={setEditPlanSearch}
                    autoFocus
                  />
                </View>
                {searchingPlan ? (
                  <ActivityIndicator
                    color={colors.primary}
                    style={{ marginTop: 16 }}
                  />
                ) : (
                  <FlatList
                    data={editPlanResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dbMealCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => replaceMealSlot(item)}
                      >
                        <View style={styles.dbMealInfo}>
                          <Text
                            style={[styles.dbMealName, { color: colors.text }]}
                          >
                            {item.name}
                          </Text>
                          <View style={styles.macroRow}>
                            <Text style={styles.macroText}>
                              P: {item.protein}g
                            </Text>
                            <Text style={styles.macroText}>
                              C: {item.carbs}g
                            </Text>
                            <Text style={styles.macroText}>
                              F: {item.fats}g
                            </Text>
                          </View>
                          {item.allergens?.length > 0 && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 2,
                              }}
                            >
                              <AlertTriangle size={11} color="#E65100" />
                              <Text style={styles.dbMealAllergen}>
                                {item.allergens.join(", ")}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dbMealCal}>
                          {item.calories} kcal
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 400 }}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* EDIT MEAL MODAL (Replace / Log Outside) */}
      <Modal visible={showEditMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Meal
              </Text>
              <TouchableOpacity onPress={() => setShowEditMealModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.editTabRow, { backgroundColor: colors.input }]}
            >
              {(
                [
                  { key: "replace", label: "Replace", Icon: Repeat },
                  { key: "log", label: "Log Outside", Icon: NotebookPen },
                ] as const
              ).map((tab) => {
                const isActive = editTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.editTabBtn,
                      isActive && styles.editTabActive,
                    ]}
                    onPress={() => setEditTab(tab.key)}
                  >
                    <tab.Icon
                      size={14}
                      color={isActive ? "#fff" : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.editTabText,
                        { color: colors.textMuted },
                        isActive && styles.editTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {editTab === "replace" && (
              <>
                <View
                  style={[styles.searchBar, { backgroundColor: colors.input }]}
                >
                  <Search size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search replacement meal..."
                    placeholderTextColor={colors.textMuted}
                    value={editMealSearch}
                    onChangeText={setEditMealSearch}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={editMealResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dbMealCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => replaceWholeMeal(item)}
                    >
                      <View style={styles.dbMealInfo}>
                        <Text
                          style={[styles.dbMealName, { color: colors.text }]}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.macroRow}>
                          <Text style={styles.macroText}>
                            P: {item.protein}g
                          </Text>
                          <Text style={styles.macroText}>C: {item.carbs}g</Text>
                          <Text style={styles.macroText}>F: {item.fats}g</Text>
                        </View>
                      </View>
                      <Text style={styles.dbMealCal}>{item.calories} kcal</Text>
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 350 }}
                />
              </>
            )}

            {editTab === "log" && (
              <ScrollView>
                <Text
                  style={[
                    styles.editSectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Kumain ka sa labas? I-log ang iyong food intake:
                </Text>
                <Text style={[styles.logSubLabel, { color: colors.text }]}>
                  Search Meal
                </Text>
                <View
                  style={[styles.searchBar, { backgroundColor: colors.input }]}
                >
                  <Search size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search meal to log..."
                    placeholderTextColor={colors.textMuted}
                    value={editMealSearch}
                    onChangeText={setEditMealSearch}
                  />
                </View>
                {editMealSearch !== "" && (
                  <FlatList
                    data={logSearchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dbMealCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => logFoodFromDb(item)}
                      >
                        <View style={styles.dbMealInfo}>
                          <Text
                            style={[styles.dbMealName, { color: colors.text }]}
                          >
                            {item.name}
                          </Text>
                          <View style={styles.macroRow}>
                            <Text style={styles.macroText}>
                              P: {item.protein}g
                            </Text>
                            <Text style={styles.macroText}>
                              C: {item.carbs}g
                            </Text>
                            <Text style={styles.macroText}>
                              F: {item.fats}g
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.dbMealCal}>
                          {item.calories} kcal
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 180 }}
                    scrollEnabled={false}
                  />
                )}
                <Text
                  style={[
                    styles.logSubLabel,
                    { color: colors.text, marginTop: 16 },
                  ]}
                >
                  Manual Input
                </Text>
                <TextInput
                  style={[
                    styles.manualInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Food name (e.g. Jollibee Chickenjoy)"
                  placeholderTextColor={colors.textMuted}
                  value={manualFoodName}
                  onChangeText={setManualFoodName}
                />
                <TextInput
                  style={[
                    styles.manualInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Weight in grams (optional, e.g. 150)"
                  placeholderTextColor={colors.textMuted}
                  value={manualWeight}
                  onChangeText={setManualWeight}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[
                    styles.manualInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Calories (kcal) e.g. 400"
                  placeholderTextColor={colors.textMuted}
                  value={manualKcal}
                  onChangeText={setManualKcal}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={logManualFood}
                >
                  <Text style={styles.modalCloseBtnText}>Log Food</Text>
                </TouchableOpacity>
              </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  modeRow: { flexDirection: "row", margin: 16, borderRadius: 12, padding: 4 },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: "#4CAF50" },
  modeBtnText: { fontSize: 13, fontWeight: "600" },
  modeBtnTextActive: { color: "#fff" },
  allergenNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
  },
  allergenText: { fontSize: 12, color: "#E65100", flex: 1 },
  daySection: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: "700" },
  dayDate: { fontSize: 11, marginTop: 2 },
  dayActions: { flexDirection: "row", gap: 8 },
  takeAllBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  takeAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  editBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 13, fontWeight: "700" },
  mealName: { fontSize: 11, marginTop: 2 },
  macroRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  macroText: { fontSize: 10, color: "#4CAF50", fontWeight: "600" },
  mealRight: { alignItems: "flex-end", gap: 4 },
  mealCalories: { fontSize: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  takeBtn: { backgroundColor: "#4CAF50" },
  skipBtn: { backgroundColor: "#FF9800" },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pencilBtn: { padding: 4 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  totalText: { fontSize: 13, fontWeight: "600" },
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
  modalSection: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 10,
  },
  nutritionGrid: { flexDirection: "row", gap: 8 },
  nutritionBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  nutritionValue: { fontSize: 18, fontWeight: "bold", color: "#4CAF50" },
  nutritionLabel: { fontSize: 11, marginTop: 4 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  ingredientText: { fontSize: 13, flex: 1 },
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
  editPlanSubtitle: { fontSize: 13, marginBottom: 12 },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  slotIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  slotInfo: { flex: 1 },
  slotType: { fontSize: 13, fontWeight: "700" },
  slotName: { fontSize: 12 },
  slotCal: { fontSize: 11, color: "#4CAF50", marginTop: 2 },
  dbMealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dbMealInfo: { flex: 1 },
  dbMealName: { fontSize: 14, fontWeight: "600" },
  dbMealAllergen: { fontSize: 11, color: "#E65100" },
  dbMealCal: { fontSize: 13, fontWeight: "700", color: "#4CAF50" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  editTabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  editTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editTabActive: { backgroundColor: "#4CAF50" },
  editTabText: { fontSize: 11, fontWeight: "600" },
  editTabTextActive: { color: "#fff" },
  editSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  logSubLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  manualInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
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
