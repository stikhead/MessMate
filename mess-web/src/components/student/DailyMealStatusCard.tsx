import { Coffee, Sun, Moon, Utensils, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { MealToken } from "@/types/common";

interface DailyMealStatusCardProps {
  tokens: MealToken[] | [];
}

export default function DailyMealStatusCard({ tokens }: DailyMealStatusCardProps) {
  // 1. Time Logic: Check if it's past 10:00 PM (22:00)
  const now = new Date();
  const hour = now.getHours();
  const isPastDinner = hour >= 22;

  // 2. Date Target Logic: Today vs Tomorrow
  const targetDate = new Date();
  if (isPastDinner) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  // Format to YYYY-MM-DD for safe comparison
  const targetDateStr = targetDate.toLocaleDateString('en-CA');

  // 3. Helper to find status for a specific meal type on the target date
  const getStatus = (mealType: number) => {
    const token = tokens?.find(t => {
      const tDate = new Date(t.date).toLocaleDateString('en-CA');
      return tDate === targetDateStr && t.mealType === mealType;
    });
    return token ? token.status : "NONE";
  };

  const meals = [
    { type: 1, name: "Breakfast", icon: <Coffee className="h-4 w-4" /> },
    { type: 2, name: "Lunch", icon: <Sun className="h-4 w-4" /> },
    { type: 3, name: "Dinner", icon: <Moon className="h-4 w-4" /> },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <Utensils className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isPastDinner ? "Tomorrow's Schedule" : "Today's Schedule"}
          </p>
          <h3 className="text-lg font-bold text-gray-900">
            Booking Status
          </h3>
        </div>
      </div>

      {/* Meal Rows */}
      <div className="flex-1 flex flex-col justify-center space-y-2.5">
        {meals.map((meal) => {
          const status = getStatus(meal.type);

          // Default styling for "NONE"
          let statusColor = "bg-gray-100 text-gray-500";
          let statusText = "Not Booked";
          let StatusIcon = MinusCircle;

          // Apply dynamic styling based on token status
          if (status === "BOOKED") {
            statusColor = "bg-green-100 text-green-700";
            statusText = "Booked";
            StatusIcon = CheckCircle2;
          } else if (status === "REDEEMED") {
            statusColor = "bg-blue-100 text-blue-700";
            statusText = "Ate";
            StatusIcon = CheckCircle2;
          } else if (status === "CANCELLED") {
            statusColor = "bg-red-100 text-red-600";
            statusText = "Cancelled";
            StatusIcon = XCircle;
          }

          return (
            <div key={meal.type} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 text-gray-700 font-semibold text-sm">
                <div className="text-gray-400">{meal.icon}</div>
                {meal.name}
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold ${statusColor}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}