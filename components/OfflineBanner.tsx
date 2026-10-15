import { CloudOff, RefreshCw } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnline, usePendingCount } from "../constants/offline";

// Thin bar at the top: shows when offline, or while saved changes are being sent.
export default function OfflineBanner() {
  const online = useOnline();
  const pending = usePendingCount();

  if (online && pending === 0) return null;

  const waiting =
    pending > 0
      ? ` · ${pending} change${pending > 1 ? "s" : ""} waiting to sync`
      : "";
  const text = online
    ? `Syncing ${pending} change${pending > 1 ? "s" : ""}...`
    : `You're offline${waiting}`;

  return (
    <SafeAreaView
      edges={["top"]}
      style={online ? styles.syncBg : styles.offlineBg}
    >
      <View style={styles.row}>
        {online ? (
          <RefreshCw size={14} color="#fff" />
        ) : (
          <CloudOff size={14} color="#1f2933" />
        )}
        <Text style={[styles.text, { color: online ? "#fff" : "#1f2933" }]}>
          {text}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  offlineBg: { backgroundColor: "#F59E0B" },
  syncBg: { backgroundColor: "#2563EB" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 5,
  },
  text: { fontSize: 12, fontWeight: "600" },
});
