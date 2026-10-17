import { StyleSheet, Text, View } from "react-native";

// Small red number shown on top-right of an icon. Shows nothing when count is 0.
export default function NavBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.text}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#F44336",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});
