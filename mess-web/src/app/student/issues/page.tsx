"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import Toast from "@/components/student/Toast";
import { Droplets, Utensils, Scale, Clock, CheckCircle2, Loader2, Calendar as CalendarIcon, Coffee, MessageSquare, AlertCircle, PlusCircle, History, ChevronLeft, ChevronRight, Sun, Moon, Lock } from "lucide-react";
import { AxiosError } from "axios";
import { useUser } from "@/hooks/useUser";
import { dayMap, getMealName, mealMap, MEALS } from "@/constants";
import { CategoryCardProps, Complaint, MealToken, ToastState } from "@/types/common";
import { Badge } from "@/components/ui/badge";



function CategoryCard({ label, icon, selected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all h-24 sm:h-28 ${
        selected
          ? "bg-white border-blue-500 shadow-md scale-[1.02]"
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`mb-2 transition-colors ${selected ? "text-blue-600" : "text-gray-400"}`}>
        <div className="h-6 w-6">{icon}</div>
      </div>
      <span className={`text-xs sm:text-sm font-semibold ${selected ? "text-blue-700" : "text-gray-600"}`}>
        {label}
      </span>
    </button>
  );
}

const fetcher = (url: string) =>
  API.get(url).then((res) => {
    const data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
    return data.filter((i: unknown) => i !== null);
  });

