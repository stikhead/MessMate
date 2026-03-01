// src/app/auth/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { 
  User, Mail, Lock, Hash, Loader2, ArrowRight, 
  UtensilsCrossed, Phone, Eye, EyeOff, AlertCircle, CheckCircle2 
} from "lucide-react";
import Toast from "@/components/student/Toast"; 
// import { RegisterFormData } from "@/types/common";
// import { getErrorMessage } from "@/lib/error-handler";

// --- EXTRACTED COMPONENT TO FIX FOCUS BUG ---
// interface InputGroupProps {
//   icon: React.ElementType;
//   type: string;
//   name: string;
//   label: string;
//   value: string;
//   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   showEye?: boolean;
//   eyeState?: boolean;
//   onEyeClick?: () => void;
// }

// const InputGroup = ({ icon: Icon, type, name, label, value, onChange, showEye, onEyeClick, eyeState }: InputGroupProps) => (
//   <div className="relative group">
//     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 text-gray-400 group-focus-within:text-blue-500">
//       <Icon className="h-5 w-5" />
//     </div>
//     <input
//       type={type}
//       name={name}
//       id={name}
//       required
//       value={value}
//       onChange={onChange}
//       className="block w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all peer placeholder-transparent"
//       placeholder={label}
//     />
//     <label 
//       htmlFor={name}
//       className="absolute left-10 -top-2.5 bg-white px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:bg-white cursor-text"
//     >
//       {label}
//     </label>
    
//     {showEye && (
//       <button
//         type="button"
//         onClick={onEyeClick}
//         className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
//       >
//         {eyeState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//       </button>
//     )}
//   </div>
// );
// ---------------------------------------------

export default function RegisterPage() {
  // const router = useRouter();
  // const [loading, setLoading] = useState(false);
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  // const [formData, setFormData] = useState<RegisterFormData>({
  //   fullName: "",
  //   email: "",
  //   roll_no: "",
  //   password: "",
  //   confirmPassword: "",
  //   phoneNumber: ""
  // });

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  // const handleSubmit = async (e: React.SyntheticEvent) => {
  //   e.preventDefault();

  //   if (formData.password !== formData.confirmPassword) {
  //     setToast({ show: true, message: "Passwords do not match!", type: "error" });
  //     return;
  //   }
  //   if ((formData?.password?.length || 0) < 6) {
  //     setToast({ show: true, message: "Password must be at least 6 characters.", type: "error" });
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     await API.post("/users/register", {
  //       fullName: formData.fullName,
  //       email: formData.email,
  //       roll_no: formData.roll_no,
  //       phoneNumber: formData.phoneNumber,
  //       password: formData.password,
  //     });

  //     setToast({ 
  //       show: true, 
  //       message: "Account created! Redirecting to login...", 
  //       type: "success" 
  //     });
      
  //     setTimeout(() => {
  //       router.push("/auth/login");
  //     }, 1500);

  //   } catch (error) {
  //     const message = getErrorMessage(error, "Failed to submit response");
  //     setToast({ show: true, message, type: "error" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const currentPassword = formData.password || "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
           <div className="relative z-10 flex flex-col items-center">
             <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 text-white shadow-inner border border-white/20">
               <UtensilsCrossed className="h-7 w-7" />
             </div>
             <h2 className="text-3xl font-extrabold text-white tracking-tight">MessMate</h2>
             <p className="text-blue-100 text-sm mt-1.5 font-medium">Join the student portal</p>
           </div>
        </div>

        <div className="p-8">

           <p>DISABLED</p>
          {/*
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputGroup icon={User} type="text" name="fullName" label="Full Name" value={formData.fullName || ""} onChange={handleChange} />
            <InputGroup icon={Hash} type="text" name="roll_no" label="Roll Number" value={formData.roll_no || ""} onChange={handleChange} />
            <InputGroup icon={Phone} type="text" name="phoneNumber" label="Phone Number" value={formData.phoneNumber || ""} onChange={handleChange} />
            <InputGroup icon={Mail} type="email" name="email" label="Email Address" value={formData.email || ""} onChange={handleChange} />
            
            <div className="pt-2">
              <InputGroup 
                icon={Lock} 
                type={showPassword ? "text" : "password"} 
                name="password" 
                label="Password" 
                value={currentPassword} 
                onChange={handleChange} 
                showEye={true}
                eyeState={showPassword}
                onEyeClick={() => setShowPassword(!showPassword)}
              />
              <div className="h-4 mt-1 pl-2">
                {currentPassword.length > 0 && currentPassword.length < 6 && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Minimum 6 characters required
                  </span>
                )}
                {currentPassword.length >= 6 && (
                  <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Password length is good!
                  </span>
                )}
              </div>
            </div>

            <InputGroup 
              icon={Lock} 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirmPassword" 
              label="Confirm Password" 
              value={formData.confirmPassword || ""} 
              onChange={handleChange} 
              showEye={true}
              eyeState={showConfirmPassword}
              onEyeClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <button
              type="submit"
              disabled={loading || (currentPassword.length > 0 && currentPassword.length < 6)}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Register Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form> 
*/}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-sm font-medium"> 
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 font-extrabold hover:text-blue-700 hover:underline transition-colors">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}