/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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



// --- MAIN PAGE ---
export default function BookMealPage() {
  const { user, refreshUser } = useUser();
  const [selectedDate, setSelectedDate] = useState<"TODAY" | "TOMORROW">("TODAY");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const [historyTab, setHistoryTab] = useState<"REGULAR" | "EMERGENCY">("REGULAR");
  const [bookingHistory, setBookingHistory] = useState<MealToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const isCardHolder = !!user?.isCardHolder;


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

  const fetchData = async () => {
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
  };

  const fetchBookingHistory = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const handleCancel = async (mealType: number) => {
    try {
      const dayOffset = selectedDate === "TODAY" ? 0 : 1;
      const dayIndex = getDayIndex(dayOffset);

      await API.post("/meal/cancel", { mealType, day: dayIndex });
      setToast({ show: true, message: "Meal cancelled successfully!", type: "success" });

      await refreshUser();
      await fetchData();
      await fetchBookingHistory();
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.message || "Cancellation failed", type: "error" });
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
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.message || "Booking failed", type: "error" });
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-24 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              {isCardHolder ? "Emergency Re-book" : "Book Your Meal"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isCardHolder ? "Revive a cancelled meal for tomorrow." : "Select a meal to reserve your spot."}
            </p>
          </div>

          <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
            {!isCardHolder && (
              <button
                onClick={() => setSelectedDate("TODAY")}
                className={`px-5 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedDate === "TODAY" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Today
              </button>
            )}
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
                isCardHolder={isCardHolder} // Passed down to shape the UI
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-400" />
            Booking History
          </h2>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-gray-400" />
              History Log
            </h2>

            {/* NEW: Tab Switcher for History */}
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
          </div>

          <div className="overflow-y-auto max-h-73 space-y-3 pr-1">
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
            ) : bookingHistory && bookingHistory.filter(b => historyTab === "EMERGENCY" ? b.isEmergency : !b.isEmergency).length > 0 ? (
              
              // Filter the history based on the active tab
              bookingHistory
                .filter(b => historyTab === "EMERGENCY" ? b.isEmergency : !b.isEmergency)
                .map((booking) => (
                  <BookingHistoryRow key={booking._id} booking={booking} />
                ))

            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-50 border border-gray-100 mb-3">
                  {historyTab === "EMERGENCY" ? (
                    <AlertCircle className="h-6 w-6 text-orange-400" />
                  ) : (
                    <History className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  No {historyTab === "EMERGENCY" ? "Emergency " : ""}Bookings
                </p>
                <p className="text-xs text-gray-500">
                  {historyTab === "EMERGENCY" 
                    ? "You haven't made any last-minute re-books." 
                    : "Your standard meal history will appear here."}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// --- BOOKING HISTORY ROW COMPONENT ---
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

      <div className="shrink-0">
        <Badge variant={booking.status as any}>
          {booking.status === "BOOKED" && <Clock data-icon="inline-start" className="h-3 w-3 mr-1" />}
          {booking.status === "CANCELLED" && <XCircle data-icon="inline-start" className="h-3 w-3 mr-1" />}
          {booking.status === "REDEEMED" && <CheckCircle2 data-icon="inline-start" className="h-3 w-3 mr-1" />}
          {booking.status}
        </Badge>
        {booking.isEmergency && (
           <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">
             EMERGENCY
           </span>
        )}
      </div>
    </div>
  );
}