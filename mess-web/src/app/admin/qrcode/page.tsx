"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react"; 
import API from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AdminLayout from "@/components/admin/Sidebar";
import { useUser } from "@/hooks/useUser";

export default function QRDisplayPage() {
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const { user } = useUser();
  const [loading, setLoading] = useState(Boolean);
 
  const fetchQR = useCallback(async () => {
    try {
      setLoading(true)  
      const res = await API.get("/meal/qrcode"); 
      
      const payload = res.data.data.qrPayload;
      const exactExpiration = res.data.data.expiresAt; 
      
      setQrPayload(payload);
      setExpiresAt(exactExpiration); 
    } catch (error) {
      console.error("Failed to generate QR:", error);
    } finally {
        setLoading(false)
    }
  }, []);

  useEffect(() => {
    if (!expiresAt) {
      const loadInitialQR = async () => {
        await fetchQR();
      };
      loadInitialQR();
      return; 
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remainingSeconds = Math.ceil((expiresAt - now) / 1000);

      if (remainingSeconds <= 0) {
        setCountdown(0);
        void fetchQR(); 
      } else {
        setCountdown(remainingSeconds);
      }
    }, 500); 

    return () => clearInterval(timer);
  }, [expiresAt, fetchQR]);

    if (loading) {
      return (
         <AdminLayout user={user}>
        <div className="min-h-screen bg-gray-50">
         
          <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading Dashboard...</p>
            </div>
          </div>
        </div>
        </AdminLayout>
      );
    }
  
  return (
    <AdminLayout user={user}>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative p-4 bg-gray-50 selection:bg-transparent">
        
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white p-10 sm:p-12 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center max-w-md w-full">
          
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <ShieldCheck className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Scan to Eat</h1>
          </div>

          <div className="bg-white p-4 rounded-2xl border-4 border-gray-100 shadow-sm relative">
            {qrPayload ? (
              <QRCodeSVG 
                value={qrPayload} 
                size={280}
                level="H" 
                className="rounded-lg"
              />
            ) : (
              <div className="w-70 h-70 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
                <p className="text-gray-400 font-medium">Generating secure QR...</p>
              </div>
            )}
          </div>

          <div className="w-full mt-10">
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Auto-Refreshes In
              </p>
              <span className="text-xl font-bold text-gray-900 font-mono">
                00:{countdown?.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-linear"
                style={{ width: `${(countdown! / 30) * 100}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}