"use client";

import { useState, useEffect, SVGProps } from "react";
import Link from "next/link";
import { IndianRupee, QrCode, UtensilsCrossed, CreditCard, MessageSquare, ArrowRight, Users } from "lucide-react";
import API from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import AdminLayout from "@/components/admin/Sidebar";
import Toast from "@/components/student/Toast";
import { MEAL_SCHEDULE } from "@/constants";
import { HeadcountStat } from "@/types/common";
import { JSX } from "react/jsx-runtime";


export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<HeadcountStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);

  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [liveQueue, setLiveQueue] = useState(0);

  const [yesterdaysRevenue, setYesterdaysRevenue] = useState<number>(0);

  const [activeMeal, setActiveMeal] = useState<{ name: string; status: "SERVING" | "CLOSED" }>({ name: "Mess Closed", status: "CLOSED" });



  useEffect(() => {
    const checkActiveMeal = () => {
      const currentHour = new Date().getHours();
      const slot = MEAL_SCHEDULE.find(s => currentHour >= s.start && currentHour < s.end);

      if (slot) {
        const mealName = slot.type === 1 ? "Breakfast" : slot.type === 2 ? "Lunch" : "Dinner";
        setActiveMeal({ name: mealName, status: "SERVING" });
      } else {
        setActiveMeal({ name: "Mess Closed", status: "CLOSED" });
      }
    };

    checkActiveMeal();
    const timer = setInterval(checkActiveMeal, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const today = new Date()
      const yesterday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      try {
        const headcountRes = await API.get("/meal/headcount").catch(() => null);
        if (headcountRes?.data?.data) {
          setStats(headcountRes.data.data);
        }

        const complaintsRes = await API.get("/feedback/get").catch(() => null);
        if (complaintsRes?.data?.data) {
          const pending = complaintsRes.data.data.filter((c: { status: string; }) => c.status === "Pending" || c.status === "In Progress");
          setPendingComplaints(pending.length);
        }

        const queueRes = await API.get("/meal/queue-status").catch(() => null);
        if (queueRes?.data?.data) {
          setLiveQueue(queueRes.data.data.count);
        }

        const analyticsRes = await API.get(`/analytics/overview?date=${yesterday}`).catch(() => null);
        if (analyticsRes?.data?.data) {
          setYesterdaysRevenue(analyticsRes.data.data.yesterdaysRevenue || 0);
        }

      } catch (error) {
        console.error("Failed to fetch admin stats", error);
        setToast({ show: true, msg: "Failed to load dashboard metrics.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const queueInterval = setInterval(async () => {
      const queueRes = await API.get("/meal/queue-status").catch(() => null);
      if (queueRes?.data?.data) {
        setLiveQueue(queueRes.data.data.count);
      }
    }, 30000);

    return () => clearInterval(queueInterval);
  }, []);

  const getStat = (mealName: string) => stats.find(s => s.meal === mealName) || { count: 0, revenue: 0 };

  const safeRevenue = typeof yesterdaysRevenue === "number" ? yesterdaysRevenue : 0;


  return (

    <AdminLayout user={user}>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back. Here is today&apos;s mess status.</p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${activeMeal.status === "SERVING" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-sm font-bold text-gray-700">{activeMeal.name}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 shadow-sm" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-orange-200 cursor-default">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-sm">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md uppercase tracking-wider">Breakfast</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-orange-600">
                  {getStat("Breakfast").count}
                </h3>
                <p className="text-gray-500 text-sm font-medium">Expected Students</p>
              </div>
            </div>

            <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-200 cursor-default">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-sm">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">Lunch</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                  {getStat("Lunch").count}
                </h3>
                <p className="text-gray-500 text-sm font-medium">Expected Students</p>
              </div>
            </div>

            <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200 cursor-default">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-sm">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">Dinner</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-indigo-600">
                  {getStat("Dinner").count}
                </h3>
                <p className="text-gray-500 text-sm font-medium">Expected Students</p>
              </div>
            </div>

            <div className="group bg-linear-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between text-white relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-green-900/30 cursor-default">
              <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 transition-all duration-500 group-hover:scale-150 group-hover:bg-green-500/10" />
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-green-400 border border-white/10 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/20">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-green-300 bg-green-400/20 px-2 py-1 rounded-md uppercase tracking-wider">Yesterday&apos;s Revenue</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white transition-colors duration-300 group-hover:text-green-300">
                  ₹{safeRevenue.toLocaleString("en-IN")}
                </h3>
              </div>
            </div>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Access Control</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage the current meal service and student check-ins.</p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 ">
                <div className="flex items-center gap-4 ">
                  <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ">
                    <QrCode className="h-8 w-8 " />
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
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:shadow-sm"
                >
                  Display Code<ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>



          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Current Queue
                    {activeMeal.status === "SERVING" && (
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">Students checked in the last 15 mins</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {liveQueue}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h2>

              <div className="space-y-3">
                <Link href="/admin/menu-controller" className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:shadow-sm group-hover:scale-110">
                      <UtensilsCrossed className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-700 transition-colors duration-300 group-hover:text-orange-900">
                      Update Menu
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-all duration-300 group-hover:text-orange-500 group-hover:translate-x-1" />
                </Link>

                <Link href="/admin/students" className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50  hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:shadow-sm group-hover:scale-110">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-700 transition-colors duration-300 group-hover:text-purple-900">Issue Mess Card</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-all duration-300 group-hover:translate-x-1" />
                </Link>

                <Link href="/admin/inbox" className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50   hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:shadow-sm group-hover:scale-110">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-700 transition-colors duration-300 group-hover:text-blue-900">Resolve Feedback</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pendingComplaints > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {pendingComplaints} New
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function ChevronRight(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}