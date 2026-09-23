import { CheckCircle2 } from "lucide-react-native";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../constants/theme";

type SuccessModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export default function SuccessModal({
  visible,
  title,
  message,
  onClose,
}: SuccessModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={30} color="#4CAF50" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
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
    backgroundColor: "#4CAF5020",
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
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