export default function ComplaintPage() {
  const { user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // Form States
  const [selectedCategory, setSelectedCategory] = useState<string>("HYGIENE");
  const [selectedMeal, setSelectedMeal] = useState<string>("Lunch");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Token & Calendar State
  const [tokenMap, setTokenMap] = useState<Record<string, Record<number, string>>>({});
  const [fetchingTokens, setFetchingTokens] = useState(true);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayDateOnly = new Date(currentYear, currentMonth, today.getDate());

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    todayDateOnly.toLocaleDateString("en-CA")
  );

  const [viewDate, setViewDate] = useState(new Date(currentYear, currentMonth, 1));
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isCurrentMonth = viewMonth === currentMonth && viewYear === currentYear;
  const handlePrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const fetchMyTokens = useCallback(async () => {
    setFetchingTokens(true);
    try {
      const res = await API.get("/meal/get-token");
      const tokens = res.data.data;
      const newMap: Record<string, Record<number, string>> = {};

      tokens.forEach((token: MealToken) => {
        const dateStr = new Date(token.date).toLocaleDateString("en-CA");
        if (!newMap[dateStr]) newMap[dateStr] = {};
        newMap[dateStr][token.mealType] = token.status;
      });

      setTokenMap(newMap);
    } catch (error) {
      console.error("Failed to fetch tokens", error);
    } finally {
      setFetchingTokens(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTokens();
  }, [fetchMyTokens]);

  useEffect(() => {
    const dayTokens = tokenMap[selectedDateStr] || {};
    const currentMealTypeInt = mealMap[selectedMeal as keyof typeof mealMap];

    if (dayTokens[currentMealTypeInt] !== "REDEEMED") {
      const firstRedeemedInt = [1, 2, 3].find((m) => dayTokens[m] === "REDEEMED");
      if (firstRedeemedInt) {
        const mName = Object.keys(mealMap).find(
          (k) => mealMap[k as keyof typeof mealMap] === firstRedeemedInt
        );
        if (mName) setSelectedMeal(mName);
      }
    }
  }, [selectedDateStr, tokenMap, selectedMeal]);

  const { data: complaints, isLoading, error } = useSWR<Complaint[]>(
    "/feedback/get",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true }
  );

  const dayTokens = tokenMap[selectedDateStr] || {};
  const selectedMealInt = mealMap[selectedMeal as keyof typeof mealMap];
  const isMealEligible = dayTokens[selectedMealInt] === "REDEEMED";

  const handleSubmit = async () => {
    if (!description.trim() || description.trim().length < 10) {
      setToast({
        show: true,
        message: "Please provide more details (at least 10 characters).",
        type: "error",
      });
      return;
    }

    if (!isMealEligible) {
      setToast({
        show: true,
        message: "You can only report issues for meals you consumed.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayNameStr = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      const dayInt = dayMap[dayNameStr] + 1;

      await API.post("/feedback/new", {
        category: selectedCategory,
        day: dayInt,
        date: selectedDateStr,
        mealType: selectedMealInt,
        description: description.trim(),
      });

      setDescription("");
      mutate("/feedback/get");
      setToast({
        show: true,
        message: "Complaint submitted successfully!",
        type: "success",
      });
      setActiveTab("history");
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      setToast({
        show: true,
        message: axiosError.response?.data?.message || "Failed to submit complaint.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || (!complaints && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
            <p className="mt-3 text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Feedback & Issues
          </h1>
          <p className="text-sm text-gray-500">
            Help us improve the mess by reporting any problems you encounter.
          </p>
        </div>
        <div className="flex p-1.5 bg-gray-200/60 rounded-xl mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === "new"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Report Issue
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === "history"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <History className="h-4 w-4" />
            Past Complaints ({complaints?.length || 0})
          </button>
        </div>

      
        {activeTab === "new" && (
          <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
  
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">1</span> Select
                Category
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <CategoryCard
                  label="Hygiene"
                  icon={<Droplets />}
                  selected={selectedCategory === "HYGIENE"}
                  onClick={() => setSelectedCategory("HYGIENE")}
                />
                <CategoryCard
                  label="Taste"
                  icon={<Utensils />}
                  selected={selectedCategory === "TASTE"}
                  onClick={() => setSelectedCategory("TASTE")}
                />
                <CategoryCard
                  label="Quantity"
                  icon={<Scale />}
                  selected={selectedCategory === "QUANTITY"}
                  onClick={() => setSelectedCategory("QUANTITY")}
                />
                <CategoryCard
                  label="Delay"
                  icon={<Clock />}
                  selected={selectedCategory === "DELAY"}
                  onClick={() => setSelectedCategory("DELAY")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">2</span> Which
                    Date?
                  </h2>
                  {fetchingTokens && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-md text-gray-500 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                      {viewDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      disabled={isCurrentMonth}
                      className={`p-1 rounded-md transition-all ${
                        isCurrentMonth
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-gray-400 uppercase">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: daysInViewMonth }).map((_, i) => {
                      const day = i + 1;
                      const cellDate = new Date(viewYear, viewMonth, day);
                      const isFuture = cellDate.getTime() > todayDateOnly.getTime();
                      const cellDateStr = cellDate.toLocaleDateString("en-CA");
                      const isSelected = selectedDateStr === cellDateStr;

                      const cellTokens = tokenMap[cellDateStr] || {};
                      const hasRedeemed = Object.values(cellTokens).includes("REDEEMED");

                      const isDisabled = isFuture || !hasRedeemed;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedDateStr(cellDateStr)}
                          className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : isDisabled
                              ? "text-gray-300 cursor-not-allowed bg-transparent opacity-60"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 bg-white border border-gray-100"
                          }`}
                        >
                          <span>{day}</span>
                          <div className="flex gap-0.5 h-1 mt-0.5">
                            {[1, 2, 3].map((mType) => {
                              if (cellTokens[mType] === "REDEEMED") {
                                return (
                                  <span
                                    key={mType}
                                    className={`h-1 w-1 rounded-full ${
                                      isSelected ? "bg-white" : "bg-green-500"
                                    }`}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Only dates where you ate meals are selectable
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">3</span> Which Meal?
                </h2>

                <div className="flex flex-col gap-3">
                  {MEALS.map((meal) => {
                    const mTypeInt = mealMap[meal as keyof typeof mealMap];
                    const wasEaten = dayTokens[mTypeInt] === "REDEEMED";

                    return (
                      <button
                        key={meal}
                        type="button"
                        disabled={!wasEaten}
                        onClick={() => setSelectedMeal(meal)}
                        className={`flex items-center gap-4 p-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                          !wasEaten
                            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                            : selectedMeal === meal
                            ? "bg-blue-50 text-blue-700 border-blue-500 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                            !wasEaten
                              ? "bg-gray-200 text-gray-400"
                              : selectedMeal === meal
                              ? "bg-blue-200 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {meal === "Breakfast" ? (
                            <Coffee className="h-4 w-4" />
                          ) : meal === "Lunch" ? (
                            <Sun className="h-4 w-4" />
                          ) : (
                            <Moon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p>{meal}</p>
                          <p className="text-[10px] uppercase tracking-wider mt-0.5 font-bold">
                            {wasEaten ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Eligible
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Not Consumed
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">4</span> Description
              </h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Found a pebble in the dal during lunch..."
                maxLength={500}
                className="w-full h-32 p-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-700 text-sm placeholder:text-gray-400"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 font-medium">Minimum 10 characters required</p>
                <p className="text-xs font-mono text-gray-400">
                  {description.length}/500
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || description.trim().length < 10 || !isMealEligible}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Failed to load complaints</h4>
                  <p className="text-red-700 text-xs mt-0.5">Please try again later.</p>
                </div>
              </div>
            ) : complaints && complaints.length > 0 ? (
              complaints.map((item: Complaint) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {item.meal?.mealType && (
                        <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 flex items-center gap-1.5 tracking-wider uppercase">
                          <Coffee className="h-3 w-3" />
                          {getMealName(item.meal.mealType)}
                        </span>
                      )}
                      {item.createdAt && (
                        <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200 flex items-center gap-1.5 tracking-wider uppercase">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={
                        item.status === "Resolved"
                          ? "RESOLVED"
                          : item.status === "In Progress"
                          ? "SUBMITTED"
                          : "default"
                      }
                      className="ml-2 shrink-0"
                    >
                      {item.status === "Resolved" && (
                        <CheckCircle2 data-icon="inline-start" className="h-3 w-3 mr-1" />
                      )}
                      {item.status === "In Progress" && (
                        <Loader2 data-icon="inline-start" className="h-3 w-3 animate-spin mr-1" />
                      )}
                      {item.status === "Pending" && (
                        <Clock data-icon="inline-start" className="h-3 w-3 mr-1" />
                      )}
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed mb-1">{item.description}</p>
                  {item.response && (
                    <div className="bg-blue-50/50 rounded-xl p-4 text-sm text-blue-900 border border-blue-100 mt-4">
                      <p className="font-bold mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider text-blue-600">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Admin Response
                      </p>
                      <p className="text-gray-700 bg-white p-3 rounded-lg border border-blue-100/50 shadow-sm">
                        {item.response}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-gray-50 text-gray-400 rounded-full mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-gray-900 font-bold mb-1 text-lg">No complaints yet</h3>
                <p className="text-gray-500 text-sm mb-4">
                  You haven&apos;t submitted any feedback.
                </p>
                <button
                  onClick={() => setActiveTab("new")}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Report an issue
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {toast && <Toast 
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)} />}
    </div>
  );
}