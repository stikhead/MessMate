"use client";

import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import Toast from "@/components/student/Toast";
import { useUser } from "@/hooks/useUser";
import { UtensilsCrossed, History, AlertCircle } from "lucide-react";
import { CheckCircle2, Clock, Coffee, Moon, Sun, Calendar, XCircle } from "lucide-react";
import { days } from "@/constants/index";
import { MealToken, MenuItem, ToastState } from "@/types/common";
import { Badge } from "@/components/ui/badge";
import MealCard from "@/components/student/MealCard";
import { getErrorMessage } from "@/lib/error-handler";

export default function BookMealPage() {
  const { user, refreshUser } = useUser();

  const isCardHolder = !!user?.isCardHolder;

  const [mainTab, setMainTab] = useState<"BOOKING" | "HISTORY">("BOOKING");

  const [selectedDate, setSelectedDate] = useState<"TODAY" | "TOMORROW">("TODAY");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const [historyTab, setHistoryTab] = useState<"REGULAR" | "EMERGENCY">("REGULAR");
  const [bookingHistory, setBookingHistory] = useState<MealToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (isCardHolder) {
      setMainTab("HISTORY");
    }
  }, [isCardHolder]);

  useEffect(() => {
    if (isCardHolder && selectedDate === "TODAY") {
      setSelectedDate("TOMORROW");
    }
  }, [isCardHolder, selectedDate]);

  const getDayIndex = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getDay();
  };

  const isMealPast = (type: number) => {
    if (selectedDate === "TOMORROW") return false;

    const h = new Date().getHours();
    if (type === 1 && h >= 6) return true; 
    if (type === 2 && h >= 10) return true; 
    if (type === 3 && h >= 18) return true; 
    return false;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dayOffset = selectedDate === "TODAY" ? 0 : 1;
      const dayIndex = getDayIndex(dayOffset);

      const menuRes = await API.get(`/menu/getMenu?day=${dayIndex}&mealType=0`).catch(() => null);
      const menuData = Array.isArray(menuRes?.data.data) ? menuRes?.data.data : [menuRes?.data.data];
      setMenu(menuData.filter((i: unknown) => i !== null));

      const res = await API.get(`/meal/get-token?day=${dayIndex}`);
      const fetchedTokens = res.data.data;

      if (Array.isArray(fetchedTokens)) {
        setTokens(fetchedTokens);
      } else if (fetchedTokens) {
        setTokens([fetchedTokens]);
      } else {
        setTokens([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchBookingHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await API.get("/meal/get-token");
      const history = res.data.data;
      if (Array.isArray(history)) {
        setBookingHistory(history);
      } else if (history) {
        setBookingHistory([history]);
      } else {
        setBookingHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch booking history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCardHolder && mainTab === "BOOKING") {
      fetchData();
    }
  }, [fetchData, isCardHolder, mainTab]);

  useEffect(() => {
    fetchBookingHistory();
  }, [fetchBookingHistory]);

  const handleCancel = async (mealType: number) => {
    try {
      const dayOffset = selectedDate === "TODAY" ? 0 : 1;
      const dayIndex = getDayIndex(dayOffset);

      await API.post("/meal/cancel", { mealType, day: dayIndex });
      setToast({ show: true, message: "Meal cancelled successfully!", type: "success" });

      await refreshUser();
      await fetchData();
      await fetchBookingHistory();
    }  catch (error) {
       const message = getErrorMessage(error, "Failed to submit response");
       setToast({ show: true, message, type: "error" }); 
     } finally {
      setBookingLoading(null);
    }
  }

  const handleBook = async (mealType: number, price: number) => {
    if (!user) return;

    if (user.currentBalance < price) {
      setToast({ show: true, message: "Insufficient balance! Please recharge.", type: "error" });
      return;
    }

    setBookingLoading(mealType);
    try {
      const dayOffset = selectedDate === "TODAY" ? 0 : 1;
      const dayIndex = getDayIndex(dayOffset);

      await API.post("/meal/book", { mealType, day: dayIndex });
      setToast({ show: true, message: "Meal booked successfully!", type: "success" });

      await refreshUser();
      await fetchData();
      await fetchBookingHistory();
    }  catch (error) {
       const message = getErrorMessage(error, "Failed to submit response");
      setToast({ show: true, message, type: "error" });
    } finally {
      setBookingLoading(null);
    }
  };

  const displayedHistory = isCardHolder 
    ? bookingHistory 
    : bookingHistory.filter(b => historyTab === "EMERGENCY" ? b.isEmergency : !b.isEmergency);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-24 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            {isCardHolder 
              ? "Booking History" 
              : mainTab === "BOOKING" ? "Book Your Meal" : "Booking History"}
          </h1>
          <p className="text-sm text-gray-500">
            {isCardHolder 
              ? "View your past meal consumptions and cancellations."
              : mainTab === "BOOKING" 
                ? "Select a meal to reserve your spot." 
                : "View your past meal bookings, consumptions, and cancellations."}
          </p>
        </div>

        {!isCardHolder && (
          <div className="flex p-1.5 bg-gray-200/60 rounded-xl shadow-inner max-w-md">
            <button
              onClick={() => setMainTab("BOOKING")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                mainTab === "BOOKING"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Book Meal
            </button>
            <button
              onClick={() => setMainTab("HISTORY")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                mainTab === "HISTORY"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        )}

        {!isCardHolder && mainTab === "BOOKING" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            
            <div className="flex justify-end">
              <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
                <button
                  onClick={() => setSelectedDate("TODAY")}
                  className={`px-5 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedDate === "TODAY" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate("TOMORROW")}
                  className={`px-5 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedDate === "TOMORROW" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-80 bg-white border border-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {[1, 2, 3].map((type) => (
                  <MealCard
                    key={type}
                    type={type}
                    menuItem={menu.find((m) => m?.mealType === type)}
                    token={tokens.find((t) => t.mealType === type)}
                    isPast={isMealPast(type)}
                    onBook={handleBook}
                    onCancel={handleCancel}
                    loading={bookingLoading === type}
                    isCardHolder={isCardHolder}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {mainTab === "HISTORY" && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                Token Log
              </h2>

              {!isCardHolder && (
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setHistoryTab("REGULAR")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      historyTab === "REGULAR" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() => setHistoryTab("EMERGENCY")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      historyTab === "EMERGENCY" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Emergency
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-y-auto max-h-150 space-y-3 pr-1">
              {historyLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-36" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                ))
              ) : displayedHistory.length > 0 ? (
                displayedHistory.map((booking) => (
                  <BookingHistoryRow key={booking._id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-50 border border-gray-100 mb-3">
                    {historyTab === "EMERGENCY" && !isCardHolder ? (
                      <AlertCircle className="h-6 w-6 text-orange-400" />
                    ) : (
                      <History className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    No {!isCardHolder && historyTab === "EMERGENCY" ? "Emergency " : ""}Records Found
                  </p>
                  <p className="text-xs text-gray-500">
                    Your meal history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function BookingHistoryRow({ booking }: { booking: MealToken }) {
  const getMealInfo = (type: number) => {
    const configs = {
      1: { name: "Breakfast", icon: <Coffee className="h-5 w-5 text-orange-600" />, bg: "bg-orange-100" },
      2: { name: "Lunch", icon: <Sun className="h-5 w-5 text-blue-600" />, bg: "bg-blue-100" },
      3: { name: "Dinner", icon: <Moon className="h-5 w-5 text-indigo-600" />, bg: "bg-indigo-100" },
    };
    return configs[type as keyof typeof configs] || { name: "Meal", icon: <UtensilsCrossed className="h-5 w-5 text-gray-600" />, bg: "bg-gray-100" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const getDayName = (dayNum?: number) => {
    if (dayNum === undefined) return "";
    return days[dayNum] || "";
  };

  const info = getMealInfo(booking.mealType);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${info.bg}`}>
        {info.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {info.name}
          {booking.day !== undefined && (
            <span className="text-gray-500 font-normal ml-1.5">• {getDayName(booking.day)}</span>
          )}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <Calendar className="h-3 w-3" />
          {formatDate(booking.createdAt)}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <Badge variant={booking.status}>
          {booking.status === "BOOKED" && <Clock data-icon="inline-start" className="h-3 w-3 mr-1" />}
          {booking.status === "CANCELLED" && <XCircle data-icon="inline-start" className="h-3 w-3 mr-1" />}
          {booking.status === "REDEEMED" && <CheckCircle2 data-icon="inline-start" className="h-3 w-3 mr-1" />}
          {booking.status}
        </Badge>

      </div>
    </div>
  );
}
