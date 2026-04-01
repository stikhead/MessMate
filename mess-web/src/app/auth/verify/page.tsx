"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import API from "@/lib/api";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) (document.getElementById(`otp-${index + 1}`) as HTMLElement)?.focus();
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await API.post("/users/verify-email", { email, code: otp.join("") });
      router.push("/auth/login?verified=true");
    } catch (err) {
      alert("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center">
        <ShieldCheck className="h-16 w-16 text-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold">Verify Your Email</h2>
        <p className="text-gray-500 text-sm mt-2 mb-10">We sent a 6-digit code to <br/><b>{email}</b></p>
        
        <div className="flex gap-2 justify-center mb-10">
          {otp.map((digit, idx) => (
            <input key={idx} id={`otp-${idx}`} type="text" maxLength={1} value={digit} onChange={e => handleChange(e.target.value, idx)} className="w-12 h-14 border-2 border-gray-100 rounded-xl text-center text-xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" />
          ))}
        </div>

        <button onClick={handleVerify} disabled={loading || otp.includes("")} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : "Verify Account"}
        </button>
      </div>
    </div>
  );
}