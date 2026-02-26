
"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import API from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ScanLine, Clock, Smartphone } from "lucide-react";
import Toast from "@/components/student/Toast";
import { getErrorMessage } from "@/lib/error-handler";
import { MealToken } from "@/types/common";

export default function StudentScannerPage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isServingTime, setIsServingTime] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<MealToken | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent));
    };
    checkMobile();
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const h = new Date().getHours();

      const isBreakfast = h >= 8 && h < 9;
      const isLunch = h >= 13 && h < 14;
      const isDinner = h >= 20 && h < 21;

      setIsServingTime(isBreakfast || isLunch || isDinner);
    };

    checkTime();

    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (scannedData: string) => {
    if (isProcessing || successData || errorMsg) return;

    setIsProcessing(true);

    try {
      const res = await API.post(`/meal/verify?scannedPayload=${scannedData}`);

      const audio = new Audio('/beep.mp3');
      audio.play().catch(() => { });

      setSuccessData(res.data.data);
    } catch (error) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      const message = getErrorMessage(error, "Invalid or Expired QR Code");
      setToast({ show: true, msg: message, type: "error" });

    } finally {

      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setSuccessData(null);
    setErrorMsg(null);
  };

  if (isMobile === null || isServingTime === null) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center" />;
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Mobile Only Feature</h1>
          <p className="text-gray-500 mb-8">
            Please use your smartphone to scan the mess QR code.
          </p>
          <Link href="/student/dashboard" className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isServingTime) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-700">
          <div className="h-20 w-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/30">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Mess is Closed</h1>
          <p className="text-gray-400 mb-6 text-sm">
            The scanner is only active during serving hours:
          </p>
          <div className="bg-gray-900 rounded-xl p-4 text-left space-y-2 mb-8 border border-gray-700">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Breakfast</span><span className="text-white font-bold">8:00 - 9:00 AM</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Lunch</span><span className="text-white font-bold">1:00 - 2:00 PM</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Dinner</span><span className="text-white font-bold">8:00 - 9:00 PM</span></div>
          </div>
          <Link href="/student/dashboard" className="w-full bg-white text-gray-900 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors block">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-linear-to-b from-black/80 to-transparent">
        <Link href="/student/dashboard" className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="text-white font-bold tracking-widest text-sm uppercase flex items-center gap-2">
          <ScanLine className="h-4 w-4" /> Scan Meal
        </p>
        <div className="h-10 w-10" />
      </div>

      <div className="flex-1 relative flex flex-col justify-center overflow-hidden">

        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="font-bold tracking-wide">Verifying Token...</p>
          </div>
        )}

        {successData && (
          <div className="absolute inset-0 z-40 bg-green-500 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <CheckCircle2 className="h-24 w-24 text-white mb-6 drop-shadow-lg" />
            <h2 className="text-3xl font-extrabold text-white mb-2">Enjoy your meal!</h2>
            <p className="text-green-100 font-medium mb-10 text-lg">Your check-in is complete.</p>
            <button onClick={resetScanner} className="bg-white text-green-600 font-bold px-8 py-4 rounded-2xl shadow-xl active:scale-95 transition-all w-full max-w-xs mb-4">
              Scan Another
            </button>
            <Link href="/student/dashboard" className="text-white/80 font-bold underline underline-offset-4">
              Back to Home
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 z-40 bg-red-600 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <XCircle className="h-24 w-24 text-white mb-6 drop-shadow-lg" />
            <h2 className="text-3xl font-extrabold text-white mb-2">Access Denied</h2>
            <p className="text-red-100 font-medium mb-10 text-lg">{errorMsg}</p>
            <button onClick={resetScanner} className="bg-white text-red-600 font-bold px-8 py-4 rounded-2xl shadow-xl active:scale-95 transition-all w-full max-w-xs mb-4">
              Try Again
            </button>
            <Link href="/student/dashboard" className="text-white/80 font-bold underline underline-offset-4">
              Back to Home
            </Link>
          </div>
        )}

        {!successData && !errorMsg && (
          <div className="absolute inset-0">
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) handleScan(result[0].rawValue);
              }}
              components={{ torch: true, finder: false }}
            />
          </div>
        )}

        {!successData && !errorMsg && !isProcessing && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
            <ScanLine className="h-64 w-64 text-white/50 animate-pulse" strokeWidth={1} />
          </div>
        )}
      </div>

      {!successData && !errorMsg && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pb-12 bg-linear-to-t from-black via-black/80 to-transparent text-center flex flex-col items-center">
          <p className="text-white/80 font-medium mb-2">Point your camera at the Mess Admin&apos;s screen</p>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            Active Serving Hours
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}