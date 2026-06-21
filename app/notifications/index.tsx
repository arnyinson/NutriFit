import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'meal' | 'workout' | 'progress' | 'achievement' | 'system';
  read: boolean;
};

const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Breakfast Reminder', message: "Don't forget your Egg White Omelette + Oats this morning!", time: '7:00 AM', type: 'meal', read: false },
  { id: 'n2', title: 'Workout Time!', message: "Today's workout: Chest + Core. You got this! 💪", time: '8:30 AM', type: 'workout', read: false },
  { id: 'n3', title: 'Lunch Reminder', message: 'Your Grilled Chicken + Brown Rice is scheduled for lunch.', time: '12:00 PM', type: 'meal', read: false },
  { id: 'n4', title: 'Achievement Unlocked! 🏆', message: 'You earned "Meal Logger" — logged meals for 3 days in a row!', time: '1:00 PM', type: 'achievement', read: false },
  { id: 'n5', title: 'Progress Update', message: "You're 72% toward today's calorie goal. Keep it up! 🔥", time: '3:00 PM', type: 'progress', read: true },
  { id: 'n6', title: 'Dinner Reminder', message: 'Time for your Tuna Salad + Sweet Potato dinner!', time: '6:30 PM', type: 'meal', read: true },
  { id: 'n7', title: "You haven't logged your progress", message: 'Log your daily progress to keep track of your fitness journey.', time: '3h ago', type: 'system', read: true },
  { id: 'n8', title: 'Weekly Summary Ready', message: 'Your Week 3 summary is ready. Check your progress report!', time: 'Yesterday', type: 'progress', read: true },
  { id: 'n9', title: 'New Meal Plan Generated', message: 'Your meal plan for next week has been generated based on your progress.', time: 'Yesterday', type: 'meal', read: true },
  { id: 'n10', title: 'Workout Streak! 🔥', message: "3 days in a row! You're on fire. Keep the momentum going!", time: '2 days ago', type: 'workout', read: true },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Meal' | 'Workout' | 'Progress' | 'Achievement'>('All');

  const getIcon = (type: string) => {
    switch (type) {
      case 'meal': return '🍽️';
      case 'workout': return '💪';
      case 'progress': return '📊';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'meal': return '#4CAF50';
      case 'workout': return '#FF9800';
      case 'progress': return '#2196F3';
      case 'achievement': return '#9C27B0';
      default: return '#888';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    return n.type === activeFilter.toLowerCase();
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllBtn, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterContent}
      >
        {(['All', 'Meal', 'Workout', 'Progress', 'Achievement'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeFilter === filter && styles.filterBtnActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, { color: colors.textMuted }, activeFilter === filter && styles.filterTextActive]}>
              {filter === 'All' ? '🔔 All' :
               filter === 'Meal' ? '🍽️ Meal' :
               filter === 'Workout' ? '💪 Workout' :
               filter === 'Progress' ? '📊 Progress' : '🏆 Achievement'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{"You're all caught up!"}</Text>
          </View>
        ) : (
          filteredNotifications.map(notif => (
            <TouchableOpacity
              key={notif.id}
              style={[
                styles.notifCard,
                { backgroundColor: colors.background, borderBottomColor: colors.border },
                !notif.read && { backgroundColor: colors.surface },
              ]}
              onPress={() => markAsRead(notif.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.notifIconBox, { backgroundColor: getColor(notif.type) + '20' }]}>
                <Text style={styles.notifIcon}>{getIcon(notif.type)}</Text>
              </View>
              <View style={styles.notifInfo}>
                <View style={styles.notifTitleRow}>
                  <Text style={[styles.notifTitle, { color: notif.read ? colors.textSecondary : colors.text }]}>
                    {notif.title}
                  </Text>
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.notifMessage, { color: colors.textMuted }]} numberOfLines={2}>
                  {notif.message}
                </Text>
                <Text style={[styles.notifTime, { color: colors.textMuted }]}>{notif.time}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(notif.id)}>
                <Text style={[styles.deleteBtnText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { fontSize: 22, fontWeight: 'bold', width: 30 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  unreadBadge: { backgroundColor: '#F44336', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  markAllBtn: { fontSize: 12, fontWeight: '600' },
  filterRow: { borderBottomWidth: 1 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterBtnActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  filterText: { fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  notifCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  notifIconBox: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  notifIcon: { fontSize: 22 },
  notifInfo: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  notifMessage: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 13 },
});