import { Check, ChevronDown } from "lucide-react-native";
import { useRef, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../constants/theme";

const ERR = "#EF5350";
export const MIN_AGE = 12;
export const MAX_AGE = 75;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Option = { label: string; value: number };

// Age in whole years for a birthday (month is 0-11)
const getAge = (year: number, month: number, day: number) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() < month ||
    (today.getMonth() === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
};

// Returns an error message, or "" when the birthday is fine
export const validateBirthday = (
  month: number | null,
  day: number | null,
  year: number | null,
) => {
  if (month === null || day === null || year === null) {
    return "Please select your full birthday.";
  }
  const date = new Date(year, month, day);
  if (date.getMonth() !== month || date.getDate() !== day) {
    return "Please select a valid date.";
  }
  const age = getAge(year, month, day);
  if (age < MIN_AGE || age > MAX_AGE) {
    return `Age must be ${MIN_AGE} to ${MAX_AGE}.`;
  }
  return "";
};

// Dropdown that opens a list (same look as the Register birthday)
function SelectField({
  placeholder,
  title,
  value,
  options,
  onSelect,
  hasError,
  disabled,
  flex = 1,
}: {
  placeholder: string;
  title: string;
  value: number | null;
  options: Option[];
  onSelect: (v: number) => void;
  hasError?: boolean;
  disabled?: boolean;
  flex?: number;
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const listRef = useRef<ScrollView>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ flex }}>
      <TouchableOpacity
        style={[
          styles.selectBox,
          {
            backgroundColor: colors.input,
            borderColor: hasError ? ERR : colors.inputBorder,
          },
        ]}
        onPress={() => setOpen(true)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            color: selected ? colors.text : colors.textMuted,
          }}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.selectOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.selectSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.selectTitle, { color: colors.text }]}>
              {title}
            </Text>
            <ScrollView
              ref={listRef}
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
              onLayout={() => {
                const idx = options.findIndex((o) => o.value === value);
                if (idx > 3) {
                  listRef.current?.scrollTo({
                    y: (idx - 2) * 46,
                    animated: false,
                  });
                }
              }}
            >
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      styles.selectRow,
                      on && {
                        backgroundColor: isDark ? "#243a26" : "#f0faf0",
                      },
                    ]}
                    onPress={() => {
                      onSelect(o.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: on ? "#4CAF50" : colors.text,
                        fontWeight: on ? "700" : "400",
                      }}
                    >
                      {o.label}
                    </Text>
                    {on && <Check size={16} color="#4CAF50" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export type BirthdayValue = {
  month: number | null; // 0-11
  day: number | null;
  year: number | null;
};

// Month / Day / Year dropdowns, the same way the birthday is picked in Register
export default function BirthdayPicker({
  value,
  onChange,
  hasError,
  disabled,
}: {
  value: BirthdayValue;
  onChange: (next: BirthdayValue) => void;
  hasError?: boolean;
  disabled?: boolean;
}) {
  const { month, day, year } = value;
  const thisYear = new Date().getFullYear();

  const monthOptions: Option[] = MONTHS.map((m, i) => ({ label: m, value: i }));
  const daysInMonth =
    month === null ? 31 : new Date(year ?? 2000, month + 1, 0).getDate();
  const dayOptions: Option[] = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));
  const yearOptions: Option[] = [];
  for (let y = thisYear - MIN_AGE; y >= thisYear - MAX_AGE; y--) {
    yearOptions.push({ label: String(y), value: y });
  }

  // Keep the day valid when the month or year changes (e.g. Feb 30)
  const clampDay = (m: number | null, y: number | null, d: number | null) => {
    if (d === null || m === null) return d;
    const max = new Date(y ?? 2000, m + 1, 0).getDate();
    return d > max ? max : d;
  };

  return (
    <View style={styles.birthRow}>
      <SelectField
        flex={1.6}
        placeholder="Month"
        title="Month"
        value={month}
        options={monthOptions}
        hasError={hasError}
        disabled={disabled}
        onSelect={(v) =>
          onChange({ month: v, day: clampDay(v, year, day), year })
        }
      />
      <SelectField
        flex={1}
        placeholder="Day"
        title="Day"
        value={day}
        options={dayOptions}
        hasError={hasError}
        disabled={disabled}
        onSelect={(v) => onChange({ month, day: v, year })}
      />
      <SelectField
        flex={1.2}
        placeholder="Year"
        title="Year"
        value={year}
        options={yearOptions}
        hasError={hasError}
        disabled={disabled}
        onSelect={(v) =>
          onChange({ month, day: clampDay(month, v, day), year: v })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  birthRow: { flexDirection: "row", width: "100%", gap: 8, marginBottom: 4 },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  selectSheet: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
});
