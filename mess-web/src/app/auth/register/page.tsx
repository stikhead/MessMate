/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, User, Hash, Phone, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Toast from "@/components/student/Toast";
import API from "@/lib/api";
import GoogleButton from "@/components/auth/GoogleButton";

const InputGroup = ({ icon: Icon, type, name, label, value, onChange, showEye, onEyeClick, eyeState }: any) => (
  <div className="relative group">
    <Icon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 pointer-events-none" />
    <input
      type={type}
      name={name}
      required
      value={value}
      onChange={onChange}
      className="block w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all peer placeholder-transparent"
      placeholder={label}
    />
    <label className="absolute left-10 -top-2.5 bg-white px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-blue-600">
      {label}
    </label>
    {showEye && (
      <button type="button" onClick={onEyeClick} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
        {eyeState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    )}
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", roll_no: "", password: "", confirmPassword: "", phoneNumber: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setToast({ message: "Passwords do not match!", type: "error" });

    setLoading(true);
    try {
      await API.post("/users/register", formData);
      setToast({ message: "OTP sent to email!", type: "success" });
      setTimeout(() => router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`), 1500);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md mb-3 text-white"><UtensilsCrossed size={24} /></div>
            <h2 className="text-2xl font-bold text-white tracking-tight">MessMate</h2>
            <p className="text-blue-100 text-xs mt-1">Student Registration Portal</p>
          </div>
        </div>

        <div className="p-8">
          <GoogleButton text="Sign up with Google" />
          <div className="relative my-6 text-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div><span className="relative bg-white px-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Or Email Signup</span></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputGroup icon={User} type="text" name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <InputGroup icon={Hash} type="text" name="roll_no" label="Roll No" value={formData.roll_no} onChange={handleChange} />
              <InputGroup icon={Phone} type="text" name="phoneNumber" label="Phone" value={formData.phoneNumber} onChange={handleChange} />
            </div>
            <InputGroup icon={Mail} type="email" name="email" label="University Email" value={formData.email} onChange={handleChange} />
            <InputGroup icon={Lock} type={showPassword ? "text" : "password"} name="password" label="Password" value={formData.password} onChange={handleChange} showEye onEyeClick={() => setShowPassword(!showPassword)} eyeState={showPassword} />
            <InputGroup icon={Lock} type="password" name="confirmPassword" label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-600/20">
              {loading ? <Loader2 className="animate-spin" /> : <>Register Now <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}