"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import Cookies from "js-cookie";
import { UtensilsCrossed, GraduationCap, ShieldCheck, User, Lock, HelpCircle, AlertCircle } from "lucide-react";
import { LoginResponse, LoginFormData } from "@/types/common";

type UserRole = "student" | "admin";



export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<LoginFormData>({
    cardNumber: "",
    password: "",
  });

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.cardNumber.trim()) {
      setError(activeTab === "student" ? "Card number is required" : "Username is required");
      setLoading(false);
      return;
    }


    if (!formData.password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const payload =
        activeTab === "student"
          ? { email: formData.cardNumber,
              password: formData.password }
          : { role: "admin", 
              email: formData.cardNumber,
              password: formData.password };

      const res = await API.post<LoginResponse>("/users/login", payload);
      const { accessToken, user } = res.data.data;

      Cookies.set("accessToken", accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleTabChange = (tab: UserRole) => {
    setActiveTab(tab);
    setError("");
    setFormData({
      cardNumber: "",
      password: "",
    });
  };

  return (
    <div className="min-h-screen flex bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">MessMate</h1>
          </div>
          <p className="text-blue-100 text-lg font-light">
            University Mess Management
          </p>
        </div>
        <div className="space-y-8 relative z-10">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">For Students</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Check daily menus, report issues, and track your meal attendance
                with QR scanning.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">For Admins</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Manage vendors, analyze demand patterns, and resolve complaints
                efficiently.
              </p>
            </div>
          </div>
        </div>

        <p className="text-blue-200 text-sm relative z-10">
          © 2026 University Mess Management System
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MessMate</h1>
            </div>
            <p className="text-gray-600 text-sm">University Mess Management</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Please login to access your account</p>
          </div>

          <div className="bg-gray-100 p-1 rounded-lg mb-6 flex gap-1">
            <button
              type="button"
              onClick={() => handleTabChange("student")}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "student"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <User className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("admin")}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "admin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {activeTab === "student" ? (
              <>
                <div>
                  <label
                    htmlFor="cardNumber"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email or Card Number
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your card number"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>

              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="cardNumber"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading
                ? "Logging in..."
                : `Login as ${activeTab === "student" ? "Student" : "Admin"}`}
            </button>
          </form>

          
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all focus:ring-4 focus:ring-blue-300"
        aria-label="Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
}