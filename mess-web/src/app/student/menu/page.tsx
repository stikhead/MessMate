"use client";

import { useState } from "react";
import useSWR from "swr";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import { Coffee, Sun, Moon, UtensilsCrossed, AlertCircle, Leaf, CalendarDays, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { days, SHORT_DAYS } from "@/constants";
import { MenuItem } from "@/types/common";

const fetcher = (url: string) =>
  API.get(url).then((res) => {
    const data = Array.isArray(res.data.data)
      ? res.data.data
      : [res.data.data];
    return data.filter((i: unknown) => i !== null);
  });

export default function WeeklyMenuPage() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());
  const { user, loading: userLoading } = useUser();

  const dayName = selectedDayIndex + 1;

  const { data: menu, error, isLoading } = useSWR<MenuItem[]>(
    `/menu/getMenu?day=${dayName}`,
    fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 6000000,
    keepPreviousData: true,
  });

  const getMealInfo = (type: number) => {
    switch (type) {
      case 1:
        return {
          name: "Breakfast",
          time: "8:00 AM - 10:00 AM",
          icon: <Coffee className="h-6 w-6 text-orange-600" />,
          borderColor: "border-l-orange-400 group-hover:border-l-orange-500",
          bg: "bg-orange-50",
          iconBg: "bg-orange-100",
          pillBg: "bg-orange-50 group-hover/card:bg-white",
          pillText: "text-orange-700",
          pillBorder: "border-orange-200",
        };
      case 2:
        return {
          name: "Lunch",
          time: "1:00 PM - 3:00 PM",
          icon: <Sun className="h-6 w-6 text-blue-600" />,
          borderColor: "border-l-blue-400 group-hover:border-l-blue-500",
          bg: "bg-blue-50",
          iconBg: "bg-blue-100",
          pillBg: "bg-blue-50 group-hover/card:bg-white",
          pillText: "text-blue-700",
          pillBorder: "border-blue-200",
        };
      case 3:
        return {
          name: "Dinner",
          time: "7:00 PM - 9:00 PM",
          icon: <Moon className="h-6 w-6 text-indigo-600" />,
          borderColor: "border-l-indigo-400 group-hover:border-l-indigo-500",
          bg: "bg-indigo-50",
          iconBg: "bg-indigo-100",
          pillBg: "bg-indigo-50 group-hover/card:bg-white",
          pillText: "text-indigo-700",
          pillBorder: "border-indigo-200",
        };
      default:
        return {
          name: "Meal",
          time: "",
          icon: <UtensilsCrossed className="h-6 w-6 text-gray-600" />,
          borderColor: "border-l-gray-400",
          bg: "bg-gray-50",
          iconBg: "bg-gray-100",
          pillBg: "bg-gray-50",
          pillText: "text-gray-700",
          pillBorder: "border-gray-200",
        };
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium">Loading Menu...</p>
          </div>
        </div>
      </div>
    );
  }

  const isToday = (selectedDayIndex === new Date().getDay());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-6 sm:py-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="mb-8 bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 flex items-center gap-3">
              <CalendarDays className="h-7 w-7 text-blue-600" />
              Weekly Menu
            </h1>
            <p className="text-sm font-medium text-gray-500">Hostel A - Boys</p>
          </div>
          {isToday && (
            <span className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-widest rounded-full border border-blue-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Today
            </span>
          )}
        </div>

        <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide snap-x">
            {SHORT_DAYS.map((day, index) => {
              const isSelected = index === selectedDayIndex;
              const isDayToday = index === new Date().getDay();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`relative shrink-0 snap-center min-w-18 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all duration-300 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-1 scale-105"
                      : "bg-white text-gray-500 hover:text-gray-900 hover:bg-blue-50/50 border border-gray-100 hover:border-blue-100"
                  }`}
                >
                  {day}
                  {isDayToday && !isSelected && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {days[selectedDayIndex]}
          </h2>
          {isToday && (
            <span className="sm:hidden flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-blue-200 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Today
            </span>
          )}
        </div>

        <div className="space-y-5">
          {isLoading && !menu ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-3xl bg-white border border-gray-100 animate-pulse flex items-center p-6"
              >
                <div className="h-14 w-14 bg-gray-200 rounded-2xl shrink-0" />
                <div className="ml-4 flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 bg-gray-100 rounded-xl w-20" />
                    <div className="h-8 bg-gray-100 rounded-xl w-24" />
                    <div className="h-8 bg-gray-100 rounded-xl w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-3xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-lg mb-1">Failed to load menu</h4>
                <p className="text-sm font-medium text-red-600/80">
                  Please check your connection and try again later.
                </p>
              </div>
            </div>
          ) : menu && menu.length > 0 ? (
            [1, 2, 3].map((mealType) => {
              const meal = menu.find((m: MenuItem) => m.mealType === mealType);
              const info = getMealInfo(mealType);

              if (!meal) return null;

              return (
                <div
                  key={mealType}
                  className={`group/card relative overflow-hidden rounded-[2rem] bg-white shadow-sm border-l-[6px] ${info.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-gray-50/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="p-6 sm:p-8 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md ${info.iconBg}`}
                      >
                        {info.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-1 transition-colors group-hover/card:text-blue-900">
                              {info.name}
                            </h3>
                            <p className="text-xs font-bold text-gray-400">
                              {info.time}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xl font-black ${info.pillText}`}>
                              ₹{meal.price || 0}
                            </p>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">
                              Cost
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {meal.items.split(",").map((item: string, idx: number) => {
                            const cleanItem = item.trim();
                            if (!cleanItem) return null;
                            return (
                              <span
                                key={idx}
                                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all duration-300 group-hover/card:shadow-sm hover:scale-105 cursor-default ${info.pillBg} ${info.pillText} ${info.pillBorder}`}
                              >
                                {cleanItem}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-50 mb-5">
                <UtensilsCrossed className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Menu Not Available
              </h3>
              <p className="text-gray-500 font-medium text-sm">
                The menu for {days[selectedDayIndex]} hasn&apos;t been uploaded yet.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[2rem] bg-linear-to-br from-green-50 to-emerald-50 p-6 sm:p-8 border border-green-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 shadow-inner border border-green-200/50">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-green-900 text-base mb-1.5">
                Dietary & Hygiene Information
              </h4>
              <p className="text-green-800/80 text-sm font-medium leading-relaxed">
                All meals are prepared daily with fresh ingredients. We strictly adhere to FSSAI guidelines to maintain the highest standards of food safety, hygiene, and nutritional quality.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}