import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// tab = index of the bottom-nav tab to highlight (Home, Meal, Workout, Stats,
// Profile). null = no highlight.
type Step = { emoji: string; title: string; body: string; tab: number | null };

const TABS = ["Home", "Meal", "Workout", "Stats", "Profile"];

const STEPS: Step[] = [
  {
    emoji: "🏠",
    title: "Your Home",
    body: "See how many calories you have left today, your meals and your workout. Tap Take when you eat a meal.",
    tab: 0,
  },
  {
    emoji: "🍽️",
    title: "Your Meal Plan",
    body: "Meals picked for your calories, diet and allergies. Tap a meal to see the recipe and mark it as taken.",
    tab: 1,
  },
  {
    emoji: "💪",
    title: "Your Workout Plan",
    body: "A weekly plan that fits your goal and equipment. Check each exercise when you finish it.",
    tab: 2,
  },
  {
    emoji: "📊",
    title: "Track your Progress",
    body: "Daily, weekly and monthly records of your calories and weight, with a forecast of your goal.",
    tab: 3,
  },
  {
    emoji: "👤",
    title: "Your Profile",
    body: "Update your details and goal, change your picture, or send feedback to our support team.",
    tab: 4,
  },
  {
    emoji: "🎉",
    title: "You're all set!",
    body: "You can replay this tour anytime from your Profile. Enjoy NutriFit!",
    tab: null,
  },
];

type Props = { visible: boolean; onClose: () => void };

export default function Tutorial({ visible, onClose }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // -1 = Welcome screen, 0.. = steps
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (visible) setIndex(-1);
  }, [visible]);

  if (!visible) return null;

  const isWelcome = index === -1;
  const step = isWelcome ? null : STEPS[index];
  const isLast = index === STEPS.length - 1;

  const navHeight = 56 + insets.bottom;
  const tabWidth = width / 5;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {isWelcome ? (
          <View style={styles.centerWrap}>
            <View style={styles.card}>
              <Text style={styles.welcomeEmoji}>🥗</Text>
              <Text style={styles.welcomeTitle}>Welcome to NutriFit!</Text>
              <Text style={styles.body}>
                A quick 1-minute tour of how the app works. You can skip it
                anytime and replay it later from your Profile.
              </Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => setIndex(0)}
              >
                <Text style={styles.startBtnText}>Start tour</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          step && (
            <>
              {/* Card sits above the bottom navigation */}
              <View
                style={[
                  styles.cardWrap,
                  { bottom: navHeight + (step.tab !== null ? 46 : 24) },
                ]}
              >
                <View style={styles.card}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={[styles.body, { textAlign: "left" }]}>
                    {step.body}
                  </Text>

                  <View style={styles.footer}>
                    <View style={styles.dots}>
                      {STEPS.map((_, i) => (
                        <View
                          key={i}
                          style={[styles.dot, i === index && styles.dotActive]}
                        />
                      ))}
                    </View>
                    {!isLast && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={{ padding: 8 }}
                      >
                        <Text style={styles.skipText}>Skip</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={() => (isLast ? onClose() : setIndex(index + 1))}
                    >
                      <Text style={styles.nextBtnText}>
                        {isLast ? "Done" : "Next"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Spotlight on the tab being explained */}
              {step.tab !== null && (
                <>
                  <View
                    style={[
                      styles.arrow,
                      {
                        left: tabWidth * (step.tab + 0.5) - 9,
                        bottom: navHeight + 8,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.pillWrap,
                      {
                        left: tabWidth * step.tab,
                        width: tabWidth,
                        bottom: insets.bottom + 8,
                      },
                    ]}
                  >
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>{TABS[step.tab]}</Text>
                    </View>
                  </View>
                </>
              )}
            </>
          )
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)" },
  centerWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  cardWrap: { position: "absolute", left: 20, right: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },
  welcomeEmoji: { fontSize: 44, textAlign: "center", marginBottom: 8 },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
  },
  body: { fontSize: 14, lineHeight: 21, color: "#555", textAlign: "center" },
  startBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  startBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  skipText: { color: "#999", fontSize: 14, textAlign: "center" },
  stepEmoji: { fontSize: 26, marginBottom: 6 },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 6,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#DDD" },
  dotActive: { width: 20, backgroundColor: "#4CAF50" },
  nextBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  nextBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
  pillWrap: { position: "absolute", alignItems: "center" },
  pill: {
    backgroundColor: "#4CAF50",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
