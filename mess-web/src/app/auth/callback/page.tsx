/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Hash, Phone, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import API from "@/lib/api";
import Toast from "@/components/student/Toast";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", roll_no: "", phoneNumber: "" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => { 
    if (!code) router.push("/auth/register"); 
  }, [code, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/users/google-signup-finalize", { code, ...formData });
      setToast({ message: "Welcome to MessMate!", type: "success" });
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      console.log(err)
      setToast({ message: "Profile update failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Finish Setting Up</h2>
          <p className="text-gray-500 text-sm mt-1">We need your university details to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
                required 
                value={formData.fullName} 
                onChange={(e)=>setFormData({...formData, fullName: e.target.value})} 
                className="block w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                placeholder="Full Name" 
            />
          </div>
          
          <div className="relative">
            <Hash className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
                required 
                value={formData.roll_no} 
                onChange={(e)=>setFormData({...formData, roll_no: e.target.value})} 
                className="block w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                placeholder="Roll Number (CUH)" 
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
                required 
                value={formData.phoneNumber} 
                onChange={(e)=>setFormData({...formData, phoneNumber: e.target.value})} 
                className="block w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                placeholder="Phone Number" 
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-6">
            {loading ? <Loader2 className="animate-spin" /> : <>Complete Profile <ArrowRight size={16} /></>}
          </button>
        </form>
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