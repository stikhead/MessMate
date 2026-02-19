"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import Toast from "@/components/student/Toast";
import { Wallet, History, ArrowUpRight, ArrowDownLeft, Loader2, ShieldCheck, IndianRupee } from "lucide-react";
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
  const { user, loading: userLoading, refreshUser } = useUser()
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
    console.log(amount)

    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      const orderRes = await API.post("/wallet/create-order", { amount: val });

      const { id: order_id, currency, amount: order_amount } = orderRes.data.data;
      console.log(val)
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
      console.log(val)

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


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 pb-24 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">



          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-blue-100">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">Current Balance</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              ₹{(user?.currentBalance ?? 0).toLocaleString("en-IN")}
            </p>
            <div className="flex items-center gap-2 text-blue-200 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure payments via Razorpay</span>
            </div>
          </div>
        </div>


        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-gray-400" />
            Add Money
          </h2>

          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
              ₹
            </span>
            <input
              type="number"
              min={1}
              max={MAX_AMOUNT}
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full pl-9 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-2xl font-bold text-gray-900 placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-2 mb-5 flex-wrap">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${amount === val
                  ? "bg-blue-50 border-blue-400 text-blue-600 shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                  }`}
              >
                +₹{val}
              </button>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={loading || !amount || Number(amount) < 1 || (user?.currentBalance ?? 0) > 4000}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              `${(user?.currentBalance ?? 0) < 4000 && Number(amount) > 0 ? `Pay ₹${Number(amount).toLocaleString("en-IN")}` : (user?.currentBalance ?? 0) > 4000 ? "Max Wallet Balance Reached (₹4000)" : "Pay ₹—"}`
            )}
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-400" />
            Transaction History
          </h2>

          <div className="overflow-y-auto max-h-67 space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                >
                  <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-36" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
              ))
            ) : history && history.length > 0 ? (
              history.map((txn: Transaction) => (
                <div
                  key={txn._id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${txn.transactionType === "credit"
                      ? "bg-green-100"
                      : "bg-red-100"
                      }`}
                  >
                    {txn.transactionType === "credit" ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {txn.transactionType === "credit" ? "Wallet Top-up" : "Meal Purchase"}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${txn.transactionType === "credit"
                        ? "text-green-600"
                        : "text-red-500"
                        }`}
                    >
                      {txn.transactionType === "credit" ? "+" : "−"}₹{txn.amount.toLocaleString("en-IN")}
                    </p>
                    <Badge variant={
                        txn.status === 'success' ? 'success' :
                        txn.status === "failed" ? 'failed' : 'success'
                    } >
                        {txn.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-100 mb-3">
                  <History className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No transactions yet</p>
                <p className="text-xs text-gray-500">Your payment history will appear here.</p>
              </div>
            )}
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
