"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IndianRupee, QrCode, UtensilsCrossed, CreditCard, MessageSquare, AlertCircle, ArrowRight} from "lucide-react";
import API from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import AdminLayout from "@/components/admin/Sidebar"; 
import Toast from "@/components/student/Toast";


interface HeadcountStat {
  meal: "Breakfast" | "Lunch" | "Dinner";
  count: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<HeadcountStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/meal/headcount"); 
        setStats(res.data.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
        setToast({ show: true, msg: "Failed to load dashboard metrics.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStat = (mealName: string) => stats.find(s => s.meal === mealName) || { count: 0, revenue: 0 };
  const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <AdminLayout user={user}>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Super Admin. Here is today&apos;s mess status.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 shadow-sm" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md uppercase tracking-wider">Breakfast</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{getStat("Breakfast").count}</h3>
                <p className="text-gray-500 text-sm font-medium">Expected Students</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">Lunch</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{getStat("Lunch").count}</h3>
                <p className="text-gray-500 text-sm font-medium">Expected Students</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">Dinner</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{getStat("Dinner").count}</h3>
                <p className="text-gray-500 text-sm font-medium">Expected Students</p>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-green-400 border border-white/10 backdrop-blur-sm">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-green-300 bg-green-400/20 px-2 py-1 rounded-md uppercase tracking-wider">Today&apos;s Revenue</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString("en-IN")}</h3>
                
              </div>
            </div>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-black-500 font-bold">Manage the current meal service and student check-ins.</p>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                  <QrCode className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Staff QR Display</h3>
                  <p className="text-sm text-gray-600 mt-1 max-w-sm">
                    Live QR code screen for students to scan and verify their meal tokens at the counter.
                  </p>
                </div>
              </div>
              <Link 
                href="/admin/qrcode" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Display Code<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link href="/admin/menu-controller" className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-orange-900">Update Menu</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500" />
              </Link>

              <Link href="/admin/students" className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-purple-900">Issue Mess Card</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500" />
              </Link>

              <Link href="/admin/inbox" className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all relative">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-blue-900">Resolve Feedback</span>
                </div>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                  4
                </span>
              </Link>
            </div>
          </div>

        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Insights Preview</h2>
                    <p className="text-gray-500 text-sm mt-1">Based on recent operations.</p>
                </div>
            </div>
            
            <div className="flex items-center justify-center h-32 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Analytics will appear here.
                </p>
            </div>
        </div>

      </div>
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}