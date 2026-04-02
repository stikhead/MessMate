/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/lib/api";
import { UtensilsCrossed, GraduationCap, ShieldCheck, User, Lock, HelpCircle, AlertCircle, Loader2, EyeOff, Eye, ArrowRight, Mail, X, ChevronLeft } from "lucide-react";
import { LoginResponse, LoginFormData } from "@/types/common";
import GoogleButton from "@/components/auth/GoogleButton";
import Cookies from "js-cookie";
import Toast from "@/components/student/Toast";

type UserRole = "student" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState<LoginFormData>({
    cardNumber: "",
    password: "",
  });

  const handleSubmit = async (e?: React.FormEvent, demoEmail?: string, demoPassword?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    const emailToUse = demoEmail || formData.cardNumber;
    const passwordToUse = demoPassword || formData.password;

    if (!emailToUse.trim()) {
      setError(activeTab === "student" ? "Email is required" : "Username is required");
      setLoading(false);
      return;
    }

    if (!passwordToUse.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const payload =
        activeTab === "student"
          ? { email: emailToUse, password: passwordToUse }
          : { role: "admin", email: emailToUse, password: passwordToUse };

      const res = await API.post<LoginResponse>("/users/login", payload);
      const { accessToken, user } = res.data.data;

      Cookies.set("accessToken", accessToken, {
        expires: 7,
        secure: true,
        sameSite: "strict",
      });
      localStorage.setItem("user", JSON.stringify(user));

      if (activeTab === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Invalid credentials. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (type: 'hostel' | 'day_scholar') => {
    setActiveTab("student");
    const credentials = {
      hostel: { email: "hostel@hostel.com", password: "hostelstudent" },
      day_scholar: { email: "dayscholar@day.com", password: "dayscholar" }
    };

    const { email, password } = credentials[type];
    
    setFormData({ cardNumber: email, password: password });

    handleSubmit(undefined, email, password);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    try {
      await API.post("/users/send-otp", { email: forgotEmail });
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "Email not found.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinalReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match!");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      await API.post("/users/reset-password", {
        email: forgotEmail,
        otp: otp.join(""),
        newPassword
      });
      alert("Password reset successfully!");
      closeForgotModal();
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "Invalid OTP or request expired.");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotError("");
    setOtp(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleTabChange = (tab: UserRole) => {
    setActiveTab(tab);
    setError("");
    setFormData({ cardNumber: "", password: "" });
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
          <p className="text-blue-100 text-xl font-medium tracking-wide">
            Digital Mess Management.
          </p>
        </div>

        <div className="space-y-10 relative z-10 max-w-md">
          <div className="flex gap-5 group">
            <div className="shrink-0">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                <GraduationCap className="w-6 h-6 text-blue-100" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">For Students</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Scan QR codes to eat, cancel meals on the go, and track your wallet balance all in one place.
              </p>
            </div>
          </div>

          <div className="flex gap-5 group">
            <div className="shrink-0">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <ShieldCheck className="w-6 h-6 text-blue-100" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">For Administration</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Access powerful analytics, predict exact food preparation quantities, and minimize daily wastage.
              </p>
            </div>
          </div>
        </div>

        <p className="text-blue-200/60 text-sm font-medium relative z-10">
          © 2026 University Mess Management • MessMate
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">

          <div className="lg:hidden mb-10 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MessMate</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 font-medium">Please enter your details to sign in.</p>
          </div>

          <div className="bg-gray-100/80 p-1.5 rounded-xl mb-8 flex gap-1 shadow-inner border border-gray-200/60">
            <button
              type="button"
              onClick={() => handleTabChange("student")}
              className={`flex-1 rounded-lg py-3 text-sm font-bold hover:cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "student"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              <User className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("admin")}
              className={`flex-1 rounded-lg py-3 text-sm hover:cursor-pointer font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "admin"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Administration
            </button>
          </div>

          <div className="space-y-5">
            {activeTab === "student" && (
              <>
                <GoogleButton text="Sign in with Google" />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin('hostel')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-blue-50 bg-blue-50/50 rounded-2xl hover:bg-blue-100 hover:border-blue-200 transition-all group active:scale-[0.98] hover:cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Hostel Student Demo</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin('day_scholar')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl hover:bg-indigo-100 hover:border-indigo-200 transition-all group active:scale-[0.98] hover:cursor-pointer disabled:opacity-50"
                  >
    
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Day Scholar Demo</span>
                  </button>
                </div>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <span className="relative bg-white px-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    Or sign in with email
                  </span>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 text-gray-400 group-focus-within:text-blue-500">
                {activeTab === "student" ? <Mail className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <input
                type="text"
                name="cardNumber"
                id="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={activeTab === "student" ? "Email Address" : "Admin Username"}
                className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all peer placeholder-transparent shadow-sm"
              />
              <label
                htmlFor="cardNumber"
                className="absolute left-11 -top-2.5 bg-white px-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:bg-white pointer-events-none"
              >
                {activeTab === "student" ? "Email Address" : "Admin Username"}
              </label>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 text-gray-400 group-focus-within:text-blue-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Password"
                  className="block w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all peer placeholder-transparent shadow-sm"
                />
                <label
                  htmlFor="password"
                  className="absolute left-11 -top-2.5 bg-white px-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:bg-white pointer-events-none"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {activeTab === 'student' && (
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:cursor-pointer hover:underline transition-all"
                  >
                    Forgot password?
                  </button>
                </div>)}
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:cursor-pointer  hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          {activeTab === "student" && (
            <div className="mt-8 text-center border-t border-gray-200/60 pt-6">
              <p className="text-gray-500 font-medium">
                New to MessMate?{" "}
                <Link href="/auth/register" className="text-blue-600 font-extrabold hover:text-blue-700 hover:underline transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
              <div className="flex items-center gap-2">
                {forgotStep === 2 && (
                  <button onClick={() => setForgotStep(1)} className="p-1 hover:bg-gray-100 hover:cursor-pointer rounded-lg text-gray-400">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h3 className="text-xl font-extrabold text-gray-900">
                  {forgotStep === 1 ? "Reset Password" : "New Password"}
                </h3>
              </div>
              <button onClick={closeForgotModal} className="p-2 hover:bg-gray-100 hover:cursor-pointer rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={forgotStep === 1 ? handleSendOtp : handleFinalReset} className="p-8 space-y-6">
              <p className="text-gray-500 text-sm font-medium">
                {forgotStep === 1
                  ? "Enter your university email address to receive a 6-digit reset code."
                  : `Enter the code sent to ${forgotEmail} and set your new password.`}
              </p>

              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{forgotError}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="University Email"
                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        ref={(el) => { otpRefs.current[idx] = el; }}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-11 h-13 border-2 border-gray-200 rounded-xl text-center text-lg font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input type={showNewPass ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" 
                      className="block w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                      >
                        {showNewPass ? <EyeOff size={18} className="h-5 w-5" /> : <Eye size={18} className="h-5 w-5" />}
                      </button>

                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" 
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:cursor-pointer hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 group"
              >
                {forgotLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {forgotStep === 1 ? "Send Reset Code" : "Update Password"} <ArrowRight size={18} className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <button
        type="button"
        className="fixed bottom-6 right-6 p-3.5 bg-gray-900 text-white rounded-full shadow-xl hover:bg-black hover:scale-105 transition-all focus:ring-4 focus:ring-gray-300 hover:cursor-pointer"
        aria-label="Help"
        title="Need Help?"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
}