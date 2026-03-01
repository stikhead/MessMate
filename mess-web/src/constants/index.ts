import { Coffee, Moon, Sun } from "lucide-react";

export const days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
export const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MEALS = ["Breakfast", "Lunch", "Dinner"];
export const PLAN_COST = 500;
export const PLAN_MEALS = 45;
export const MEAL_SCHEDULE = [
  { type: 1, start: 8, end: 9, status: "SERVING" },
  { type: 1, start: 0, end: 8, status: "UPCOMING" },
  { type: 2, start: 13, end: 14, status: "SERVING" },
  { type: 2, start: 9, end: 13, status: "UPCOMING" },
  { type: 3, start: 20, end: 21, status: "SERVING" },
  { type: 3, start: 14, end: 20, status: "UPCOMING" },
] as const;


export const QUICK_AMOUNTS = [50, 100, 200, 500];
export const MAX_AMOUNT = 500;

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });


export const dayMap: Record<string, number> = {
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6,
  "Sunday": 7
};

export const mealMap: Record<string, number> = {
  "Breakfast": 1,
  "Lunch": 2,
  "Dinner": 3
};

export const MEAL_TYPES = [
  { value: 1, label: "Breakfast", icon: Coffee, color: "text-orange-600" },
  { value: 2, label: "Lunch", icon: Sun, color: "text-blue-600" },
  { value: 3, label: "Dinner", icon: Moon, color: "text-indigo-600" },
];

export const getDayName = (num: number) => days[num - 1] || "Unknown";
export const getMealName = (num: number) => MEALS[num - 1] || "Unknown";
