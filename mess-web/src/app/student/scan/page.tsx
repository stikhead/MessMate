/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import API from "@/lib/api";
import Link from "next/link";
import { 
  ArrowLeft, CheckCircle2, XCircle, 
  Smartphone, Loader2, ScanLine 
} from "lucide-react";
import Toast from "@/components/student/Toast";

export default function StudentScannerPage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Status states
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);

  // 1. Mobile Detection Logic
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent));
    };
    checkMobile();
  }, []);

  // 2. Handle the QR Code Scan
  const handleScan = async (scannedData: string) => {
    // Prevent multiple API calls if we are already processing a scan
    if (isProcessing || successData || errorMsg) return;

    setIsProcessing(true);
    
    try {
      // Send the payload to your backend to verify and mark meal as REDEEMED
      const res = await API.post("/meal/verify", { qrPayload: scannedData });
      
      // Play a satisfying beep sound on success
      const audio = new Audio('/beep.mp3'); // Optional: Add a short beep.mp3 to your /public folder
      audio.play().catch(() => {}); // Catch if browser blocks audio

      setSuccessData(res.data.data); // Assuming backend returns the meal details
    } catch (error: any) {
      // Vibrate phone on error if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      
      setErrorMsg(error.response?.data?.message || "Invalid or Expired QR Code");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setSuccessData(null);
    setErrorMsg(null);
  };

  // --- VIEW 1: LOADING STATE ---
  if (isMobile === null) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center" />;
  }

  // --- VIEW 2: DESKTOP BLOCKER ---
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Mobile Only Feature</h1>
          <p className="text-gray-500 mb-8">
            Please use your smartphone to scan the mess QR code. This feature requires a mobile camera.
          </p>
          <Link 
            href="/student/dashboard"
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- VIEW 3: SCANNER UI (MOBILE) ---
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-linear-to-b from-black/80 to-transparent">
        <Link href="/student/dashboard" className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="text-white font-bold tracking-widest text-sm uppercase">Scan Meal</p>
        <div className="h-10 w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 relative flex flex-col justify-center overflow-hidden">
        
        {/* If processing, show loader overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="font-bold tracking-wide">Verifying Token...</p>
          </div>
        )}

        {/* Success Screen */}
        {successData && (
          <div className="absolute inset-0 z-40 bg-green-500 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <CheckCircle2 className="h-24 w-24 text-white mb-6 drop-shadow-lg" />
            <h2 className="text-3xl font-extrabold text-white mb-2">Enjoy your meal!</h2>
            <p className="text-green-100 font-medium mb-10 text-lg">Your check-in is complete.</p>
            <button 
              onClick={resetScanner}
              className="bg-white text-green-600 font-bold px-8 py-4 rounded-2xl shadow-xl active:scale-95 transition-all w-full max-w-xs"
            >
              Scan Another
            </button>
            <Link 
              href="/student/dashboard"
              className="mt-4 text-white/80 font-bold underline underline-offset-4"
            >
              Back to Home
            </Link>
          </div>
        )}

        {/* Error Screen */}
        {errorMsg && (
          <div className="absolute inset-0 z-40 bg-red-600 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <XCircle className="h-24 w-24 text-white mb-6 drop-shadow-lg" />
            <h2 className="text-3xl font-extrabold text-white mb-2">Access Denied</h2>
            <p className="text-red-100 font-medium mb-10 text-lg">{errorMsg}</p>
            <button 
              onClick={resetScanner}
              className="bg-white text-red-600 font-bold px-8 py-4 rounded-2xl shadow-xl active:scale-95 transition-all w-full max-w-xs"
            >
              Try Again
            </button>
            <Link 
              href="/student/dashboard"
              className="mt-4 text-white/80 font-bold underline underline-offset-4"
            >
              Back to Home
            </Link>
          </div>
        )}
          {!successData && !errorMsg && (
          <div className="absolute inset-0">
            <Scanner 
              onScan={(result) => {
                // The library returns an array of results, we grab the first one
                if (result && result.length > 0) {
                  handleScan(result[0].rawValue);
                }
              }}
              components={{
                torch: true,   // Flashlight toggle button
                finder: false, // Hides the default box so we can use our custom UI
              }}
            />
          </div>
        )}

        {/* Custom Target Overlay (Visible only when scanning) */}
        {!successData && !errorMsg && !isProcessing && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
            <ScanLine className="h-64 w-64 text-white/50 animate-pulse" strokeWidth={1} />
          </div>
        )}

      </div>

      {/* Bottom Footer Info */}
      {!successData && !errorMsg && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pb-12 bg-linear-to-t from-black via-black/80 to-transparent text-center">
          <p className="text-white/80 font-medium">Point your camera at the Mess Admin&apos;s screen</p>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}