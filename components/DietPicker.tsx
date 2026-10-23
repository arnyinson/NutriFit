import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../constants/theme";

// Values are what gets saved in users.dietary_preference.
export const DIET_OPTIONS = [
  { value: "None", label: "No preference", hint: "I eat everything" },
  {
    value: "Pescatarian",
    label: "Pescatarian",
    hint: "No meat. Fish and seafood are okay",
  },
  {
    value: "Vegetarian",
    label: "Vegetarian",
    hint: "No meat or fish. Eggs and dairy are okay",
  },
  { value: "Vegan", label: "Vegan", hint: "No animal products" },
];

export const dietLabel = (value?: string | null) =>
  DIET_OPTIONS.find((o) => o.value === (value || "None"))?.label ??
  "No preference";

type Props = { value: string; onChange: (next: string) => void };

export default function DietPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = value || "None";

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.field,
          {
            backgroundColor: colors.input,
            borderColor: open ? "#4CAF50" : colors.inputBorder,
          },
        ]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={[styles.fieldText, { color: colors.text }]}>
          {dietLabel(current)}
        </Text>
        {open ? (
          <ChevronUp size={18} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={18} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {open && (
        <View
          style={[
            styles.menu,
            { backgroundColor: colors.input, borderColor: "#4CAF50" },
          ]}
        >
          {DIET_OPTIONS.map((o, i) => {
            const selected = o.value === current;
            const isLast = i === DIET_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.option,
                  !isLast && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.inputBorder,
                  },
                  // Extra room under the last option so its hint is not
                  // pressed against the bottom edge of the menu
                  isLast && styles.optionLast,
                ]}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: selected ? "#4CAF50" : colors.text },
                    ]}
                  >
                    {o.label}
                  </Text>
                  <Text
                    style={[styles.optionHint, { color: colors.textSecondary }]}
                  >
                    {o.hint}
                  </Text>
                </View>
                {selected && (
                  <Check size={16} color="#4CAF50" strokeWidth={3} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Meals in your plan will follow this preference.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldText: { fontSize: 14 },
  menu: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 58,
  },
  optionLast: { paddingBottom: 18 },
  optionLabel: { fontSize: 14, fontWeight: "600" },
  optionHint: { fontSize: 12, marginTop: 2 },
  note: { fontSize: 12, marginTop: 8 },
});
