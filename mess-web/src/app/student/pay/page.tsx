"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import Toast from "@/components/student/Toast";
import { Wallet, History, ArrowUpRight, ArrowDownLeft, Loader2, ShieldCheck, IndianRupee, Sparkles, Plus } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { formatDate, MAX_AMOUNT, QUICK_AMOUNTS } from "@/constants";
import { Transaction } from "@/types/common";
import { RazorpayOptions } from "@/types/razorpay";
import { Badge } from "@/components/ui/badge";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentPage() {
  const { user, loading: userLoading, refreshUser } = useUser();
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { data: history, isLoading } = useSWR<Transaction[]>(
    "/wallet/history",
    (url: string) => API.get(url).then((res) => res.data.data)
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setAmount("");
      return;
    }

    const num = Number(raw);
    if (isNaN(num) || num < 0) return;
    if (num > MAX_AMOUNT) {
      setToast({
        show: true,
        message: `Maximum top-up is ₹${MAX_AMOUNT}`,
        type: "error",
      });
      setAmount(MAX_AMOUNT);
      return;
    }
    setAmount(num);
  };

  const handlePayment = async () => {
    const val = Number(amount);
    if (!val || val < 1) {
      setToast({ show: true, message: "Please enter a valid amount", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      const orderRes = await API.post("/wallet/create-order", { amount: val });

      const { id: order_id, currency, amount: order_amount } = orderRes.data.data;
      
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order_amount,
        currency,
        name: "MessMate",
        description: "Wallet Top-up",
        order_id,
        handler: async (response) => {
          try {
            await API.post("/wallet/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            refreshUser();
            setAmount("");
            mutate("/wallet/history");
            setToast({ show: true, message: "Payment Successful! Balance Updated.", type: "success" });
          } catch {
            setToast({ show: true, message: "Payment verification failed", type: "error" });
          }
        },
        prefill: { name: user?.fullName ?? "", contact: "" },
        theme: { color: "#2563EB" },
      };

      new window.Razorpay(options).open();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Something went wrong";
      setToast({ show: true, message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-48 rounded-3xl bg-gray-200 animate-pulse" />
            <div className="h-80 rounded-3xl bg-gray-200 animate-pulse" />
          </div>
          <div className="lg:col-span-5 h-125 rounded-3xl bg-gray-200 animate-pulse" />
        </main>
      </div>
    );
  }

  const currentBalance = user?.currentBalance ?? 0;
  const isMaxedOut = currentBalance >= 4000;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="lg:col-span-7 space-y-6">
          
          <div className="group relative overflow-hidden rounded-[2rem] bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-10 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl translate-y-1/2 -translate-x-1/4 transition-transform duration-700 group-hover:scale-150" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-blue-100 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Current Balance</span>
                </div>
                <Sparkles className="h-6 w-6 text-blue-300 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium text-blue-200">₹</span>
                <p className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
                  {currentBalance.toLocaleString("en-IN")}
                </p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-blue-200 text-sm font-medium">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <span>Secured by 128-bit encryption via Razorpay</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              Top-up Wallet
            </h2>
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-gray-50 rounded-2xl border-2 border-gray-100 transition-colors group-focus-within:border-blue-500 group-focus-within:bg-blue-50/30" />
              <div className="relative flex items-center px-6 py-4">
                <span className="text-3xl font-black text-gray-400 group-focus-within:text-blue-500 transition-colors mr-2">₹</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_AMOUNT}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  disabled={isMaxedOut}
                  className="w-full bg-transparent outline-none text-4xl sm:text-5xl font-black text-gray-900 placeholder:text-gray-300 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-3 mb-8 flex-wrap">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  disabled={isMaxedOut}
                  onClick={() => setAmount(val)}
                  className={`flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    amount === val
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 -translate-y-0.5"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  <Plus className="h-3 w-3" /> {val}
                </button>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || !amount || Number(amount) < 1 || isMaxedOut}
              className="group relative w-full overflow-hidden rounded-2xl bg-blue-600 p-4 text-center font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Secure Payment...
                  </>
                ) : isMaxedOut ? (
                  "Wallet Limit Reached (₹4000)"
                ) : (
                  <>
                    Proceed to Pay {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : ""}
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                Recent Transactions
              </h2>
              <Badge variant="outline" className="bg-gray-50 text-xs font-bold">
                {history?.length || 0} Total
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/50 animate-pulse">
                    <div className="h-12 w-12 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : history && history.length > 0 ? (
                history.map((txn: Transaction) => (
                  <div
                    key={txn._id}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 hover:border-gray-100 transition-all duration-300"
                  >
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                        txn.transactionType === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {txn.transactionType === "credit" ? (
                        <ArrowDownLeft className="h-6 w-6" />
                      ) : (
                        <ArrowUpRight className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {txn.transactionType === "credit" ? "Wallet Top-up" : "Meal Booked"}
                      </p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">
                        {formatDate(txn.date)}
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p
                        className={`text-base font-black ${
                          txn.transactionType === "credit" ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {txn.transactionType === "credit" ? "+" : "−"}₹{txn.amount.toLocaleString("en-IN")}
                      </p>
                      <Badge 
                        variant={
                          txn.status === 'success' ? 'success' :
                          txn.status === "failed" ? 'failed' : 'success'
                        } 
                        className="text-[9px] px-2 py-0"
                      >
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-50 border-2 border-gray-100 mb-4">
                    <History className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">No transactions yet</p>
                  <p className="text-xs text-gray-500">Your top-ups and deductions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {toast?.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}