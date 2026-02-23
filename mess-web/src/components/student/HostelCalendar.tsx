/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Loader2, Plane } from "lucide-react";
import API from "@/lib/api";
import Toast from "./Toast";

export default function HostelCalendar() {
  const [loading, setLoading] = useState(false);
  const [fetchingTokens, setFetchingTokens] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);
  
  // Store tokens mapped by date: { "2026-02-23": { 1: "BOOKED", 2: "CANCELLED", 3: "BOOKED" } }
  const [tokenMap, setTokenMap] = useState<Record<string, Record<number, string>>>({});

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = today.getDate();
 const tomorrow = new Date(today);
 const monthly = new Date(today);
 monthly.setDate(monthly.getDate() + 30);
 const maxDate = monthly.toLocaleDateString('en-CA');
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const minStartDate = tomorrow.toLocaleDateString('en-CA'); // Outputs "YYYY-MM-DD"
  // Fetch real tokens from your backend
  const fetchMyTokens = useCallback(async () => {
    setFetchingTokens(true);
    try {
      const res = await API.get("/meal/get-token");
      const tokens = res.data.data;

      // Group tokens by YYYY-MM-DD so the calendar can easily read them
      const newMap: Record<string, Record<number, string>> = {};
      
      tokens.forEach((token: any) => {
        // Convert ISO date to local YYYY-MM-DD
        const dateStr = new Date(token.date).toLocaleDateString('en-CA'); 
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
        type: "success" 
      });
      setStartDate("");
      setEndDate("");
      fetchMyTokens(); // Refresh the dots!
    } catch (error: any) {
      setToast({ show: true, msg: error.response?.data?.message || "Failed to cancel meals", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Meal Schedule</h2>
            <p className="text-sm text-gray-500">Auto-booked meals for this month.</p>
          </div>
        </div>
        {fetchingTokens && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Dynamic Calendar Visualization */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            
            {/* Offset for the first day of the month */}
            {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isPast = day < currentDay;
              
              // Format this specific day to YYYY-MM-DD to check the tokenMap
              const cellDateStr = new Date(currentYear, currentMonth, day).toLocaleDateString('en-CA');
              const dayTokens = tokenMap[cellDateStr] || {};
              
              return (
                <div 
                  key={day} 
                  className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border ${
                    day === currentDay ? 'border-blue-600 bg-blue-50' : 'border-gray-100'
                  }`}
                >
                  <span className={`text-sm font-semibold ${isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  
                  {/* Status Dots dynamically mapped from database */}
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {[1, 2, 3].map(mealType => {
                      const status = dayTokens[mealType];
                      if (!status) return null; // No token for this meal
                      
                      return (
                        <span 
                          key={mealType}
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === 'BOOKED' || status === 'REDEEMED' ? 'bg-green-400' : 
                            status === 'CANCELLED' ? 'bg-red-400' : 'bg-transparent'
                          }`} 
                          title={`${status} (Meal ${mealType})`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500 justify-center">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" /> Booked/Ate</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Cancelled</span>
          </div>
        </div>

        {/* Right Side: Leave Application Form */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
            <Plane className="h-5 w-5 text-blue-600" />
            <h3>Going Away?</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Cancel your meals for an upcoming trip to save your balance.</p>
          
          <form onSubmit={handleBulkCancel} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Leave Start Date</label>
              <input 
                type="date" 
                required
                value={startDate}
               onChange={(e) => {
                  setStartDate(e.target.value);
                  // Reset end date if it becomes invalid
                  if (endDate && e.target.value > endDate) setEndDate("");
                }}
                min={minStartDate} 
                max={maxDate}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Return Date</label>
              <input 
                type="date" 
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || minStartDate}
                max={maxDate}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !startDate || !endDate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Meals & Refund
            </button>
          </form>
        </div>

      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}