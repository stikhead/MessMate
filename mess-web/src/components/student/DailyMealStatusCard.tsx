"use client";

import { Coffee, Sun, Moon, Utensils, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { MealToken } from "@/types/common";

interface DailyMealStatusCardProps {
  tokens: MealToken[] | [];
}

export default function DailyMealStatusCard({ tokens }: DailyMealStatusCardProps) {
  const now = new Date();
  const hour = now.getHours();
  const isPastDinner = hour >= 22;
  const targetDate = new Date();
  if (isPastDinner) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const targetDateStr = targetDate.toLocaleDateString('en-CA');

  const getStatus = (mealType: number) => {
    const safeTokens = Array.isArray(tokens) ? tokens : [];

    const token = safeTokens.find(t => {
      const tDate = new Date(t.date).toLocaleDateString('en-CA');
      return tDate === targetDateStr && t.mealType === mealType;
    });

    return token ? token.status : "NONE";
  };

  const meals = [
    { type: 1, name: "Breakfast", icon: <Coffee className="h-4 w-4" />, hoverColor: "text-orange-500" },
    { type: 2, name: "Lunch", icon: <Sun className="h-4 w-4" />, hoverColor: "text-blue-500" },
    { type: 3, name: "Dinner", icon: <Moon className="h-4 w-4" />, hoverColor: "text-indigo-500" },
  ];

  return (
    <div className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100 cursor-default">

      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-sm">
          <Utensils className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
            {isPastDinner ? "Tomorrow's Schedule" : "Today's Schedule"}
          </p>
          <h3 className="text-lg font-extrabold text-gray-900 transition-colors duration-300 group-hover:text-indigo-900">
            Booking Status
          </h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-3">
        {meals.map((meal) => {
          const status = getStatus(meal.type);

          let statusColor = "bg-gray-100 text-gray-500";
          let statusText = "Not Booked";
          let StatusIcon = MinusCircle;
          if (status === "BOOKED") {
            statusColor = "bg-green-100 text-green-700 ring-1 ring-green-200";
            statusText = "Booked";
            StatusIcon = CheckCircle2;
          } else if (status === "REDEEMED") {
            statusColor = "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
            statusText = "Ate";
            StatusIcon = CheckCircle2;
          } else if (status === "CANCELLED") {
            statusColor = "bg-red-100 text-red-600 ring-1 ring-red-200";
            statusText = "Cancelled";
            StatusIcon = XCircle;
          } else if (status === "EXPIRED") {
            statusColor = "bg-gray-200 text-gray-600 ring-1 ring-gray-300";
            statusText = "Missed";
            StatusIcon = XCircle;
          }

          return (
            <div
              key={meal.type}
              className="group/row flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-gray-200 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center gap-3 text-gray-700 font-bold text-sm transition-colors duration-300 group-hover/row:text-gray-900">
                <div className={`text-gray-400 transition-all duration-300 group-hover/row:scale-110 group-hover/row:${meal.hoverColor}`}>
                  {meal.icon}
                </div>
                {meal.name}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold transition-all duration-300 group-hover/row:shadow-sm ${statusColor}`}>
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