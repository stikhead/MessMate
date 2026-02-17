"use client";

import { useState } from "react";
import useSWR from "swr";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import { Coffee, Sun, Moon, UtensilsCrossed, AlertCircle, Leaf } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface MenuItem {
  mealType: number;
  items: string;
}



const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fetcher = (url: string) =>
  API.get(url).then((res) => {

    const data = Array.isArray(res.data.data)
      ? res.data.data
      : [res.data.data];
    return data.filter((i: unknown) => i !== null);

  });

export default function WeeklyMenuPage() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());
  const { user, loading: userLoading } = useUser()

  const dayName = selectedDayIndex;

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
          borderColor: "border-l-orange-400",
          bg: "bg-orange-50",
          iconBg: "bg-orange-100",
          bullet: "text-orange-600",
        };
      case 2:
        return {
          name: "Lunch",
          time: "1:00 PM - 3:00 PM",
          icon: <Sun className="h-6 w-6 text-blue-600" />,
          borderColor: "border-l-blue-400",
          bg: "bg-blue-50",
          iconBg: "bg-blue-100",
          bullet: "text-blue-600",
        };
      case 3:
        return {
          name: "Dinner",
          time: "7:00 PM - 9:00 PM",
          icon: <Moon className="h-6 w-6 text-indigo-600" />,
          borderColor: "border-l-indigo-400",
          bg: "bg-indigo-50",
          iconBg: "bg-indigo-100",
          bullet: "text-indigo-600",
        };
      default:
        return {
          name: "Meal",
          time: "",
          icon: <UtensilsCrossed className="h-6 w-6 text-gray-600" />,
          borderColor: "border-l-gray-400",
          bg: "bg-gray-50",
          iconBg: "bg-gray-100",
          bullet: "text-gray-600",
        };
    }
  };


  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading Wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  const isToday = selectedDayIndex === new Date().getDay();
  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-24">

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Weekly Menu
          </h1>
          <p className="text-sm sm:text-base text-gray-500">Hostel A - Boys</p>
        </div>

        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {SHORT_DAYS.map((day, index) => {
              const isSelected = index === selectedDayIndex;
              const isDayToday = index === new Date().getDay();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`relative shrink-0 min-w-17 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {day}
                  {isDayToday && !isSelected && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {DAYS[selectedDayIndex]}
          </h2>
          {isToday && (
            <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
              Today
            </span>
          )}
        </div>

        <div className="space-y-4 sm:space-y-5">
          {isLoading && !menu ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-white border border-gray-200 animate-pulse"
              >
                <div className="p-6 flex items-start gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-32" />
                    <div className="h-4 bg-gray-100 rounded w-48" />
                    <div className="space-y-2 mt-4">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-5 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Failed to load menu</h4>
                <p className="text-sm text-red-600">
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
                  className={`relative overflow-hidden rounded-2xl bg-white shadow-sm border-l-4 ${info.borderColor} hover:shadow-md transition-all duration-200`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl ${info.iconBg}`}
                      >
                        {info.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                            {info.name}
                          </h3>
                          <p className="text-sm text-gray-500 font-medium">
                            {info.time}
                          </p>
                        </div>


                        <ul className="space-y-2">
                          {meal.items
                            .split(",")
                            .map((item: string, idx: number) => {
                              const cleanItem = item.trim();
                              if (!cleanItem) return null;
                              return (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2.5 text-gray-700"
                                >
                                  <span
                                    className={`mt-1.5 text-lg leading-none ${info.bullet}`}
                                  >
                                    •
                                  </span>
                                  <span className="text-sm sm:text-base">
                                    {cleanItem}
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (

            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <UtensilsCrossed className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No Menu Available
              </h3>
              <p className="text-gray-500 text-sm">
                Menu for {DAYS[selectedDayIndex]} hasnt been uploaded yet.
              </p>
            </div>
          )}
        </div>



        <div className="mt-8 rounded-2xl bg-linear-to-br from-green-50 to-emerald-50 p-5 border border-green-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Leaf className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-green-900 text-sm sm:text-base mb-1">
                Dietary Information
              </h4>
              <p className="text-green-800 text-sm leading-relaxed">
                All meals are 100% vegetarian and prepared with fresh
                ingredients daily. We maintain the highest standards of hygiene
                and quality.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}