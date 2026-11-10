import { Hcaptcha } from "@hcaptcha/react-native-hcaptcha";
import { X } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

// Public site key (safe to be in the app). The SECRET is only on the backend.
const SITE_KEY = "141a2f18-91c8-4134-8baa-d7d2bda4d984";

export type CaptchaHandle = { show: () => void };

type Props = {
  onToken: (token: string) => void; // user passed the captcha
  onCancel?: () => void; // user closed the popup
  onError?: (message: string) => void; // captcha could not load / failed
};

// hCaptcha shown in a centered card (the library's own popup sticks to the top).
// Usage: ref.current.show()
const Captcha = forwardRef<CaptchaHandle, Props>(function Captcha(
  { onToken, onCancel, onError },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const done = useRef(false); // makes sure only ONE result is reported per popup
  const { height } = useWindowDimensions();

  useImperativeHandle(ref, () => ({
    show: () => {
      done.current = false;
      setVisible(true);
    },
  }));

  const finish = (fn: () => void) => {
    if (done.current) return;
    done.current = true;
    setVisible(false);
    fn();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => finish(() => onCancel?.())}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { height: Math.min(height * 0.8, 620) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify you&apos;re human</Text>
            <TouchableOpacity
              onPress={() => finish(() => onCancel?.())}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {visible && (
              <Hcaptcha
                url="https://hcaptcha.com"
                siteKey={SITE_KEY}
                size="normal"
                theme="light"
                languageCode="en"
                showLoading
                loadingIndicatorColor="#4CAF50"
                backgroundColor="#ffffff"
                onMessage={(event: any) => {
                  if (!event) return;
                  const data = event.nativeEvent?.data;
                  // Progress messages, not results: keep the card open
                  if (data === "open" || data === "loaded") return;
                  if (data === "challenge-closed" || data === "cancel") {
                    event.reset?.();
                    finish(() => onCancel?.());
                    return;
                  }
                  if (event.success && data && data.length > 20) {
                    event.markUsed?.();
                    finish(() => onToken(data));
                    return;
                  }
                  // Anything else is an error code (network, expired, etc.)
                  event.reset?.();
                  finish(() => onError?.(String(data || "Captcha failed")));
                }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default Captcha;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#222" },
  body: { flex: 1 },
});
