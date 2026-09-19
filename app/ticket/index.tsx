import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronLeft,
  History,
  Image as ImageIcon,
  Lock,
  Send,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../constants/api";
import { useTheme } from "../../constants/theme";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type Ticket = {
  id: string;
  type: string;
  message: string;
  status: "New" | "Pending" | "Resolved";
  admin_response: string | null;
  created_at: string;
  image_url: string | null;
};

export default function TicketScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [feedbackType, setFeedbackType] = useState("Suggestion");
  const [message, setMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const feedbackTypes = [
    "Bug Report",
    "Suggestion",
    "Question",
    "Complaint",
    "Other",
  ];

  const loadMyTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get("/tickets/me");
      setMyTickets(res.data.tickets);
    } catch (err) {
      console.error("Load my tickets error:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (showHistory) {
      loadMyTickets();
    }
  }, [showHistory, loadMyTickets]);

  const getStatusColor = (status: string) => {
    if (status === "Pending") return "#FF9800";
    if (status === "Resolved") return "#4CAF50";
    return "#2196F3";
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to attach a screenshot.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.6,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    setUploadingImage(true);

    try {
      const formData = new FormData();
      const filename = asset.uri.split("/").pop() || "screenshot.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const res = await api.post("/upload/ticket-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAttachedImage(res.data.image_url);
    } catch (err) {
      console.error("Upload ticket image error:", err);
      Alert.alert("Error", "Unable to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your feedback.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/tickets", {
        type: feedbackType,
        message,
        image_url: attachedImage,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Unable to submit feedback. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackType("Suggestion");
    setMessage("");
    setAttachedImage(null);
    setShowSuccessModal(false);
  };

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
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          User Feedback
        </Text>
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          style={styles.historyRow}
          hitSlop={HIT_SLOP}
        >
          <History size={18} color={colors.primary} />
          <Text style={[styles.historyBtn, { color: colors.primary }]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Top Message */}
          <View style={styles.topSection}>
            <Text style={[styles.topTitle, { color: colors.text }]}>
              We value your feedback!
            </Text>
            <Text style={[styles.topSubtitle, { color: colors.textMuted }]}>
              Your thoughts help us improve and create a better experience for
              you.
            </Text>
          </View>

          {/* Feedback Type */}
          <View style={styles.typeSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              What type of feedback is this?
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeChipRow}>
                {feedbackTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                      },
                      feedbackType === type && styles.typeChipActive,
                    ]}
                    onPress={() => setFeedbackType(type)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        feedbackType === type && styles.typeChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Message */}
          <View style={styles.messageSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Tell us more
            </Text>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Share your thoughts, suggestion, or anything we can improve..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>
              {message.length}/500
            </Text>
          </View>

          {/* Attach Screenshot */}
          <View style={styles.imageSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Attach a screenshot (optional)
            </Text>
            {attachedImage ? (
              <View style={styles.attachedImageWrapper}>
                <Image
                  source={{ uri: attachedImage }}
                  style={styles.attachedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setAttachedImage(null)}
                  hitSlop={HIT_SLOP}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                ]}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <ImageIcon size={20} color={colors.textMuted} />
                    <Text
                      style={[
                        styles.attachBtnText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Tap to attach a screenshot
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={18} color="#fff" />
                <Text style={styles.submitText}>Send Feedback</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Anonymous Note */}
          <View style={styles.anonymousNote}>
            <Lock size={14} color={colors.textMuted} />
            <Text style={[styles.anonymousText, { color: colors.textMuted }]}>
              Your feedback is securely stored and reviewed by our team
            </Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Ticket History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                My Tickets
              </Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                hitSlop={HIT_SLOP}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingTickets ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 30 }}
              />
            ) : (
              <>
                {/* Summary */}
                <View style={styles.ticketSummary}>
                  {[
                    {
                      label: "Total",
                      value: myTickets.length,
                      color: colors.text,
                    },
                    {
                      label: "New",
                      value: myTickets.filter((t) => t.status === "New").length,
                      color: "#2196F3",
                    },
                    {
                      label: "Pending",
                      value: myTickets.filter((t) => t.status === "Pending")
                        .length,
                      color: "#FF9800",
                    },
                    {
                      label: "Resolved",
                      value: myTickets.filter((t) => t.status === "Resolved")
                        .length,
                      color: "#4CAF50",
                    },
                  ].map((item) => (
                    <View
                      key={item.label}
                      style={[
                        styles.ticketSummaryBox,
                        { backgroundColor: colors.input },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ticketSummaryValue,
                          { color: item.color },
                        ]}
                      >
                        {item.value}
                      </Text>
                      <Text
                        style={[
                          styles.ticketSummaryLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 400 }}
                >
                  {myTickets.length === 0 ? (
                    <Text
                      style={{
                        color: colors.textMuted,
                        textAlign: "center",
                        paddingVertical: 30,
                        fontSize: 13,
                      }}
                    >
                      You haven&apos;t submitted any feedback yet.
                    </Text>
                  ) : (
                    myTickets.map((ticket) => (
                      <View
                        key={ticket.id}
                        style={[
                          styles.ticketCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.ticketTop}>
                          <View style={styles.ticketTypeRow}>
                            <Text
                              style={[
                                styles.ticketType,
                                { color: colors.text },
                              ]}
                            >
                              {ticket.type}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor:
                                    getStatusColor(ticket.status) + "20",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: getStatusColor(ticket.status) },
                                ]}
                              >
                                {ticket.status}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.ticketDate,
                              { color: colors.textMuted },
                            ]}
                          >
                            {new Date(ticket.created_at).toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric" },
                            )}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.ticketMessage,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {ticket.message}
                        </Text>
                        {ticket.image_url && (
                          <TouchableOpacity
                            onPress={() => setViewingImage(ticket.image_url)}
                            style={styles.ticketImageThumbWrapper}
                          >
                            <Image
                              source={{ uri: ticket.image_url }}
                              style={styles.ticketImageThumb}
                              resizeMode="cover"
                            />
                            <Text
                              style={[
                                styles.ticketImageThumbLabel,
                                { color: colors.primary },
                              ]}
                            >
                              View attached screenshot
                            </Text>
                          </TouchableOpacity>
                        )}
                        {ticket.admin_response && (
                          <View
                            style={[
                              styles.adminResponseBox,
                              { backgroundColor: colors.input },
                            ]}
                          >
                            <Text
                              style={[
                                styles.adminResponseLabel,
                                { color: colors.textMuted },
                              ]}
                            >
                              Admin Response
                            </Text>
                            <Text
                              style={[
                                styles.adminResponseText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {ticket.admin_response}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowHistory(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Image Viewer Modal */}
      <Modal
        visible={!!viewingImage}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            onPress={() => setViewingImage(null)}
            hitSlop={HIT_SLOP}
          >
            <X size={26} color="#fff" />
          </TouchableOpacity>
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.imageViewerFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: colors.card }]}>
            <CheckCircle2 size={56} color="#4CAF50" />
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Feedback Sent!
            </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  historyBtn: { fontSize: 15, fontWeight: "600" },
  container: { padding: 20 },
  topSection: { alignItems: "center", marginBottom: 24 },
  topTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  topSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  typeSection: { marginBottom: 20 },
  typeChipRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  typeChipText: { fontSize: 13 },
  typeChipTextActive: { color: "#fff", fontWeight: "600" },
  messageSection: { marginBottom: 20 },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4 },
  imageSection: { marginBottom: 20 },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
  },
  attachBtnText: { fontSize: 13, fontWeight: "500" },
  attachedImageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  attachedImage: { width: "100%", height: 180 },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  anonymousNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  anonymousText: { fontSize: 12, textAlign: "center", flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  ticketSummary: { flexDirection: "row", marginBottom: 16, gap: 8 },
  ticketSummaryBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  ticketSummaryValue: { fontSize: 20, fontWeight: "bold" },
  ticketSummaryLabel: { fontSize: 11, marginTop: 2 },
  ticketCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketTypeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketType: { fontSize: 14, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700" },
  ticketDate: { fontSize: 11 },
  ticketMessage: { fontSize: 13, marginBottom: 8 },
  ticketImageThumbWrapper: { marginBottom: 8 },
  ticketImageThumb: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  ticketImageThumbLabel: { fontSize: 11, fontWeight: "600" },
  adminResponseBox: { borderRadius: 10, padding: 10, marginTop: 10 },
  adminResponseLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  adminResponseText: { fontSize: 12, lineHeight: 18 },
  modalCloseBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  modalCloseBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  imageViewerFull: { width: "100%", height: "80%" },
  successModal: {
    margin: 40,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: 22, fontWeight: "bold" },
  successMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  successBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  successBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
