"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Loader2,
  Plane,
  X,
  Coffee,
  Sun,
  Moon,
  Clock,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API from "@/lib/api";
import Toast from "./Toast";

// --- TYPES ---
interface Token {
  date: string;
  mealType: number;
  status: "BOOKED" | "REDEEMED" | "CANCELLED";
}

interface DayDetailsModalProps {
  dateStr: string;
  dayTokens: Record<number, string>;
  onClose: () => void;
  refreshTokens: () => void;
}

// --- MODAL COMPONENT ---
function DayDetailsModal({
  dateStr,
  dayTokens,
  onClose,
  refreshTokens,
}: DayDetailsModalProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getDayIndex = (dateString: string) => {
    return new Date(dateString).getDay();
  };

  const handleAction = async (mealType: number, currentStatus: string) => {
    setLoading(mealType);
    setActionError(null);
    try {
      const isBooking =
        currentStatus === "CANCELLED" || currentStatus === "NONE";
      const endpoint = isBooking ? "/meal/book" : "/meal/cancel";

      await API.post(endpoint, {
        mealType,
        day: getDayIndex(dateStr),
        date: dateStr,
      });

      refreshTokens();
      setTimeout(() => onClose(), 500);
    } catch (error: unknown) {
      console.error(error);
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update meal.";
      setActionError(msg);
    } finally {
      setLoading(null);
    }
  };

  const meals = [
    {
      type: 1,
      name: "Breakfast",
      icon: <Coffee className="h-4 w-4" />,
      startHour: 8,
      price: 40,
      color: "orange",
    },
    {
      type: 2,
      name: "Lunch",
      icon: <Sun className="h-4 w-4" />,
      startHour: 13,
      price: 60,
      color: "blue",
    },
    {
      type: 3,
      name: "Dinner",
      icon: <Moon className="h-4 w-4" />,
      startHour: 20,
      price: 60,
      color: "indigo",
    },
  ];

  const checkDeadline = (startHour: number) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const mealTime = new Date(year, month - 1, day, startHour, 0, 0, 0);
    const deadlineTime = mealTime.getTime() - 2 * 60 * 60 * 1000; 
    return Date.now() > deadlineTime;
  };

  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-linear-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{formattedDate}</h3>
              <p className="text-blue-100 text-xs flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Booking closes 2 hours before each meal
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm border border-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {actionError && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{actionError}</p>
          </div>
        )}

        <div className="p-5 space-y-3">
          {meals.map((meal) => {
            const status = dayTokens[meal.type] || "NONE";
            const isBooked = status === "BOOKED" || status === "REDEEMED";
            const isPastDeadline = checkDeadline(meal.startHour);
            const isRedeemed = status === "REDEEMED";

            return (
              <div
                key={meal.type}
                className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  isBooked
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isBooked
                        ? `bg-green-100 text-${meal.color}-600`
                        : `bg-${meal.color}-50 text-${meal.color}-600`
                    }`}
                  >
                    {meal.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      {meal.name}
                      <span className="text-xs text-gray-500 font-medium">
                        • ₹{meal.price}
                      </span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isBooked && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isBooked ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {status === "NONE"
                          ? "Available"
                          : status === "REDEEMED"
                          ? "Consumed"
                          : status}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(meal.type, status);
                  }}
                  disabled={
                    loading === meal.type || isRedeemed || isPastDeadline
                  }
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all w-20 flex justify-center items-center ${
                    isRedeemed || isPastDeadline
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isBooked
                      ? "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  {loading === meal.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRedeemed ? (
                    "Eaten"
                  ) : isPastDeadline ? (
                    "Closed"
                  ) : isBooked ? (
                    "Cancel"
                  ) : (
                    "Book"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">💡 Quick Tip</p>
            <p>
              Book meals at least 2 hours in advance. Cancelled meals are
              automatically refunded to your wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN CALENDAR COMPONENT ---
export default function HostelCalendar() {
  const [loading, setLoading] = useState(false);
  const [fetchingTokens, setFetchingTokens] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [tokenMap, setTokenMap] = useState<Record<string, Record<number, string>>>({});
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // --- CALENDAR STATE LOGIC ---
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const todayDateOnly = new Date(currentYear, currentMonth, currentDay);

  // Manage which month is currently visible on the screen
  const [viewDate, setViewDate] = useState(new Date(currentYear, currentMonth, 1));
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minStartDate = tomorrow.toLocaleDateString("en-CA");

  const monthly = new Date(today);
  monthly.setDate(monthly.getDate() + 30);
  const maxDate = monthly.toLocaleDateString("en-CA");

  // Navigation Handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Limit bounds to prevent endless scrolling (Current Month <--> Next Month)
  const isCurrentMonth = viewMonth === currentMonth && viewYear === currentYear;
  const nextMonthObj = new Date(currentYear, currentMonth + 1, 1);
  const isMaxMonth = viewMonth === nextMonthObj.getMonth() && viewYear === nextMonthObj.getFullYear();

  const fetchMyTokens = useCallback(async () => {
    setFetchingTokens(true);
    try {
      const res = await API.get("/meal/get-token");
      const tokens: Token[] = res.data.data;

      const newMap: Record<string, Record<number, string>> = {};

      tokens.forEach((token) => {
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

  const handleBulkCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await API.post("/meal/bulk-cancel", { startDate, endDate });
      setToast({
        show: true,
        msg: `Successfully cancelled ${res.data.data.cancelledCount} meals. ₹${res.data.data.refunded} refunded.`,
        type: "success",
      });
      setStartDate("");
      setEndDate("");
      fetchMyTokens();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to cancel meals";
      setToast({ show: true, msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = () => {
    return viewDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Your Meal Schedule
              </h2>
              {/* --- MONTH NAVIGATION CONTROLS --- */}
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={handlePrevMonth} 
                  disabled={isCurrentMonth} 
                  className={`p-1 rounded-md transition-colors ${isCurrentMonth ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 min-w-25 text-center">
                  {getMonthName()}
                </span>
                <button 
                  onClick={handleNextMonth} 
                  disabled={isMaxMonth} 
                  className={`p-1 rounded-md transition-colors ${isMaxMonth ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {fetchingTokens && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Loading...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty cells for days before month start */}
              {Array.from({
                length: new Date(viewYear, viewMonth, 1).getDay(),
              }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}

              {/* Actual days */}
              {Array.from({ length: daysInViewMonth }).map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(viewYear, viewMonth, day);
                
                // Compare with midnight today to determine if past/today
                const isPast = cellDate.getTime() < todayDateOnly.getTime();
                const isToday = cellDate.getTime() === todayDateOnly.getTime();

                // Format exactly to local YYYY-MM-DD to match the map
                const cellDateStr = cellDate.toLocaleDateString("en-CA");
                const dayTokens = tokenMap[cellDateStr] || {};
                const hasMeals = Object.keys(dayTokens).length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPast) setSelectedDateStr(cellDateStr);
                    }}
                    disabled={isPast}
                    className={`group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all ${
                      isToday
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : isPast
                        ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50"
                        : hasMeals
                        ? "border-green-200 bg-green-50 hover:border-green-300 hover:shadow-md cursor-pointer"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer hover:bg-blue-50"
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-base font-bold transition-colors ${
                        isToday
                          ? "text-blue-600"
                          : isPast
                          ? "text-gray-400"
                          : "text-gray-700 group-hover:text-blue-600"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Meal Indicators */}
                    <div className="flex gap-0.5 sm:gap-1 mt-1.5 h-1.5">
                      {[1, 2, 3].map((mealType) => {
                        const status = dayTokens[mealType];
                        if (!status) return null;

                        return (
                          <span
                            key={mealType}
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === "BOOKED" || status === "REDEEMED"
                                ? "bg-green-500"
                                : status === "CANCELLED"
                                ? "bg-red-400"
                                : "bg-transparent"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Today Badge */}
                    {isToday && (
                      <div className="absolute -top-1 -right-1">
                        <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-5 pt-5 border-t border-gray-100">
              <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Booked/Eaten
              </span>
              <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                Cancelled
              </span>
            </div>
          </div>

          {/* Bulk Cancel Panel */}
          <div className="bg-linear-to-br from-gray-50 to-blue-50/50 rounded-xl p-5 border-2 border-blue-100 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <Plane className="h-5 w-5" />
              </div>
              <h3 className="text-lg">Going on Leave?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Cancel your meals for an upcoming trip and get an instant refund
              to your wallet.
            </p>

            <form onSubmit={handleBulkCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Leave Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate("");
                  }}
                  min={minStartDate}
                  max={maxDate}
                  className="w-full rounded-lg border-2 border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Return Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || minStartDate}
                  max={maxDate}
                  className="w-full rounded-lg border-2 border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !startDate || !endDate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Cancel Meals & Get Refund
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDateStr && (
        <DayDetailsModal
          dateStr={selectedDateStr}
          dayTokens={tokenMap[selectedDateStr] || {}}
          onClose={() => setSelectedDateStr(null)}
          refreshTokens={fetchMyTokens}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}