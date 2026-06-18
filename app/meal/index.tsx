import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Ingredient = {
  name: string;
  hasAllergen: boolean;
  allergenType: string;
  substitute: string | null;
};

type Meal = {
  id: string;
  type: string;
  name: string;
  calories: number;
  taken: boolean;
  protein: number;
  carbs: number;
  fats: number;
  allergens: string[];
  ingredients: Ingredient[];
  instructions: string[];
  alternativeMeal?: Meal;
};

type DayPlan = {
  day: string;
  date: string;
  meals: Meal[];
};

const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });
};

const weekDates = getWeekDates();

const mealDatabase: Meal[] = [
  {
    id: "db1",
    type: "Breakfast",
    name: "Champorado + Tuyo",
    calories: 350,
    taken: false,
    protein: 12,
    carbs: 60,
    fats: 8,
    allergens: ["Fish"],
    ingredients: [
      {
        name: "1 cup glutinous rice",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "3 tbsp cocoa powder",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "2 pcs tuyo",
        hasAllergen: true,
        allergenType: "Fish",
        substitute: null,
      },
    ],
    instructions: [
      "Cook rice with cocoa.",
      "Add sugar to taste.",
      "Serve with tuyo.",
    ],
  },
  {
    id: "db2",
    type: "Breakfast",
    name: "Tapsilog",
    calories: 620,
    taken: false,
    protein: 35,
    carbs: 65,
    fats: 22,
    allergens: [],
    ingredients: [
      {
        name: "150g beef tapa",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "1 cup sinangag",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "2 eggs",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Marinate beef overnight.",
      "Fry tapa.",
      "Fry eggs.",
      "Serve with garlic rice.",
    ],
  },
  {
    id: "db3",
    type: "Breakfast",
    name: "Banana Oat Pancakes",
    calories: 310,
    taken: false,
    protein: 10,
    carbs: 55,
    fats: 7,
    allergens: [],
    ingredients: [
      {
        name: "2 ripe bananas",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "1 cup oats",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "2 eggs",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Mash bananas.",
      "Mix with oats and eggs.",
      "Cook on pan 2-3 mins each side.",
    ],
  },
  {
    id: "db4",
    type: "Lunch",
    name: "Sinigang na Baboy",
    calories: 480,
    taken: false,
    protein: 32,
    carbs: 35,
    fats: 18,
    allergens: [],
    ingredients: [
      {
        name: "200g pork ribs",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Kangkong",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Sampalok mix",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Boil pork until tender.",
      "Add sampalok mix.",
      "Add vegetables.",
      "Season and serve.",
    ],
  },
  {
    id: "db5",
    type: "Lunch",
    name: "Pinakbet + Rice",
    calories: 320,
    taken: false,
    protein: 12,
    carbs: 45,
    fats: 10,
    allergens: [],
    ingredients: [
      {
        name: "Mixed vegetables",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Bagoong alamang",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Pork bits",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Sauté garlic and onion.",
      "Add pork and bagoong.",
      "Add vegetables.",
      "Simmer until cooked.",
    ],
  },
  {
    id: "db6",
    type: "Lunch",
    name: "Kare-Kare",
    calories: 550,
    taken: false,
    protein: 38,
    carbs: 40,
    fats: 22,
    allergens: ["Peanuts"],
    ingredients: [
      {
        name: "200g oxtail",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "3 tbsp peanut butter",
        hasAllergen: true,
        allergenType: "Peanuts",
        substitute: "sunflower seed butter",
      },
      {
        name: "Eggplant & banana blossom",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Boil oxtail until tender.",
      "Add peanut butter sauce.",
      "Add vegetables.",
      "Serve with bagoong.",
    ],
  },
  {
    id: "db7",
    type: "Dinner",
    name: "Tinolang Manok",
    calories: 380,
    taken: false,
    protein: 35,
    carbs: 25,
    fats: 10,
    allergens: [],
    ingredients: [
      {
        name: "200g chicken",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Green papaya",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Malunggay",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Ginger",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Sauté ginger and onion.",
      "Add chicken and brown.",
      "Add water and papaya.",
      "Add malunggay last.",
    ],
  },
  {
    id: "db8",
    type: "Dinner",
    name: "Beef Steak + Rice",
    calories: 580,
    taken: false,
    protein: 45,
    carbs: 50,
    fats: 18,
    allergens: ["Soy"],
    ingredients: [
      {
        name: "200g beef sirloin",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "3 tbsp soy sauce",
        hasAllergen: true,
        allergenType: "Soy",
        substitute: "coconut aminos",
      },
      {
        name: "Calamansi juice",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Onion rings",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Marinate beef.",
      "Pan fry beef.",
      "Sauté onion rings.",
      "Serve with rice.",
    ],
  },
  {
    id: "db9",
    type: "Dinner",
    name: "Vegetable Curry + Rice",
    calories: 420,
    taken: false,
    protein: 12,
    carbs: 65,
    fats: 14,
    allergens: [],
    ingredients: [
      {
        name: "Mixed vegetables",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Coconut milk",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
      {
        name: "Curry powder",
        hasAllergen: false,
        allergenType: "",
        substitute: null,
      },
    ],
    instructions: [
      "Sauté onion and garlic.",
      "Add curry and coconut milk.",
      "Add vegetables.",
      "Simmer and serve.",
    ],
  },
];

const weeklyMeals: DayPlan[] = [
  {
    day: "Monday",
    date: weekDates[0],
    meals: [
      {
        id: "m1",
        type: "Breakfast",
        name: "Egg White Omelette + Oats",
        calories: 400,
        taken: false,
        protein: 30,
        carbs: 45,
        fats: 8,
        allergens: [],
        ingredients: [
          {
            name: "3 egg whites",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1/2 cup oats",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 tsp olive oil",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Beat egg whites.",
          "Cook in pan with olive oil.",
          "Serve with oats.",
        ],
      },
      {
        id: "m2",
        type: "Lunch",
        name: "Grilled Chicken + Brown Rice",
        calories: 550,
        taken: false,
        protein: 45,
        carbs: 60,
        fats: 10,
        allergens: [],
        ingredients: [
          {
            name: "150g chicken breast",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup brown rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Lemon juice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Season chicken.",
          "Grill 6-7 mins each side.",
          "Serve with brown rice.",
        ],
      },
      {
        id: "m3",
        type: "Dinner",
        name: "Chicken Adobo + Rice",
        calories: 520,
        taken: false,
        protein: 40,
        carbs: 55,
        fats: 14,
        allergens: ["Soy"],
        ingredients: [
          {
            name: "150g chicken",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "3 tbsp soy sauce",
            hasAllergen: true,
            allergenType: "Soy",
            substitute: "coconut aminos",
          },
          {
            name: "2 tbsp vinegar",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Garlic & bay leaf",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Marinate chicken.",
          "Sauté garlic.",
          "Simmer 30 mins.",
          "Serve with rice.",
        ],
        alternativeMeal: {
          id: "m3-alt",
          type: "Dinner",
          name: "Grilled Chicken + Sweet Potato",
          calories: 480,
          taken: false,
          protein: 38,
          carbs: 50,
          fats: 10,
          allergens: [],
          ingredients: [
            {
              name: "150g chicken breast",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "1 medium sweet potato",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
          ],
          instructions: [
            "Season chicken.",
            "Grill chicken.",
            "Bake sweet potato.",
            "Serve together.",
          ],
        },
      },
    ],
  },
  {
    day: "Tuesday",
    date: weekDates[1],
    meals: [
      {
        id: "t1",
        type: "Breakfast",
        name: "Greek Yogurt + Banana + Almonds",
        calories: 380,
        taken: false,
        protein: 20,
        carbs: 50,
        fats: 12,
        allergens: ["Dairy"],
        ingredients: [
          {
            name: "1 cup Greek yogurt",
            hasAllergen: true,
            allergenType: "Dairy",
            substitute: "coconut yogurt",
          },
          {
            name: "1 banana",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "20g almonds",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Pour yogurt in bowl.",
          "Add banana and almonds.",
          "Drizzle honey.",
        ],
      },
      {
        id: "t2",
        type: "Lunch",
        name: "Turkey Breast + Quinoa + Veggies",
        calories: 560,
        taken: false,
        protein: 50,
        carbs: 55,
        fats: 9,
        allergens: [],
        ingredients: [
          {
            name: "150g turkey breast",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup quinoa",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Mixed vegetables",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Grill turkey.",
          "Cook quinoa.",
          "Sauté vegetables.",
          "Combine and serve.",
        ],
      },
      {
        id: "t3",
        type: "Dinner",
        name: "Salmon + Steamed Broccoli",
        calories: 500,
        taken: false,
        protein: 40,
        carbs: 20,
        fats: 22,
        allergens: ["Fish"],
        ingredients: [
          {
            name: "180g salmon fillet",
            hasAllergen: true,
            allergenType: "Fish",
            substitute: null,
          },
          {
            name: "2 cups broccoli",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Lemon & garlic",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Season salmon.",
          "Pan sear 4 mins each side.",
          "Steam broccoli.",
          "Serve together.",
        ],
        alternativeMeal: {
          id: "t3-alt",
          type: "Dinner",
          name: "Chicken Breast + Steamed Broccoli",
          calories: 460,
          taken: false,
          protein: 42,
          carbs: 18,
          fats: 12,
          allergens: [],
          ingredients: [
            {
              name: "180g chicken breast",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "2 cups broccoli",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
          ],
          instructions: [
            "Season chicken.",
            "Grill chicken.",
            "Steam broccoli.",
            "Serve together.",
          ],
        },
      },
    ],
  },
  {
    day: "Wednesday",
    date: weekDates[2],
    meals: [
      {
        id: "w1",
        type: "Breakfast",
        name: "Protein Smoothie + Peanut Butter Toast",
        calories: 420,
        taken: false,
        protein: 35,
        carbs: 48,
        fats: 14,
        allergens: ["Peanuts"],
        ingredients: [
          {
            name: "1 scoop protein powder",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup milk",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 tbsp peanut butter",
            hasAllergen: true,
            allergenType: "Peanuts",
            substitute: "almond butter",
          },
          {
            name: "2 slices whole wheat bread",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Blend protein powder with milk.",
          "Toast bread.",
          "Spread peanut butter.",
          "Serve together.",
        ],
      },
      {
        id: "w2",
        type: "Lunch",
        name: "Chicken Stir Fry + Rice",
        calories: 540,
        taken: false,
        protein: 42,
        carbs: 58,
        fats: 11,
        allergens: ["Soy"],
        ingredients: [
          {
            name: "150g chicken",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Mixed veggies",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 tbsp soy sauce",
            hasAllergen: true,
            allergenType: "Soy",
            substitute: "coconut aminos",
          },
        ],
        instructions: [
          "Cook rice.",
          "Stir fry chicken.",
          "Add veggies and sauce.",
          "Serve over rice.",
        ],
        alternativeMeal: {
          id: "w2-alt",
          type: "Lunch",
          name: "Chicken + Steamed Veggies + Rice",
          calories: 510,
          taken: false,
          protein: 40,
          carbs: 55,
          fats: 9,
          allergens: [],
          ingredients: [
            {
              name: "150g chicken",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "1 cup rice",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "Mixed veggies",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
          ],
          instructions: [
            "Grill chicken.",
            "Steam veggies.",
            "Cook rice.",
            "Serve together.",
          ],
        },
      },
      {
        id: "w3",
        type: "Dinner",
        name: "Beef Tinola + Kangkong + Rice",
        calories: 480,
        taken: false,
        protein: 38,
        carbs: 40,
        fats: 15,
        allergens: [],
        ingredients: [
          {
            name: "150g beef",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Kangkong",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Ginger",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Fish sauce",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Sauté ginger.",
          "Add beef and brown.",
          "Add water and simmer 30 mins.",
          "Add kangkong last.",
        ],
      },
    ],
  },
  {
    day: "Thursday",
    date: weekDates[3],
    meals: [
      {
        id: "th1",
        type: "Breakfast",
        name: "Scrambled Eggs + Whole Wheat Toast",
        calories: 390,
        taken: false,
        protein: 22,
        carbs: 42,
        fats: 14,
        allergens: [],
        ingredients: [
          {
            name: "3 whole eggs",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 slices whole wheat bread",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 tsp butter",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Salt & pepper",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Beat eggs with salt.",
          "Cook on low heat.",
          "Toast bread.",
          "Serve together.",
        ],
      },
      {
        id: "th2",
        type: "Lunch",
        name: "Grilled Bangus + Steamed Rice",
        calories: 520,
        taken: false,
        protein: 38,
        carbs: 55,
        fats: 16,
        allergens: ["Fish"],
        ingredients: [
          {
            name: "1 whole bangus",
            hasAllergen: true,
            allergenType: "Fish",
            substitute: null,
          },
          {
            name: "1 cup steamed rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Calamansi & garlic",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Marinate bangus.",
          "Grill 7 mins each side.",
          "Serve with rice.",
        ],
        alternativeMeal: {
          id: "th2-alt",
          type: "Lunch",
          name: "Grilled Chicken + Steamed Rice",
          calories: 490,
          taken: false,
          protein: 40,
          carbs: 52,
          fats: 12,
          allergens: [],
          ingredients: [
            {
              name: "150g chicken breast",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "1 cup steamed rice",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "Calamansi & garlic",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
          ],
          instructions: [
            "Marinate chicken.",
            "Grill 6-7 mins each side.",
            "Serve with rice.",
          ],
        },
      },
      {
        id: "th3",
        type: "Dinner",
        name: "Chicken Tinola + Vegetables + Rice",
        calories: 460,
        taken: false,
        protein: 35,
        carbs: 45,
        fats: 12,
        allergens: [],
        ingredients: [
          {
            name: "200g chicken",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Green papaya",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Malunggay",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Ginger",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Sauté ginger and onion.",
          "Add chicken.",
          "Add papaya and water.",
          "Add malunggay last.",
        ],
      },
    ],
  },
  {
    day: "Friday",
    date: weekDates[4],
    meals: [
      {
        id: "f1",
        type: "Breakfast",
        name: "Oatmeal + Berries + Honey",
        calories: 350,
        taken: false,
        protein: 10,
        carbs: 65,
        fats: 6,
        allergens: [],
        ingredients: [
          {
            name: "1 cup rolled oats",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1/2 cup mixed berries",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 tbsp honey",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup milk",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Cook oats with milk.",
          "Top with berries.",
          "Drizzle honey.",
          "Serve warm.",
        ],
      },
      {
        id: "f2",
        type: "Lunch",
        name: "Pork Sinigang + Brown Rice",
        calories: 580,
        taken: false,
        protein: 32,
        carbs: 55,
        fats: 20,
        allergens: [],
        ingredients: [
          {
            name: "200g pork ribs",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Kangkong & eggplant",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Sampalok mix",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup brown rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Boil pork until tender.",
          "Add sampalok mix.",
          "Add vegetables.",
          "Serve with brown rice.",
        ],
      },
      {
        id: "f3",
        type: "Dinner",
        name: "Grilled Tilapia + Ensalada",
        calories: 420,
        taken: false,
        protein: 36,
        carbs: 20,
        fats: 14,
        allergens: ["Fish"],
        ingredients: [
          {
            name: "1 whole tilapia",
            hasAllergen: true,
            allergenType: "Fish",
            substitute: null,
          },
          {
            name: "Tomato & onion",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Calamansi dressing",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Grill tilapia.",
          "Slice tomato and onion.",
          "Dress with calamansi.",
          "Serve together.",
        ],
        alternativeMeal: {
          id: "f3-alt",
          type: "Dinner",
          name: "Grilled Chicken + Ensalada",
          calories: 390,
          taken: false,
          protein: 38,
          carbs: 18,
          fats: 12,
          allergens: [],
          ingredients: [
            {
              name: "150g chicken breast",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "Tomato & onion",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "Calamansi dressing",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
          ],
          instructions: [
            "Grill chicken.",
            "Slice tomato and onion.",
            "Dress with calamansi.",
            "Serve together.",
          ],
        },
      },
    ],
  },
  {
    day: "Saturday",
    date: weekDates[5],
    meals: [
      {
        id: "sa1",
        type: "Breakfast",
        name: "Banana Pancakes + Maple Syrup",
        calories: 410,
        taken: false,
        protein: 12,
        carbs: 70,
        fats: 10,
        allergens: [],
        ingredients: [
          {
            name: "2 ripe bananas",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup oats",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 eggs",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 tbsp maple syrup",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Mash bananas.",
          "Mix with oats and eggs.",
          "Cook on pan 2-3 mins each side.",
          "Top with maple syrup.",
        ],
      },
      {
        id: "sa2",
        type: "Lunch",
        name: "Chicken Adobo + Cauliflower Rice",
        calories: 480,
        taken: false,
        protein: 42,
        carbs: 30,
        fats: 16,
        allergens: ["Soy"],
        ingredients: [
          {
            name: "200g chicken",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "3 tbsp soy sauce",
            hasAllergen: true,
            allergenType: "Soy",
            substitute: "coconut aminos",
          },
          {
            name: "2 tbsp vinegar",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 cups cauliflower rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Marinate chicken.",
          "Cook adobo style.",
          "Sauté cauliflower rice.",
          "Serve together.",
        ],
      },
      {
        id: "sa3",
        type: "Dinner",
        name: "Vegetable Curry + Brown Rice",
        calories: 490,
        taken: false,
        protein: 14,
        carbs: 70,
        fats: 16,
        allergens: [],
        ingredients: [
          {
            name: "Mixed vegetables",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Coconut milk",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Curry powder",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup brown rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Sauté onion and garlic.",
          "Add curry powder.",
          "Add vegetables and coconut milk.",
          "Simmer 20 mins and serve with rice.",
        ],
      },
    ],
  },
  {
    day: "Sunday",
    date: weekDates[6],
    meals: [
      {
        id: "su1",
        type: "Breakfast",
        name: "French Toast + Fresh Fruits",
        calories: 400,
        taken: false,
        protein: 14,
        carbs: 65,
        fats: 10,
        allergens: [],
        ingredients: [
          {
            name: "3 slices bread",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "2 eggs",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1/4 cup milk",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Mixed fresh fruits",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Dip bread in egg-milk mixture.",
          "Cook on pan until golden.",
          "Serve with fresh fruits.",
        ],
      },
      {
        id: "su2",
        type: "Lunch",
        name: "Beef Kaldereta + Rice",
        calories: 620,
        taken: false,
        protein: 40,
        carbs: 60,
        fats: 24,
        allergens: [],
        ingredients: [
          {
            name: "200g beef",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Potatoes & carrots",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Tomato sauce",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "1 cup rice",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Brown beef.",
          "Add tomato sauce and water.",
          "Add potatoes and carrots.",
          "Simmer 45 mins and serve with rice.",
        ],
      },
      {
        id: "su3",
        type: "Dinner",
        name: "Steamed Fish + Mixed Vegetables",
        calories: 440,
        taken: false,
        protein: 38,
        carbs: 22,
        fats: 14,
        allergens: ["Fish"],
        ingredients: [
          {
            name: "200g white fish fillet",
            hasAllergen: true,
            allergenType: "Fish",
            substitute: null,
          },
          {
            name: "Mixed vegetables",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
          {
            name: "Ginger & spring onion",
            hasAllergen: false,
            allergenType: "",
            substitute: null,
          },
        ],
        instructions: [
          "Season fish with ginger.",
          "Steam fish 10-12 mins.",
          "Steam vegetables separately.",
          "Serve together.",
        ],
        alternativeMeal: {
          id: "su3-alt",
          type: "Dinner",
          name: "Steamed Tofu + Mixed Vegetables",
          calories: 380,
          taken: false,
          protein: 22,
          carbs: 25,
          fats: 16,
          allergens: [],
          ingredients: [
            {
              name: "200g firm tofu",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "Mixed vegetables",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
            {
              name: "Ginger & spring onion",
              hasAllergen: false,
              allergenType: "",
              substitute: null,
            },
          ],
          instructions: [
            "Season tofu.",
            "Steam tofu 8-10 mins.",
            "Steam vegetables.",
            "Serve together.",
          ],
        },
      },
    ],
  },
];

export default function MealScreen() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState(weeklyMeals);
  const [activeTab, setActiveTab] = useState("Meal");
  const [planMode, setPlanMode] = useState<"Weekly" | "Continuous">("Weekly");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editPlanDay, setEditPlanDay] = useState<number | null>(null);
  const [editPlanSlot, setEditPlanSlot] = useState<string | null>(null);
  const [editPlanSearch, setEditPlanSearch] = useState("");
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [editMealDay, setEditMealDay] = useState<number | null>(null);
  const [editMealIndex, setEditMealIndex] = useState<number | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editMealSearch, setEditMealSearch] = useState("");
  const [editTab, setEditTab] = useState<"ingredients" | "replace">(
    "ingredients",
  );
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualWeight, setManualWeight] = useState("");
  const [manualLogSearch, setManualLogSearch] = useState("");
  const [manualLogTab, setManualLogTab] = useState<"search" | "manual">(
    "search",
  );
  const [userAllergens] = useState(["Fish", "Soy"]);

  const getMealAllergenStatus = (meal: Meal) => {
    const triggered = meal.allergens.filter((a) => userAllergens.includes(a));
    if (triggered.length === 0) return "safe";
    const allergenIngs = meal.ingredients.filter(
      (ing) => ing.hasAllergen && userAllergens.includes(ing.allergenType),
    );
    const allHaveSubs = allergenIngs.every((ing) => ing.substitute !== null);
    return allHaveSubs ? "substitute" : "replace";
  };

  const getDisplayMeal = (meal: Meal): Meal => {
    const status = getMealAllergenStatus(meal);
    if (status === "replace" && meal.alternativeMeal)
      return meal.alternativeMeal;
    if (status === "substitute") {
      return {
        ...meal,
        ingredients: meal.ingredients.map((ing) =>
          ing.hasAllergen &&
          userAllergens.includes(ing.allergenType) &&
          ing.substitute
            ? {
                ...ing,
                name: `${ing.substitute} (swapped)`,
                hasAllergen: false,
              }
            : ing,
        ),
      };
    }
    return meal;
  };

  const toggleMeal = (dayIndex: number, mealIndex: number) => {
    setMealPlan((prev) =>
      prev.map((day, di) =>
        di === dayIndex
          ? {
              ...day,
              meals: day.meals.map((m, mi) =>
                mi === mealIndex ? { ...m, taken: !m.taken } : m,
              ),
            }
          : day,
      ),
    );
  };

  const takeAllMeals = (dayIndex: number) => {
    setMealPlan((prev) =>
      prev.map((day, di) =>
        di === dayIndex
          ? { ...day, meals: day.meals.map((m) => ({ ...m, taken: true })) }
          : day,
      ),
    );
  };

  const getDayTotal = (meals: Meal[]) =>
    meals.reduce((sum, m) => sum + getDisplayMeal(m).calories, 0);

  const openEditPlan = (dayIndex: number) => {
    setEditPlanDay(dayIndex);
    setEditPlanSlot(null);
    setEditPlanSearch("");
    setShowEditPlanModal(true);
  };

  const replaceMealSlot = (newMeal: Meal) => {
    if (editPlanDay === null || editPlanSlot === null) return;
    setMealPlan((prev) =>
      prev.map((day, di) =>
        di === editPlanDay
          ? {
              ...day,
              meals: day.meals.map((m) =>
                m.type === editPlanSlot
                  ? { ...newMeal, type: editPlanSlot, taken: false }
                  : m,
              ),
            }
          : day,
      ),
    );
    setEditPlanSlot(null);
    setEditPlanSearch("");
  };

  const openEditMeal = (dayIndex: number, mealIndex: number) => {
    const meal = mealPlan[dayIndex].meals[mealIndex];
    const status = getMealAllergenStatus(meal);
    const proceed = () => {
      setEditMealDay(dayIndex);
      setEditMealIndex(mealIndex);
      setEditingMeal({ ...getDisplayMeal(meal) });
      setEditMealSearch("");
      setEditTab("ingredients");
      setShowEditMealModal(true);
    };
    if (status !== "safe") {
      Alert.alert(
        "⚠️ Allergen Warning",
        `This meal contains: ${meal.allergens.filter((a) => userAllergens.includes(a)).join(", ")}. Proceed to edit?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed", onPress: proceed },
        ],
      );
    } else {
      proceed();
    }
  };

  const replaceIngredient = (ingIndex: number, newName: string) => {
    setEditingMeal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredients: prev.ingredients.map((ing, i) =>
          i === ingIndex ? { ...ing, name: newName } : ing,
        ),
      };
    });
  };

  const replaceWholeMeal = (newMeal: Meal) => {
    if (editMealDay === null || editMealIndex === null) return;
    setMealPlan((prev) =>
      prev.map((day, di) =>
        di === editMealDay
          ? {
              ...day,
              meals: day.meals.map((m, mi) =>
                mi === editMealIndex
                  ? { ...newMeal, type: m.type, taken: false }
                  : m,
              ),
            }
          : day,
      ),
    );
    setShowEditMealModal(false);
  };

  const saveIngredientEdits = () => {
    if (editMealDay === null || editMealIndex === null || !editingMeal) return;
    setMealPlan((prev) =>
      prev.map((day, di) =>
        di === editMealDay
          ? {
              ...day,
              meals: day.meals.map((m, mi) =>
                mi === editMealIndex ? { ...editingMeal } : m,
              ),
            }
          : day,
      ),
    );
    setShowEditMealModal(false);
  };

  const getFilteredDb = (type?: string, search?: string) =>
    mealDatabase.filter(
      (m) =>
        (type ? m.type === type : true) &&
        m.name.toLowerCase().includes((search || "").toLowerCase()),
    );

  const displayDays = searchText
    ? mealPlan
        .map((day) => ({
          ...day,
          meals: day.meals.filter((m) =>
            getDisplayMeal(m)
              .name.toLowerCase()
              .includes(searchText.toLowerCase()),
          ),
        }))
        .filter((day) => day.meals.length > 0)
    : mealPlan;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Meal Plan</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManualLog(true)}>
            <Text style={styles.headerIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.headerIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plan Mode Toggle */}
      <View style={styles.modeRow}>
        {(["Weekly", "Continuous"] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeBtn, planMode === mode && styles.modeBtnActive]}
            onPress={() => setPlanMode(mode)}
          >
            <Text
              style={[
                styles.modeBtnText,
                planMode === mode && styles.modeBtnTextActive,
              ]}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals..."
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          {searchText !== "" && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Allergen Notice */}
      {userAllergens.length > 0 && (
        <View style={styles.allergenNotice}>
          <Text style={styles.allergenText}>
            ⚠️ Allergen filter: {userAllergens.join(", ")} — meals adjusted
            automatically
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {displayDays.map((day, dayIndex) => (
          <View key={day.day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayTitle}>{day.day}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
              <View style={styles.dayActions}>
                <TouchableOpacity
                  style={styles.takeAllBtn}
                  onPress={() => takeAllMeals(dayIndex)}
                >
                  <Text style={styles.takeAllText}>Take all</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditPlan(dayIndex)}
                >
                  <Text style={styles.editText}>Edit Plan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {day.meals.map((meal, mealIndex) => {
              const status = getMealAllergenStatus(meal);
              const displayMeal = getDisplayMeal(meal);
              const isReplaced = status === "replace";
              const isSubstituted = status === "substitute";

              return (
                <TouchableOpacity
                  key={meal.id}
                  style={[
                    styles.mealRow,
                    isReplaced && styles.mealRowReplaced,
                    isSubstituted && styles.mealRowSubstituted,
                  ]}
                  onPress={() => {
                    setSelectedMeal(displayMeal);
                    setShowMealModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>
                      {meal.type === "Breakfast"
                        ? "🌅"
                        : meal.type === "Lunch"
                          ? "☀️"
                          : "🌙"}
                    </Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <View style={styles.mealNameRow}>
                      <Text style={styles.mealType}>{displayMeal.type}</Text>
                      {isReplaced && (
                        <View style={styles.replacedBadge}>
                          <Text style={styles.badgeText}>AI Replaced</Text>
                        </View>
                      )}
                      {isSubstituted && (
                        <View style={styles.substitutedBadge}>
                          <Text style={styles.badgeText}>Swapped</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.mealName}>{displayMeal.name}</Text>
                    {isReplaced && (
                      <Text style={styles.originalMealText}>
                        Original: {meal.name}
                      </Text>
                    )}
                    <View style={styles.macroRow}>
                      <Text style={styles.macroText}>
                        P: {displayMeal.protein}g
                      </Text>
                      <Text style={styles.macroText}>
                        C: {displayMeal.carbs}g
                      </Text>
                      <Text style={styles.macroText}>
                        F: {displayMeal.fats}g
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealRight}>
                    <Text style={styles.mealCalories}>
                      ~{displayMeal.calories} kcal
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        meal.taken ? styles.skipBtn : styles.takeBtn,
                      ]}
                      onPress={() => toggleMeal(dayIndex, mealIndex)}
                    >
                      <Text style={styles.actionBtnText}>
                        {meal.taken ? "Skip" : "Take"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pencilBtn}
                      onPress={() => openEditMeal(dayIndex, mealIndex)}
                    >
                      <Text style={styles.pencilIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.fireIcon}>🔥</Text>
              <Text style={styles.totalText}>
                Total kcal | {getDayTotal(day.meals).toLocaleString()} kcal
              </Text>
            </View>
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* MEAL DETAIL MODAL */}
      <Modal visible={showMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMeal && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                    <TouchableOpacity onPress={() => setShowMealModal(false)}>
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSection}>Nutritional Info</Text>
                  <View style={styles.nutritionGrid}>
                    {[
                      { label: "Calories", value: `${selectedMeal.calories}` },
                      { label: "Protein", value: `${selectedMeal.protein}g` },
                      { label: "Carbs", value: `${selectedMeal.carbs}g` },
                      { label: "Fats", value: `${selectedMeal.fats}g` },
                    ].map((n) => (
                      <View key={n.label} style={styles.nutritionBox}>
                        <Text style={styles.nutritionValue}>{n.value}</Text>
                        <Text style={styles.nutritionLabel}>{n.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.modalSection}>Ingredients</Text>
                  {selectedMeal.ingredients.map((ing, i) => (
                    <View key={i} style={styles.ingredientRow}>
                      <View style={styles.ingredientBullet} />
                      <Text style={styles.ingredientText}>{ing.name}</Text>
                    </View>
                  ))}
                  <Text style={styles.modalSection}>Cooking Instructions</Text>
                  {selectedMeal.instructions.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowMealModal(false)}
                  >
                    <Text style={styles.modalCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT PLAN MODAL */}
      <Modal visible={showEditPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editPlanSlot
                  ? `Choose ${editPlanSlot}`
                  : `Edit ${editPlanDay !== null ? mealPlan[editPlanDay]?.day : ""} Plan`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (editPlanSlot) {
                    setEditPlanSlot(null);
                    setEditPlanSearch("");
                  } else setShowEditPlanModal(false);
                }}
              >
                <Text style={styles.modalClose}>
                  {editPlanSlot ? "← Back" : "✕"}
                </Text>
              </TouchableOpacity>
            </View>
            {!editPlanSlot ? (
              <ScrollView>
                <Text style={styles.editPlanSubtitle}>
                  Select a meal slot to replace:
                </Text>
                {editPlanDay !== null &&
                  mealPlan[editPlanDay]?.meals.map((meal) => {
                    const displayMeal = getDisplayMeal(meal);
                    return (
                      <TouchableOpacity
                        key={meal.id}
                        style={styles.slotCard}
                        onPress={() => setEditPlanSlot(meal.type)}
                      >
                        <Text style={styles.slotEmoji}>
                          {meal.type === "Breakfast"
                            ? "🌅"
                            : meal.type === "Lunch"
                              ? "☀️"
                              : "🌙"}
                        </Text>
                        <View style={styles.slotInfo}>
                          <Text style={styles.slotType}>{meal.type}</Text>
                          <Text style={styles.slotName}>
                            {displayMeal.name}
                          </Text>
                          <Text style={styles.slotCal}>
                            {displayMeal.calories} kcal
                          </Text>
                        </View>
                        <Text style={styles.slotArrow}>›</Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            ) : (
              <>
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${editPlanSlot} meals...`}
                    value={editPlanSearch}
                    onChangeText={setEditPlanSearch}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={getFilteredDb(editPlanSlot, editPlanSearch)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dbMealCard}
                      onPress={() => replaceMealSlot(item)}
                    >
                      <View style={styles.dbMealInfo}>
                        <Text style={styles.dbMealName}>{item.name}</Text>
                        <View style={styles.macroRow}>
                          <Text style={styles.macroText}>
                            P: {item.protein}g
                          </Text>
                          <Text style={styles.macroText}>C: {item.carbs}g</Text>
                          <Text style={styles.macroText}>F: {item.fats}g</Text>
                        </View>
                        {item.allergens.length > 0 && (
                          <Text style={styles.dbMealAllergen}>
                            ⚠️ {item.allergens.join(", ")}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.dbMealCal}>{item.calories} kcal</Text>
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 400 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* EDIT MEAL MODAL */}
      <Modal visible={showEditMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Meal</Text>
              <TouchableOpacity onPress={() => setShowEditMealModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.editTabRow}>
              {(["ingredients", "replace"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.editTabBtn,
                    editTab === tab && styles.editTabActive,
                  ]}
                  onPress={() => setEditTab(tab)}
                >
                  <Text
                    style={[
                      styles.editTabText,
                      editTab === tab && styles.editTabTextActive,
                    ]}
                  >
                    {tab === "ingredients"
                      ? "🥄 Edit Ingredients"
                      : "🔄 Replace Meal"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {editTab === "ingredients" ? (
              <ScrollView>
                <Text style={styles.editSectionLabel}>
                  Tap Swap to replace an ingredient:
                </Text>
                {editingMeal?.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientEditRow}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>{ing.name}</Text>
                    <TouchableOpacity
                      style={styles.swapBtn}
                      onPress={() => {
                        Alert.alert(
                          "Swap Ingredient",
                          `Replace "${ing.name}" with what?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Coconut aminos",
                              onPress: () =>
                                replaceIngredient(i, "coconut aminos"),
                            },
                            {
                              text: "Almond butter",
                              onPress: () =>
                                replaceIngredient(i, "almond butter"),
                            },
                            {
                              text: "Olive oil",
                              onPress: () => replaceIngredient(i, "olive oil"),
                            },
                          ],
                        );
                      }}
                    >
                      <Text style={styles.swapBtnText}>Swap</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={saveIngredientEdits}
                >
                  <Text style={styles.modalCloseBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <>
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search replacement meal..."
                    value={editMealSearch}
                    onChangeText={setEditMealSearch}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={getFilteredDb(undefined, editMealSearch)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dbMealCard}
                      onPress={() => replaceWholeMeal(item)}
                    >
                      <View style={styles.dbMealInfo}>
                        <Text style={styles.dbMealName}>{item.name}</Text>
                        <View style={styles.macroRow}>
                          <Text style={styles.macroText}>
                            P: {item.protein}g
                          </Text>
                          <Text style={styles.macroText}>C: {item.carbs}g</Text>
                          <Text style={styles.macroText}>F: {item.fats}g</Text>
                        </View>
                        {item.allergens.length > 0 && (
                          <Text style={styles.dbMealAllergen}>
                            ⚠️ {item.allergens.join(", ")}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.dbMealCal}>{item.calories} kcal</Text>
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 350 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MANUAL LOG MODAL */}
      <Modal visible={showManualLog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Food Intake</Text>
              <TouchableOpacity onPress={() => setShowManualLog(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.editTabRow}>
              {(["search", "manual"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.editTabBtn,
                    manualLogTab === tab && styles.editTabActive,
                  ]}
                  onPress={() => setManualLogTab(tab)}
                >
                  <Text
                    style={[
                      styles.editTabText,
                      manualLogTab === tab && styles.editTabTextActive,
                    ]}
                  >
                    {tab === "search" ? "🔍 Search Meal" : "⚖️ Manual Input"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {manualLogTab === "search" ? (
              <>
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search meal to log..."
                    value={manualLogSearch}
                    onChangeText={setManualLogSearch}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={getFilteredDb(undefined, manualLogSearch)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dbMealCard}
                      onPress={() => {
                        Alert.alert(
                          "Logged!",
                          `${item.name} (${item.calories} kcal) added to your log.`,
                        );
                        setShowManualLog(false);
                        setManualLogSearch("");
                      }}
                    >
                      <View style={styles.dbMealInfo}>
                        <Text style={styles.dbMealName}>{item.name}</Text>
                        <View style={styles.macroRow}>
                          <Text style={styles.macroText}>
                            P: {item.protein}g
                          </Text>
                          <Text style={styles.macroText}>C: {item.carbs}g</Text>
                          <Text style={styles.macroText}>F: {item.fats}g</Text>
                        </View>
                      </View>
                      <Text style={styles.dbMealCal}>{item.calories} kcal</Text>
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 350 }}
                />
              </>
            ) : (
              <ScrollView>
                <Text style={styles.editSectionLabel}>Food Name</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. Adobo, Rice, Banana..."
                  value={manualFoodName}
                  onChangeText={setManualFoodName}
                />
                <Text style={styles.editSectionLabel}>
                  Weight in grams (optional)
                </Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. 150g"
                  value={manualWeight}
                  onChangeText={setManualWeight}
                  keyboardType="numeric"
                />
                <Text style={styles.editSectionLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. 350"
                  value={manualKcal}
                  onChangeText={setManualKcal}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => {
                    if (!manualFoodName || !manualKcal) {
                      Alert.alert(
                        "Error",
                        "Please enter food name and calories.",
                      );
                      return;
                    }
                    Alert.alert(
                      "Logged!",
                      `${manualFoodName} — ${manualKcal} kcal${manualWeight ? ` (${manualWeight}g)` : ""} added to your log.`,
                    );
                    setManualFoodName("");
                    setManualKcal("");
                    setManualWeight("");
                    setShowManualLog(false);
                  }}
                >
                  <Text style={styles.modalCloseBtnText}>Log Food</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { name: "Home", icon: "🏠", route: "/dashboard" },
          { name: "Stats", icon: "📊", route: "/progress" },
          { name: "Meal", icon: "🍽️", route: "/meal" },
          { name: "Exercise", icon: "💪", route: "/workout" },
          { name: "Profile", icon: "👤", route: "/profile" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => {
              setActiveTab(tab.name);
              router.push(tab.route as any);
            }}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === tab.name && styles.navLabelActive,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111" },
  headerActions: { flexDirection: "row", gap: 12 },
  headerIcon: { fontSize: 20 },
  modeRow: {
    flexDirection: "row",
    margin: 16,
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: "#4CAF50" },
  modeBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  modeBtnTextActive: { color: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  clearSearch: { fontSize: 16, color: "#999", padding: 4 },
  allergenNotice: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
  },
  allergenText: { fontSize: 12, color: "#E65100" },
  daySection: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  dayDate: { fontSize: 11, color: "#888", marginTop: 2 },
  dayActions: { flexDirection: "row", gap: 8 },
  takeAllBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  takeAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  editBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  mealRowReplaced: { borderColor: "#4CAF50", backgroundColor: "#F1F8E9" },
  mealRowSubstituted: { borderColor: "#FF9800", backgroundColor: "#FFF8E1" },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  mealEmoji: { fontSize: 18 },
  mealInfo: { flex: 1 },
  mealNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  mealType: { fontSize: 13, fontWeight: "700", color: "#111" },
  replacedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  substitutedBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  mealName: { fontSize: 11, color: "#555", marginTop: 2 },
  originalMealText: { fontSize: 10, color: "#999", fontStyle: "italic" },
  macroRow: { flexDirection: "row", gap: 6, marginTop: 3 },
  macroText: { fontSize: 10, color: "#4CAF50", fontWeight: "600" },
  mealRight: { alignItems: "flex-end", gap: 4 },
  mealCalories: { fontSize: 12, color: "#555" },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  takeBtn: { backgroundColor: "#4CAF50" },
  skipBtn: { backgroundColor: "#FF9800" },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pencilBtn: { padding: 4 },
  pencilIcon: { fontSize: 16 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  fireIcon: { fontSize: 16 },
  totalText: { fontSize: 13, fontWeight: "600", color: "#333" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111", flex: 1 },
  modalClose: { fontSize: 16, color: "#999", padding: 4 },
  modalSection: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginTop: 16,
    marginBottom: 10,
  },
  nutritionGrid: { flexDirection: "row", gap: 8 },
  nutritionBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  nutritionValue: { fontSize: 18, fontWeight: "bold", color: "#4CAF50" },
  nutritionLabel: { fontSize: 11, color: "#888", marginTop: 4 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  ingredientText: { fontSize: 13, color: "#444", flex: 1 },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  stepText: { fontSize: 13, color: "#444", flex: 1, lineHeight: 20 },
  modalCloseBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  modalCloseBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  editPlanSubtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  slotEmoji: { fontSize: 24 },
  slotInfo: { flex: 1 },
  slotType: { fontSize: 13, fontWeight: "700", color: "#111" },
  slotName: { fontSize: 12, color: "#888" },
  slotCal: { fontSize: 11, color: "#4CAF50", marginTop: 2 },
  slotArrow: { fontSize: 22, color: "#ccc" },
  dbMealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  dbMealInfo: { flex: 1 },
  dbMealName: { fontSize: 14, fontWeight: "600", color: "#111" },
  dbMealAllergen: { fontSize: 11, color: "#E65100", marginTop: 2 },
  dbMealCal: { fontSize: 13, fontWeight: "700", color: "#4CAF50" },
  editTabRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  editTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  editTabActive: { backgroundColor: "#4CAF50" },
  editTabText: { fontSize: 12, fontWeight: "600", color: "#888" },
  editTabTextActive: { color: "#fff" },
  editSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
    marginTop: 8,
  },
  ingredientEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  swapBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swapBtnText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  manualInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { flex: 1, alignItems: "center" },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, color: "#aaa", marginTop: 2 },
  navLabelActive: { color: "#4CAF50", fontWeight: "700" },
});
