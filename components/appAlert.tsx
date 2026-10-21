import { AlertTriangle, Check, CloudOff, Info, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../constants/theme";

// Replaces the plain Android alert with the same look as ConfirmModal,
// for every Alert.alert(...) call in the app (no need to edit each screen).
// 1) Call installAlertOverride() once (app/_layout.tsx)
// 2) Render <AppAlertHost /> once inside <ThemeProvider> (app/_layout.tsx)

type AlertButtonLike = {
  text?: string;
  onPress?: (value?: string) => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertOptionsLike = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

type Kind = "success" | "error" | "offline" | "info" | "confirm" | "warning";

type AlertItem = {
  title: string;
  message?: string;
  buttons: AlertButtonLike[];
  kind: Kind;
  cancelable: boolean;
  onDismiss?: () => void;
};

const GREEN = "#4CAF50";
const RED = "#EF5350";
const AMBER = "#FF9800";
const BLUE = "#42A5F5";

// Picks the icon and color from the title (and from the buttons)
export const classifyAlert = (
  title: string,
  buttons: AlertButtonLike[],
): Kind => {
  const t = String(title || "").toLowerCase();
  if (/offline/.test(t)) return "offline";
  if (/error|fail|banned|deactivated|invalid|unable|denied|wrong/.test(t))
    return "error";
  if (buttons.some((b) => b.style === "destructive")) return "warning";
  if (
    /success|logged|added|saved|updated|verified|submitted|sent|reset|done|created|deleted|removed/.test(
      t,
    )
  )
    return "success";
  if (buttons.length > 1) return "confirm";
  return "info";
};

let enqueue: ((item: AlertItem) => void) | null = null;
let installed = false;

export function installAlertOverride() {
  if (installed) return;
  installed = true;
  try {
    const nativeAlert = Alert.alert.bind(Alert);
    Alert.alert = ((
      title: string,
      message?: string,
      buttons?: AlertButtonLike[],
      options?: AlertOptionsLike,
    ) => {
      // Host not ready yet: use the normal alert so the message is never lost
      if (!enqueue) {
        nativeAlert(title, message, buttons as any, options as any);
        return;
      }
      const list = buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];
      enqueue({
        title: String(title ?? ""),
        message: message ? String(message) : undefined,
        buttons: list,
        kind: classifyAlert(title, list),
        cancelable: !!options?.cancelable,
        onDismiss: options?.onDismiss,
      });
    }) as typeof Alert.alert;
  } catch (e) {
    console.log("Alert override failed:", e);
  }
}

const ICONS = {
  success: Check,
  confirm: Check,
  error: X,
  offline: CloudOff,
  info: Info,
  warning: AlertTriangle,
};

const ACCENT: Record<Kind, string> = {
  success: GREEN,
  confirm: GREEN,
  error: RED,
  offline: AMBER,
  info: BLUE,
  warning: AMBER,
};

export function AppAlertHost() {
  const { colors } = useTheme();
  const [current, setCurrent] = useState<AlertItem | null>(null);
  const currentRef = useRef<AlertItem | null>(null);
  const queue = useRef<AlertItem[]>([]);

  const showNext = useCallback(() => {
    const next = queue.current.shift() || null;
    currentRef.current = next;
    setCurrent(next);
  }, []);

  useEffect(() => {
    enqueue = (item) => {
      if (currentRef.current) {
        queue.current.push(item); // wait for the one on screen
      } else {
        currentRef.current = item;
        setCurrent(item);
      }
    };
    return () => {
      enqueue = null;
    };
  }, []);

  const close = (btn?: AlertButtonLike, dismissed?: boolean) => {
    const item = currentRef.current;
    currentRef.current = null;
    setCurrent(null);
    // Run the button action after the alert is gone (it may open another alert)
    setTimeout(() => {
      try {
        btn?.onPress?.();
        if (dismissed) item?.onDismiss?.();
      } catch (e) {
        console.log("Alert button error:", e);
      }
      if (!currentRef.current) showNext();
    }, 0);
  };

  if (!current) return null;

  const accent = ACCENT[current.kind];
  const Icon = ICONS[current.kind];
  const cancelBtn = current.buttons.find((b) => b.style === "cancel");
  const count = current.buttons.length;

  const renderButton = (b: AlertButtonLike, i: number) => {
    const isCancel = b.style === "cancel" && count > 1;
    const bg = b.style === "destructive" ? RED : GREEN;
    return (
      <TouchableOpacity
        key={i}
        style={[
          styles.button,
          count > 2 && { flex: 0, width: "100%" },
          isCancel
            ? { borderWidth: 1, borderColor: colors.inputBorder }
            : { backgroundColor: bg },
        ]}
        onPress={() => close(b)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.buttonText,
            isCancel && { color: colors.textSecondary, fontWeight: "600" },
          ]}
        >
          {b.text || "OK"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        if (current.cancelable) close(cancelBtn, true);
      }}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.iconCircle, { backgroundColor: accent + "26" }]}>
            <Icon size={28} color={accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {current.title}
          </Text>
          {!!current.message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {current.message}
            </Text>
          )}
          <View
            style={[
              styles.buttonRow,
              count > 2 && { flexDirection: "column" },
              !current.message && { marginTop: 14 },
            ]}
          >
            {current.buttons.map(renderButton)}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
