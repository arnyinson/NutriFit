import { useRouter } from "expo-router";
import {
  BarChart3,
  Bell,
  BellOff,
  ChevronLeft,
  Dumbbell,
  Trophy,
  Utensils,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "meal" | "workout" | "progress" | "achievement" | "system";
  is_read: boolean;
  created_at: string;
};

const filterConfig = [
  { key: "all", label: "All", Icon: Bell },
  { key: "meal", label: "Meal", Icon: Utensils },
  { key: "workout", label: "Workout", Icon: Dumbbell },
  { key: "progress", label: "Progress", Icon: BarChart3 },
  { key: "achievement", label: "Achievement", Icon: Trophy },
] as const;

const formatTimeAgo = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "meal" | "workout" | "progress" | "achievement"
  >("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (filter: string) => {
    try {
      const res = await api.get("/notifications", { params: { type: filter } });
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadNotifications(activeFilter);
  }, [activeFilter, loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(activeFilter);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "meal":
        return Utensils;
      case "workout":
        return Dumbbell;
      case "progress":
        return BarChart3;
      case "achievement":
        return Trophy;
      default:
        return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "meal":
        return "#4CAF50";
      case "workout":
        return "#FF9800";
      case "progress":
        return "#2196F3";
      case "achievement":
        return "#9C27B0";
      default:
        return "#888";
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.patch("/notifications/read-all");
    } catch (err) {
      console.error("Mark all as read error:", err);
      setNotifications(previous);
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error("Delete notification error:", err);
      setNotifications(previous);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllBtn, { color: colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterContent}
      >
        {filterConfig.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isActive && styles.filterBtnActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <filter.Icon
                size={13}
                color={isActive ? "#fff" : colors.textMuted}
              />
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textMuted },
                  isActive && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <BellOff size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {"You're all caught up!"}
            </Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const NotifIcon = getIcon(notif.type);
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border,
                  },
                  !notif.is_read && { backgroundColor: colors.surface },
                ]}
                onPress={() => markAsRead(notif.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.notifIconBox,
                    { backgroundColor: getColor(notif.type) + "20" },
                  ]}
                >
                  <NotifIcon size={20} color={getColor(notif.type)} />
                </View>
                <View style={styles.notifInfo}>
                  <View style={styles.notifTitleRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        {
                          color: notif.is_read
                            ? colors.textSecondary
                            : colors.text,
                        },
                      ]}
                    >
                      {notif.title}
                    </Text>
                    {!notif.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text
                    style={[styles.notifMessage, { color: colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {notif.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {formatTimeAgo(notif.created_at)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteNotification(notif.id)}
                >
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  unreadBadge: {
    backgroundColor: "#F44336",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  markAllBtn: { fontSize: 12, fontWeight: "600" },
  filterRow: { borderBottomWidth: 1 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  filterText: { fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  notifIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  notifInfo: { flex: 1 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notifTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  notifMessage: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 13 },
});
