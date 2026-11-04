import { useLocalSearchParams, useRouter } from "expo-router";
import { Ban, CheckCircle2, ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../constants/api";
import { clearCache } from "../../constants/offline";
import { clearPushTokenCache } from "../../constants/pushNotifications";
import { useTheme } from "../../constants/theme";
import { publishUnread } from "../../constants/unread";


const APPEAL_MAX = 500;

export default function BannedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    reason?: string;
    appealToken?: string;
  }>();

  const reason =
    (params.reason as string) || "Violation of the Terms and Conditions";
  const appealToken = (params.appealToken as string) || "";

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // A banned user has nowhere else to go: Back must not return to the app
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showForm) {
        setShowForm(false);
        return true;
      }
      return true;
    });
    return () => sub.remove();
  }, [showForm]);

  const goToLogin = async () => {
    // So the next account never sees this account's saved data
    try {
      await clearPushTokenCache();
      publishUnread(0);
      await clearCache();
    } catch {
      // ignore, going to login matters more
    }
    router.replace("/login" as any);
  };

  const sendAppeal = async () => {
    const text = message.trim();
    if (!text) {
      setError("Please write your appeal message.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await api.post("/auth/appeal", { appealToken, message: text });
      setSent(true);
      setMessage("");
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.code === "APPEAL_PENDING") {
        // Already sent one before: show the same confirmation
        setSent(true);
      } else if (!err?.response) {
        setError(
          "Unable to connect to the server. Please check your connection and try again.",
        );
      } else {
        setError(
          data?.error || "Unable to send your appeal. Please try again.",
        );
      }
    } finally {
      setSending(false);
    }
  };

  // ---------- Appeal form ----------
  if (showForm) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.formWrap}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => setShowForm(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 14 }}>Back</Text>
            </TouchableOpacity>

            <Text style={[styles.formTitle, { color: colors.text }]}>
              Send an appeal
            </Text>
            <Text style={[styles.formSub, { color: colors.textMuted }]}>
              Tell us why you think the ban is a mistake. An admin will review
              it and reply to your email.
            </Text>

            {sent ? (
              <View style={styles.sentBox}>
                <CheckCircle2 size={18} color="#4CAF50" />
                <Text style={styles.sentText}>
                  Appeal sent. We&apos;ll review it and email you.
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Write your message..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={APPEAL_MAX}
                  value={message}
                  onChangeText={setMessage}
                  editable={!sending}
                  textAlignVertical="top"
                />
                <Text style={[styles.counter, { color: colors.textMuted }]}>
                  {message.length}/{APPEAL_MAX}
                </Text>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                {!appealToken && (
                  <Text style={[styles.errorText, { marginBottom: 12 }]}>
                    Your appeal session expired. Please go back to the login
                    screen and log in again to send an appeal.
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (sending || !appealToken) && { opacity: 0.6 },
                  ]}
                  onPress={sendAppeal}
                  disabled={sending || !appealToken}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send appeal</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {sent && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={goToLogin}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  Back to login
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------- Main banned screen ----------
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ban size={44} color="#F44336" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Account Banned
        </Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Your account has been banned and you can no longer use NutriFit.
        </Text>

        <View
          style={[
            styles.reasonCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.reasonLabel, { color: colors.textMuted }]}>
            Reason
          </Text>
          <Text style={[styles.reasonText, { color: colors.text }]}>
            {reason}
          </Text>
        </View>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {sent
            ? "Your appeal was sent. We'll review it and email you."
            : "If you believe this is a mistake, you can send an appeal to our support team."}
        </Text>
      </View>

      <View style={styles.actions}>
        {!sent && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.primaryBtnText}>Send an appeal</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={goToLogin}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            Log in with another account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(244,67,54,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  sub: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 22 },
  reasonCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  reasonLabel: { fontSize: 11, marginBottom: 4 },
  reasonText: { fontSize: 15 },
  hint: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  actions: { paddingHorizontal: 24, paddingBottom: 20, gap: 10 },
  primaryBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontWeight: "600", fontSize: 15 },
  formWrap: { padding: 24 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  formTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  formSub: { fontSize: 13, lineHeight: 19, marginBottom: 18 },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 160,
  },
  counter: { fontSize: 11, textAlign: "right", marginTop: 6, marginBottom: 14 },
  errorText: { color: "#F44336", fontSize: 13, marginBottom: 10 },
  sentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(76,175,80,0.12)",
    borderColor: "rgba(76,175,80,0.4)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sentText: { color: "#4CAF50", fontSize: 14, flex: 1 },
});
