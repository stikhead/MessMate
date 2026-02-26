/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Loader2, Wallet, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import API from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import Toast from "./Toast";
import { PLAN_COST } from "@/constants";
import HostelCalendar from "./HostelCalendar";

interface CardDetails {
  isActive: "ACTIVE" | "INACTIVE";
}

export default function MessCard() {
  const { user, refreshUser } = useUser();
  const [cardData, setCardData] = useState<CardDetails | null>(null);
  const [fetching, setFetching] = useState(true); 
  const [actionLoading, setActionLoading] = useState(false); 
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);
  
  // --- NEW: State to track if the calendar is expanded ---
  const [isExpanded, setIsExpanded] = useState(false);

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

  if(!cardData) return null;
  if (!user || fetching) {
    return <div className="h-48 rounded-2xl bg-gray-100 animate-pulse mb-8 border border-gray-200" />; 
  }
  

  const isInactive = !cardData || cardData.isActive === "INACTIVE";
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
      await refreshUser(); 
      setToast({ show: true, msg: "Card activated successfully!", type: "success" });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Please try again.";
      setToast({ show: true, msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // --- VIEW 1: INACTIVE STATE ---
  // (Left this non-collapsible so they clearly see the prompt to activate)
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
              Activate your mess pass to auto-book your meals for the month.
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

  // --- VIEW 2: ACTIVE COLLAPSIBLE STATE ---
  return (
    <div className="mb-2">
      {/* ✅ The entire card is now clickable and acts as the toggle button! 
        Added 'cursor-pointer' and 'group' for hover effects.
      */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 p-6 sm:p-7 text-white shadow-lg transition-all hover:shadow-xl cursor-pointer group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-200" />
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">
                Student Mess Pass
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              {user.fullName || "Student"}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm font-mono bg-black/20 inline-block px-2.5 py-1 rounded-lg">
              Roll No: {user.roll_no || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full shadow-inner">
            <CheckCircle2 className="h-4 w-4 text-green-300" />
            <span className="font-bold tracking-wide text-xs">ACTIVE</span>
          </div>

        </div>

        {/* Toggle Indicator Strip */}
        <div className="relative z-10 mt-6 border-t border-white/20 pt-4 flex justify-center text-blue-100 group-hover:text-white transition-colors">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            {isExpanded ? "Hide Calendar" : "Manage Meal Calendar"}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </div>

      {/* ✅ The Calendar slides down gracefully when isExpanded is true */}
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {/* We wrap it in a slightly negative margin so it feels connected to the card */}
          <div className="pt-2">
            <HostelCalendar />
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}