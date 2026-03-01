"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Navbar from "@/components/student/Navbar";
import API from "@/lib/api";
import { User as UserIcon, Mail, Hash, Wallet, TrendingDown, AlertCircle, Phone, ShieldCheck, CreditCard, History, ArrowRight } from "lucide-react";
import { MealToken } from "@/types/common";

export default function StudentProfile() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [tokens, setTokens] = useState<MealToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const res = await API.get(`/meal/get-token?t=${cacheBuster}`);
        const rawTokens = res?.data?.data;
        setTokens(Array.isArray(rawTokens) ? rawTokens : []);
      } catch (error) {
        console.error("Failed to fetch tokens for profile", error);
      } finally {
        setLoadingTokens(false);
      }
    };

    if (user) {
      fetchTokens();
    }
  }, [user]);

  if (userLoading || loadingTokens) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="space-y-3">
              <div className="h-6 w-48 bg-gray-200 rounded-lg" />
              <div className="h-5 w-32 bg-blue-100 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />
            <div className="space-y-6">
              <div className="h-32 bg-gray-900 rounded-[2rem] animate-pulse" />
              <div className="h-56 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const missedMeals = tokens.filter((t) => t.status === "EXPIRED");
  const missedCount = missedMeals.length;
  const moneyLost = missedMeals.reduce((sum, token) => sum + (token.cost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="group flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="h-20 w-20 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-600/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="h-8 w-8" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {user.fullName || "Student Profile"}
              {user.isCardHolder && <ShieldCheck className="h-5 w-5 text-green-500" />}
            </h1>
            <div className="flex gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border ${
                user.isCardHolder 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {user.isCardHolder ? <CreditCard className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                {user.isCardHolder ? "Active Mess Pass" : "Day Scholar"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md space-y-6">
            <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Personal Information
            </h2>

            <div className="space-y-3">
              {[
                { icon: UserIcon, label: "Full Name", value: user.fullName },
                { icon: Hash, label: "Roll Number", value: user.roll_no },
                { icon: Mail, label: "Email Address", value: user.email || "Not Provided" },
                { icon: Phone, label: "Phone Number", value: user.phone || "Not Provided" },
              ].map((detail, idx) => (
                <div key={idx} className="group/item flex items-center gap-4 bg-gray-50/50 hover:bg-blue-50/50 p-3.5 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-gray-400 group-hover/item:text-blue-600 transition-colors">
                    <detail.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover/item:text-blue-500 transition-colors">{detail.label}</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-[11px] text-gray-500 font-medium">
                Need to update your details? <br/>Contact the administration office.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            
            <div 
              onClick={() => router.push('/student/pay')}
              className="group cursor-pointer bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-all duration-500 group-hover:scale-150 group-hover:bg-green-400/20" />
              
              <div className="relative z-10 flex justify-between items-start mb-6">
                <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Wallet Balance
                </h2>
                <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <div className="relative z-10 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight transition-colors group-hover:text-green-300">
                  ₹{user.currentBalance?.toLocaleString('en-IN') || 0}
                </span>
              </div>
              <p className="relative z-10 text-xs font-medium text-gray-400 mt-2">Tap to add funds or view transactions</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/student/booking')}
                className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <History className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-600">Meal History</span>
              </button>
              
              <button 
                onClick={() => router.push('/student/issues')}
                className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-600">Report Issue</span>
              </button>
            </div>

            <div className={`bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${missedCount > 0 ? "border-2 border-red-100" : "border border-gray-100"}`}>
              {missedCount > 0 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              )}
              
              <h2 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10 ${missedCount > 0 ? "text-red-500" : "text-gray-400"}`}>
                <TrendingDown className="h-4 w-4" /> Wastage Overview
              </h2>

              <div className="relative z-10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Missed Meals</p>
                  <p className={`text-3xl font-black ${missedCount > 0 ? "text-gray-900" : "text-gray-300"}`}>{missedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Money Lost</p>
                  <p className={`text-3xl font-black ${missedCount > 0 ? "text-red-600" : "text-gray-300"}`}>₹{moneyLost}</p>
                </div>
              </div>

              {missedCount > 0 ? (
                <div className="mt-6 flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 relative z-10">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-red-900 leading-relaxed">
                    You have lost <strong>₹{moneyLost}</strong> due to missed meals this cycle. Remember to cancel your bookings 2 hours in advance to get an instant refund!
                  </p>
                </div>
              ) : (
                <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-100 relative z-10 text-center">
                  <p className="text-xs font-bold text-green-700">
                    🎉 Perfect Streak! Zero meals wasted.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}