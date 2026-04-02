/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import API from "@/lib/api";
import Cookies from "js-cookie";
import Toast from "@/components/student/Toast"; 

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.replace("/auth/register");
    }
  }, [email, router]);

  if (!email) return null;

  const handleChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    if (val !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6).split("");
    const newOtp = [...otp];

    pastedData.forEach((char, i) => {
      if (!isNaN(Number(char))) {
        newOtp[i] = char;
      }
    });

    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await API.post("/users/verify", { 
        email, 
        code: otp.join("") 
      });

      const { accessToken, user } = res.data.data;

      Cookies.set("accessToken", accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });


      localStorage.setItem("user", JSON.stringify(user));

      setToast({ message: "Account verified! Welcome aboard.", type: "success" });

      setTimeout(() => {
        router.replace("/student/dashboard");
      }, 1000);

    } catch (err: any) {
      console.error("Verification failed:", err);
      setToast({ 
        message: err.response?.data?.message || "Invalid OTP. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            <ShieldCheck className="h-16 w-16 text-blue-600 relative z-10" />
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verify Your Email</h2>
        <p className="text-gray-500 text-sm font-medium mt-3 mb-10 leading-relaxed">
          We sent a 6-digit verification code to <br/>
          <span className="text-blue-600 font-bold">{email}</span>
        </p>
        
        <div className="flex gap-2 sm:gap-3 justify-center mb-10" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input 
              key={idx} 
              ref={(el) => { otpRefs.current[idx] = el; }}
              type="text" 
              inputMode="numeric"
              maxLength={1} 
              value={digit} 
              onChange={e => handleChange(e.target.value, idx)} 
              onKeyDown={e => handleKeyDown(e, idx)}
              className="w-12 h-14 border-2 border-gray-100 rounded-xl text-center text-xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm" 
            />
          ))}
        </div>

        <button 
          onClick={handleVerify} 
          disabled={loading || otp.includes("")} 
          className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" /> Verifying...
            </>
          ) : (
            <>
              Verify Account <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            Secured by MessMate Auth
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Loading verification...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}