/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Hash, Phone, Loader2, ArrowRight, ShieldCheck, UtensilsCrossed } from "lucide-react";
import API from "@/lib/api";
import Toast from "@/components/student/Toast";

const InputGroup = ({ icon: Icon, type, name, label, value, onChange }: any) => (
  <div className="relative group">
    <Icon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
    <input
      type={type}
      name={name}
      required
      value={value}
      onChange={onChange}
      className="block w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all peer placeholder-transparent shadow-sm"
      placeholder={label}
    />
    <label className="absolute left-10 -top-2.5 bg-white px-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:bg-white">
      {label}
    </label>
  </div>
);

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState("");
  const [formData, setFormData] = useState({ fullName: "", roll_no: "", phoneNumber: "" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const handleGoogleAuth = async () => {
      if (!code) {
        return router.replace("/auth/register");
      }

      try {
        const res = await API.post("/users/google-auth", { code });
        
        if (res.data.data.isNewUser) {
          setOnboardingToken(res.data.data.onboardingToken);
          setIsNewUser(true);
          setLoading(false);
        } else {
          const { user } = res.data.data;
        

         
          localStorage.setItem("user", JSON.stringify(user));
          
          setToast({ message: "Welcome back!", type: "success" });
          setTimeout(() => router.push("/student/dashboard"), 1000);
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        setToast({ message: "Google authentication failed", type: "error" });
        setTimeout(() => router.push("/auth/login"), 2000);
      }
    };

    handleGoogleAuth();
  }, [code, router]);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/users/google-finalize", { 
        onboardingToken, 
        ...formData 
      });
      
      const { user } = res.data.data;
    
      localStorage.setItem("user", JSON.stringify(user));
      
      setToast({ message: "Profile created! Welcome to MessMate.", type: "success" });
      setTimeout(() => router.push("/student/dashboard"), 1500);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to save profile", type: "error" });
      setLoading(false);
    }
  };

  if (loading && !isNewUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">
            Verifying with Google...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md mb-3 text-white shadow-lg">
              <UtensilsCrossed size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">MessMate</h2>
            <p className="text-blue-100 text-xs mt-1">University Student Registration</p>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider mb-4 border border-green-100">
              <ShieldCheck size={14} /> Identity Verified
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Finish Setting Up</h3>
            <p className="text-gray-500 text-sm font-medium mt-1">We just need a few more details to create your mess account.</p>
          </div>

          <form onSubmit={handleFinalize} className="space-y-5">
            <InputGroup 
              icon={User} 
              type="text" 
              name="fullName" 
              label="Full Name" 
              value={formData.fullName} 
              onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} 
            />
            
            <InputGroup 
              icon={Hash} 
              type="text" 
              name="roll_no" 
              label="Roll Number (CUH)" 
              value={formData.roll_no} 
              onChange={(e: any) => setFormData({...formData, roll_no: e.target.value})} 
            />

            <InputGroup 
              icon={Phone} 
              type="text" 
              name="phoneNumber" 
              label="Phone Number" 
              value={formData.phoneNumber} 
              onChange={(e: any) => setFormData({...formData, phoneNumber: e.target.value})} 
            />

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 hover:cursor-pointer transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Complete Registration <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}