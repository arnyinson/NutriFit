import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../constants/theme";

// Values are what gets saved in users.allergens (and matched against meals).
// "All ..." values are the old category names, so existing users keep working.
type Option = { value: string; label: string };
type Section = { title?: string; all: Option; items: Option[] };
type Group = { key: string; label: string; sections: Section[] };

const SIMPLE: string[] = ["Eggs", "Soy", "Wheat", "Sesame", "Lupin"];

const GROUPS: Group[] = [
  {
    key: "seafood",
    label: "Seafood",
    sections: [
      {
        title: "Fish",
        all: { value: "Fish", label: "All fish" },
        items: [
          { value: "Bangus", label: "Bangus" },
          { value: "Tilapia", label: "Tilapia" },
          { value: "Tuna", label: "Tuna" },
          { value: "Salmon", label: "Salmon" },
          { value: "Galunggong", label: "Galunggong" },
          { value: "Sardines", label: "Sardines" },
        ],
      },
      {
        title: "Shellfish & others",
        all: { value: "Shellfish", label: "All shellfish" },
        items: [
          { value: "Shrimp", label: "Shrimp (Hipon)" },
          { value: "Crab", label: "Crab (Alimango)" },
          { value: "Squid", label: "Squid (Pusit)" },
          { value: "Mussel", label: "Mussel (Tahong)" },
          { value: "Oyster", label: "Oyster (Talaba)" },
        ],
      },
    ],
  },
  {
    key: "dairy",
    label: "Dairy",
    sections: [
      {
        all: { value: "Dairy", label: "All dairy" },
        items: [
          { value: "Milk", label: "Milk" },
          { value: "Cheese", label: "Cheese" },
          { value: "Yogurt", label: "Yogurt" },
        ],
      },
    ],
  },
  {
    key: "nuts",
    label: "Nuts",
    sections: [
      {
        title: "Peanuts",
        all: { value: "Peanuts", label: "Peanuts (Mani)" },
        items: [],
      },
      {
        title: "Tree nuts",
        all: { value: "Tree Nuts", label: "All tree nuts" },
        items: [
          { value: "Cashew", label: "Cashew" },
          { value: "Almond", label: "Almond" },
          { value: "Walnut", label: "Walnut" },
          { value: "Pili", label: "Pili" },
        ],
      },
    ],
  },
];

const valuesOfGroup = (g: Group) =>
  g.sections.flatMap((s) => [s.all.value, ...s.items.map((i) => i.value)]);

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export default function AllergenPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const has = (v: string) => value.includes(v);

  const toggleSimple = (v: string) =>
    onChange(has(v) ? value.filter((x) => x !== v) : [...value, v]);

  const toggleAll = (s: Section) => {
    if (has(s.all.value)) {
      onChange(value.filter((x) => x !== s.all.value));
    } else {
      const itemValues = s.items.map((i) => i.value);
      onChange([...value.filter((x) => !itemValues.includes(x)), s.all.value]);
    }
  };

  const toggleItem = (s: Section, v: string) => {
    if (has(s.all.value)) return; // already covered by "All ..."
    onChange(has(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const chipBase = {
    backgroundColor: colors.input,
    borderColor: colors.inputBorder,
  };

  return (
    <View>
      <View style={styles.row}>
        {SIMPLE.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, chipBase, has(item) && styles.chipActive]}
            onPress={() => toggleSimple(item)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textSecondary },
                has(item) && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}

        {GROUPS.map((g) => {
          const count = valuesOfGroup(g).filter(has).length;
          const open = openKey === g.key;
          return (
            <TouchableOpacity
              key={g.key}
              style={[
                styles.chip,
                chipBase,
                styles.groupChip,
                count > 0 && styles.chipActive,
              ]}
              onPress={() => setOpenKey(open ? null : g.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textSecondary },
                  count > 0 && styles.chipTextActive,
                ]}
              >
                {g.label}
                {count > 0 ? ` (${count})` : ""}
              </Text>
              {open ? (
                <ChevronUp
                  size={14}
                  color={count > 0 ? "#fff" : colors.textSecondary}
                />
              ) : (
                <ChevronDown
                  size={14}
                  color={count > 0 ? "#fff" : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {GROUPS.filter((g) => g.key === openKey).map((g) => (
        <View
          key={g.key}
          style={[
            styles.panel,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Text style={[styles.panelHint, { color: colors.textSecondary }]}>
            Pick only what you are allergic to in {g.label.toLowerCase()}.
          </Text>
          {g.sections.map((s) => (
            <View key={s.all.value} style={styles.section}>
              {s.title ? (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {s.title}
                </Text>
              ) : null}
              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    chipBase,
                    has(s.all.value) && styles.chipActive,
                  ]}
                  onPress={() => toggleAll(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      has(s.all.value) && styles.chipTextActive,
                    ]}
                  >
                    {s.all.label}
                  </Text>
                </TouchableOpacity>
                {s.items.map((it) => {
                  const covered = has(s.all.value);
                  const active = has(it.value) || covered;
                  return (
                    <TouchableOpacity
                      key={it.value}
                      disabled={covered}
                      style={[
                        styles.chip,
                        chipBase,
                        active && styles.chipActive,
                        covered && styles.chipCovered,
                      ]}
                      onPress={() => toggleItem(s, it.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.textSecondary },
                          active && styles.chipTextActive,
                        ]}
                      >
                        {it.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  groupChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  chipCovered: { opacity: 0.55 },
  chipText: { fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  panel: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  panelHint: { fontSize: 12 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: "600" },
});
