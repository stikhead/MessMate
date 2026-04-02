/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, User, Hash, Phone, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";
import Toast from "@/components/student/Toast";
import API from "@/lib/api";
import GoogleButton from "@/components/auth/GoogleButton";

const InputGroup = ({ icon: Icon, type, name, label, value, onChange, showEye, onEyeClick, eyeState }: any) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 text-gray-400 group-focus-within:text-blue-500">
      <Icon className="h-5 w-5" />
    </div>
    <input
      type={type}
      name={name}
      required
      value={value}
      onChange={onChange}
      className="block w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all peer placeholder-transparent shadow-sm"
      placeholder={label}
    />
    <label className="absolute left-11 -top-2.5 bg-white px-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:bg-white">
      {label}
    </label>
    {showEye && (
      <button
        type="button"
        onClick={onEyeClick}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
      >
        {eyeState ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    )}
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [formData, setFormData] = useState({ 
    fullName: "", 
    email: "", 
    roll_no: "", 
    password: "", 
    confirmPassword: "", 
    phoneNumber: "" 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => 
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (email: string) => {
    try {
      await API.post("/users/send-otp", { email });
      setToast({ message: "Verification code sent to your email!", type: "success" });
      setTimeout(() => 
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`), 1500
      );
    } catch (err: any) {
      setToast({ 
        message: err.response?.data?.message || "Failed to send OTP.", 
        type: "error" 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setToast({ message: "Passwords do not match!", type: "error" });
    }

    setLoading(true);
    try {
      await API.post("/users/register", formData);
      setToast({ message: "Registration successful! OTP sent.", type: "success" });
      setTimeout(() => 
        router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`), 1500
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "";
      
      if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("already exists")) {
        setToast({ message: "User exists. Re-sending verification code...", type: "success" });
        await handleSendOtp(formData.email);
      } else {
        setToast({ message: errorMessage || "Registration failed.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900 text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">MessMate</h1>
          </div>
          <p className="text-blue-100 text-xl font-medium tracking-wide">Join the future of campus dining.</p>
        </div>

        <div className="space-y-10 relative z-10 max-w-md">
          <div className="flex gap-5 group">
            <div className="shrink-0">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                <GraduationCap className="w-6 h-6 text-blue-100" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">Centralized Dining</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">Register once and manage your meals, balances, and feedback across the entire university.</p>
            </div>
          </div>

          <div className="flex gap-5 group">
            <div className="shrink-0">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <ShieldCheck className="w-6 h-6 text-blue-100" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">Verified Security</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">Secure registration with your university credentials and biometric-ready authentication.</p>
            </div>
          </div>
        </div>

        <p className="text-blue-200/60 text-sm font-medium relative z-10">
          © 2026 University Mess Management • MessMate
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          
          <div className="lg:hidden mb-10 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MessMate</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Create Account</h2>
            <p className="text-gray-500 font-medium">Join MessMate to manage your university meals.</p>
          </div>

          <div className="space-y-6">
            <GoogleButton text="Sign up with Google" />
            
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative bg-gray-50 px-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                Or fill your details
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputGroup 
                icon={User} 
                type="text" 
                name="fullName" 
                label="Full Name" 
                value={formData.fullName} 
                onChange={handleChange} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                  icon={Hash} 
                  type="text" 
                  name="roll_no" 
                  label="Roll No" 
                  value={formData.roll_no} 
                  onChange={handleChange} 
                />
                <InputGroup 
                  icon={Phone} 
                  type="text" 
                  name="phoneNumber" 
                  label="Phone" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                />
              </div>

              <InputGroup 
                icon={Mail} 
                type="email" 
                name="email" 
                label="University Email" 
                value={formData.email} 
                onChange={handleChange} 
              />
              
              <InputGroup 
                icon={Lock} 
                type={showPassword ? "text" : "password"} 
                name="password" 
                label="Password" 
                value={formData.password} 
                onChange={handleChange} 
                showEye 
                onEyeClick={() => setShowPassword(!showPassword)} 
                eyeState={showPassword} 
              />
              
              <InputGroup 
                icon={Lock} 
                type="password" 
                name="confirmPassword" 
                label="Confirm Password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
              />

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:cursor-pointer hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-4 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" /> Processing...
                  </>
                ) : (
                  <>
                    Register Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-200/60 pt-6">
              <p className="text-gray-500 font-medium">
                Already have an account?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-blue-600 font-extrabold hover:text-blue-700 hover:underline transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}