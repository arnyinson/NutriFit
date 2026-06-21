import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, TextInput, Modal, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

type Ticket = {
  id: string;
  type: string;
  message: string;
  rating: number;
  date: string;
  status: 'Pending' | 'Resolved' | 'New';
};

export default function TicketScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const feedbackTypes = ['Bug Report', 'Suggestion', 'Question', 'Complaint', 'Other'];

  const ticketHistory: Ticket[] = [
    { id: 't1', type: 'Suggestion', message: 'Add dark mode to the app', rating: 5, date: 'January 10', status: 'Pending' },
    { id: 't2', type: 'Bug Report', message: 'Every time I open the exercise...', rating: 3, date: 'February 24', status: 'Pending' },
    { id: 't3', type: 'Complaint', message: "I'm spending time waiting while...", rating: 2, date: 'February 29', status: 'Resolved' },
    { id: 't4', type: 'Question', message: 'For a basic tracker, it takes up too...', rating: 4, date: 'March 2', status: 'New' },
    { id: 't5', type: 'Suggestion', message: 'Despite having a robust internet...', rating: 4, date: 'March 3', status: 'New' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'Pending') return '#FF9800';
    if (status === 'Resolved') return '#4CAF50';
    return '#2196F3';
  };

  const handleSubmit = () => {
    if (rating === 0) { Alert.alert('Error', 'Please rate your experience.'); return; }
    if (!message.trim()) { Alert.alert('Error', 'Please enter your feedback.'); return; }
    setShowSuccessModal(true);
  };

  const resetForm = () => {
    setRating(0);
    setFeedbackType('Suggestion');
    setMessage('');
    setShowSuccessModal(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Feedback</Text>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Text style={[styles.historyBtn, { color: colors.primary }]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          {/* Top Message */}
          <View style={styles.topSection}>
            <Text style={[styles.topTitle, { color: colors.text }]}>We value your feedback!</Text>
            <Text style={[styles.topSubtitle, { color: colors.textMuted }]}>
              Your thoughts help us improve and create a better experience for you.
            </Text>
          </View>

          {/* Star Rating */}
          <View style={styles.ratingSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>How was your experience?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                  <Text style={[styles.star, star <= rating && styles.starActive]}>
                    {star <= rating ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {rating === 1 ? '😞 Poor' : rating === 2 ? '😕 Fair' : rating === 3 ? '😐 Good' : rating === 4 ? '😊 Very Good' : '😄 Excellent!'}
              </Text>
            )}
          </View>

          {/* Feedback Type */}
          <View style={styles.typeSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>What type of feedback is this?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeChipRow}>
                {feedbackTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      { backgroundColor: colors.input, borderColor: colors.inputBorder },
                      feedbackType === type && styles.typeChipActive,
                    ]}
                    onPress={() => setFeedbackType(type)}
                  >
                    <Text style={[styles.typeChipText, { color: colors.textSecondary }, feedbackType === type && styles.typeChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Message */}
          <View style={styles.messageSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Tell us more (optional)</Text>
            <TextInput
              style={[styles.messageInput, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Share your thoughts, suggestion, or anything we can improve..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{message.length}/500</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitIcon}>✈️</Text>
            <Text style={styles.submitText}>Send Feedback</Text>
          </TouchableOpacity>

          {/* Anonymous Note */}
          <View style={styles.anonymousNote}>
            <Text style={styles.anonymousIcon}>🔒</Text>
            <Text style={[styles.anonymousText, { color: colors.textMuted }]}>
              Your feedback is anonymous and secure
            </Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Ticket History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>My Tickets</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.ticketSummary}>
              {[
                { label: 'Total', value: ticketHistory.length, color: colors.text },
                { label: 'New', value: ticketHistory.filter(t => t.status === 'New').length, color: '#2196F3' },
                { label: 'Pending', value: ticketHistory.filter(t => t.status === 'Pending').length, color: '#FF9800' },
                { label: 'Resolved', value: ticketHistory.filter(t => t.status === 'Resolved').length, color: '#4CAF50' },
              ].map(item => (
                <View key={item.label} style={[styles.ticketSummaryBox, { backgroundColor: colors.input }]}>
                  <Text style={[styles.ticketSummaryValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={[styles.ticketSummaryLabel, { color: colors.textMuted }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {ticketHistory.map(ticket => (
                <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.ticketTop}>
                    <View style={styles.ticketTypeRow}>
                      <Text style={[styles.ticketType, { color: colors.text }]}>{ticket.type}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{ticket.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.ticketDate, { color: colors.textMuted }]}>{ticket.date}</Text>
                  </View>
                  <Text style={[styles.ticketMessage, { color: colors.textSecondary }]} numberOfLines={2}>{ticket.message}</Text>
                  <View style={styles.ticketStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Text key={s} style={[styles.ticketStar, s <= ticket.rating && styles.ticketStarActive]}>
                        {s <= ticket.rating ? '★' : '☆'}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowHistory(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: colors.card }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.successTitle, { color: colors.text }]}>Feedback Sent!</Text>
            <Text style={[styles.successMessage, { color: colors.textMuted }]}>
              Thank you for your feedback! Our team will review it shortly.
            </Text>
            <TouchableOpacity style={styles.successBtn} onPress={resetForm}>
              <Text style={styles.successBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { fontSize: 22, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  historyBtn: { fontSize: 14, fontWeight: '600' },
  container: { padding: 20 },
  topSection: { alignItems: 'center', marginBottom: 24 },
  topTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  topSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  ratingSection: { alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12, alignSelf: 'flex-start' },
  starsRow: { flexDirection: 'row', gap: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 36, color: '#ddd' },
  starActive: { color: '#FF9800' },
  ratingLabel: { fontSize: 14, color: '#FF9800', fontWeight: '600', marginTop: 8 },
  typeSection: { marginBottom: 20 },
  typeChipRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  typeChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeChipText: { fontSize: 13 },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  messageSection: { marginBottom: 20 },
  messageInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  submitBtn: {
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  submitIcon: { fontSize: 18 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  anonymousNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  anonymousIcon: { fontSize: 16 },
  anonymousText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { fontSize: 20, padding: 4 },
  ticketSummary: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  ticketSummaryBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  ticketSummaryValue: { fontSize: 20, fontWeight: 'bold' },
  ticketSummaryLabel: { fontSize: 11, marginTop: 2 },
  ticketCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketType: { fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketDate: { fontSize: 11 },
  ticketMessage: { fontSize: 13, marginBottom: 8 },
  ticketStars: { flexDirection: 'row', gap: 2 },
  ticketStar: { fontSize: 14, color: '#ddd' },
  ticketStarActive: { color: '#FF9800' },
  modalCloseBtn: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  successModal: { margin: 40, borderRadius: 24, padding: 32, alignItems: 'center' },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  successMessage: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  successBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});