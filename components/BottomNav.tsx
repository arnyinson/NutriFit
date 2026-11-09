import { usePathname, useRouter } from "expo-router";
import { BarChart3, Dumbbell, Home, User, Utensils } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../constants/theme";
import { useUnreadCount } from "../constants/unread";
import NavBadge from "./NavBadge";

// One bottom navigation for every main screen, so the order and look never
// differ from screen to screen. Order: Home, Meal, Workout, Stats, Profile.
const TABS = [
  { name: "Home", Icon: Home, route: "/dashboard" },
  { name: "Meal", Icon: Utensils, route: "/meal" },
  { name: "Workout", Icon: Dumbbell, route: "/workout" },
  { name: "Stats", Icon: BarChart3, route: "/progress" },
  { name: "Profile", Icon: User, route: "/profile" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadCount();

  return (
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
      {TABS.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            // replace (not push): switching tabs does not pile up screens
            onPress={() => {
              if (!isActive) router.replace(tab.route as any);
            }}
          >
            <View>
              <tab.Icon
                size={22}
                color={isActive ? "#4CAF50" : colors.textMuted}
                strokeWidth={isActive ? 2.4 : 2}
              />
              {tab.name === "Profile" && <NavBadge count={unreadCount} />}
            </View>
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
  );
}

const styles = StyleSheet.create({
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
