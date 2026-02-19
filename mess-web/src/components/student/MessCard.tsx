"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, Lock, Loader2, Wallet, Sparkles } from "lucide-react";
import API from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import Toast from "./Toast";
import { PLAN_COST, PLAN_MEALS } from "@/constants";

interface CardDetails {
  mealAmount: number;
  isAutoBookingEnabled: boolean;
  isActive: "ACTIVE" | "INACTIVE";
}

export default function MessCard() {
  const { user } = useUser();
  

  const [cardData, setCardData] = useState<CardDetails | null>(null);
  const [fetching, setFetching] = useState(true); 
  const [actionLoading, setActionLoading] = useState(false); 

  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  } | null>(null);

 

 
  const fetchCardData = useCallback(async () => {
    try {
      const res = await API.get("/cards/get").catch(() => null);
      if (res?.data && res.data.data) {
        setCardData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch card", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchCardData();
  }, [user, fetchCardData]);

  if (!user || fetching) {
    return (
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse mb-8 border border-gray-200" />
    ); 
  }

  if (!cardData) return null;

  const {  mealAmount = 0, isAutoBookingEnabled, isActive } = cardData;

  const cardStatus = isActive;
  const isInactive = (cardStatus === "INACTIVE" || mealAmount <= 0);
  const walletBalance = (user.currentBalance || 0);
  const hasEnoughBalance = (walletBalance >= PLAN_COST);


  const handleRecharge = async () => {
    if (!hasEnoughBalance) {
      setToast({
        show: true,
        msg: `Insufficient balance! Add ₹${PLAN_COST - walletBalance} to wallet.`,
        type: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      await API.post("/cards/recharge");
      await fetchCardData();
      setToast({ show: true, msg: "Card activated successfully!", type: "success" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = error.response?.data?.message || "Please try again.";
      setToast({ show: true, msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAutoBooking = async () => {
    setActionLoading(true);
    try {
      await API.patch("/cards/preferences", {
        isAutoBookingEnabled: !isAutoBookingEnabled,
      });
      await fetchCardData();
      setToast({
        show: true,
        msg: `Auto-booking ${!isAutoBookingEnabled ? "enabled" : "paused"} successfully`,
        type: "success",
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setToast({ show: true, msg: "Failed to update preference", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };


  if (isInactive) {
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 text-white shadow-xl border border-gray-700 mb-8">
          <div className="absolute top-0 right-0 h-48 w-48 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

          <div className="flex flex-col items-center relative z-10 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 border-2 border-gray-700 mb-4 shadow-inner">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              Card Inactive.
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            </p>

            <button
              onClick={handleRecharge}
              disabled={actionLoading || !hasEnoughBalance}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                hasEnoughBalance
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/50 active:scale-95"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  Activate Card • ₹{PLAN_COST}
                </>
              )}
            </button>
          </div>
        </div>

        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }


  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 p-6 sm:p-7 text-white shadow-lg transition-all hover:shadow-xl mb-8">
    
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-200" />
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">
                Student Mess Card
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {user.fullName || "Student"}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm opacity-90 font-mono mt-1">
              Roll: {user.roll_no || "N/A"}
            </p>
          </div>

          <div className="text-right bg-white/15 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
            <div className="flex items-baseline gap-1 justify-end">
              <span
                className={`text-2xl sm:text-3xl font-bold ${
                  mealAmount < 5 ? "text-red-300" : "text-white"
                }`}
              >
                {mealAmount}
              </span>
              <span className="text-blue-200 text-sm">/{PLAN_MEALS}</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-blue-200 mt-0.5">
              Meals Left
            </p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`p-2 rounded-full ${
                  isAutoBookingEnabled
                    ? "bg-white text-green-700"
                    : "bg-white text-red-700"
                }`}
              >
                {isAutoBookingEnabled ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {isAutoBookingEnabled
                    ? "Autobooking Active"
                    : "Autobooking Paused"}
                </p>
                <p className="text-xs sm:text-sm text-blue-100 opacity-90 mt-0.5">
                  {isAutoBookingEnabled
                    ? "Tomorrow's meals will be booked automatically"
                    : "Meals will be skipped until autobooking is disabled"}
                </p>
              </div>
            </div>

            <button
              onClick={toggleAutoBooking}
              disabled={actionLoading}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isAutoBookingEnabled
                  ? "bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm"
                  : "bg-white text-indigo-700 hover:bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : isAutoBookingEnabled ? (
                "Pause for Tomorrow"
              ) : (
                "Resume Booking"
              )}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}