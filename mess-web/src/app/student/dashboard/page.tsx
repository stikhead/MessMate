"use client";

import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";
import { UtensilsCrossed, CalendarDays, Clock, Coffee, Sun, Moon, TrendingUp, Calendar, Wallet, LucideAlarmCheck } from "lucide-react";

import Navbar from "@/components/student/Navbar";
import StatsCard from "@/components/student/statsCard";
import MenuRow from "@/components/student/MenuRow";
import Toast from "@/components/student/Toast";
import { useUser } from "@/hooks/useUser";

const MEAL_SCHEDULE = [
  { type: 1, start: 8, end: 9, status: "SERVING" },
  { type: 1, start: 0, end: 8, status: "UPCOMING" },
  { type: 2, start: 13, end: 14, status: "SERVING" },
  { type: 2, start: 9, end: 13, status: "UPCOMING" },
  { type: 3, start: 20, end: 21, status: "SERVING" },
  { type: 3, start: 14, end: 20, status: "UPCOMING" },
] as const;


function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center flex-1">
      <div className="flex h-14 sm:h-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-2xl sm:text-3xl font-bold shadow-sm border border-white/20">
        {value}
      </div>
      <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-wide text-white/80 font-bold">
        {label}
      </p>
    </div>
  );
}

interface MenuItem {
  _id: string;
  mealType: number;
  items: string;
  price: number;
}

interface MealToken {
  tokenId: string;
  mealType: number;
  status: string;
  cost: number;
}

interface UserStats {
  mealsThisWeek: number;
  totalMeals: number;
  attendanceRate: number;
}

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}


export default function StudentDashboard() {

  const { user, loading: userLoading } = useUser();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealToken, setMealToken] = useState<MealToken | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [timeLeft, setTimeLeft] = useState({
    hours: "-1",
    minutes: "00",
    seconds: "00"
  });

  const [stats] = useState<UserStats>({
    mealsThisWeek: 18,
    totalMeals: 21,
    attendanceRate: 86
  });

  const [activeMeal, setActiveMeal] = useState<{
    meal: MenuItem | null;
    status: "SERVING" | "UPCOMING" | "CLOSED";
    targetTime: Date | null;
  }>({ meal: null, status: "CLOSED", targetTime: null });

  const calculateMealState = useCallback((menuItems: MenuItem[]) => {
    const now = new Date();
    const currentHour = now.getHours();

    const findItem = (type: number) => menuItems.find(m => m.mealType === type) || null;

    const slot = MEAL_SCHEDULE.find(s => currentHour >= s.start && currentHour < s.end);

    if (slot) {

      const target = new Date();
      target.setHours(slot.end, 0, 0, 0);

      return {
        meal: findItem(slot.type),
        status: slot.status,
        targetTime: target
      };
    }

    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(8, 0, 0, 0);

    return {
      meal: findItem(1),
      status: "UPCOMING" as const,
      targetTime: target
    };

  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const dayIndex = today.getDay();

        const menuRes = await API.get(`/menu/getMenu?day=${dayIndex}&mealType=0`);

        const menuData = Array.isArray(menuRes.data.data) ? menuRes.data.data : [menuRes.data.data];
        const validMenu = menuData.filter((item: MenuItem) => item !== null);
        setMenu(validMenu);

        const initialState = calculateMealState(validMenu);
        setActiveMeal(initialState);


        if (initialState.meal) {
          const mealTokenRes = await API.get(
            `/meal/get-token?day=${dayIndex}&mealType=${initialState.meal.mealType}`
          ).catch(() => null);

          setMealToken(mealTokenRes?.data?.data || null);
        }

      } catch (error) {
        console.error("Dashboard Error:", error);
        setToast({ show: true, message: "Failed to load dashboard data.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [calculateMealState]);


  useEffect(() => {
    const timer = setInterval(() => {
      if (!activeMeal.targetTime) return;

      const now = new Date();
      const diff = activeMeal.targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        const newState = calculateMealState(menu);
        setActiveMeal(newState);
        return;
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeMeal, menu, calculateMealState]);


  const getMealName = (type: number) => {
    if (type === 1) return "Breakfast";
    if (type === 2) return "Lunch";
    if (type === 3) return "Dinner";
    return "Mess Closed";
  };

  const getMealTimeDisplay = (type: number) => {
    if (type === 1) return "8:00 AM - 9:00 AM";
    if (type === 2) return "1:00 PM - 2:00 PM";
    if (type === 3) return "8:00 PM - 9:00 PM";
    return "";
  };


  if (loading || userLoading || timeLeft.hours === '-1') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="w-full mx-auto max-w-6xl px-4 sm:px-6 py-6">

        <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg transition-colors duration-500 ${activeMeal.status === "SERVING"
            ? "bg-linear-to-br from-green-600 to-emerald-700"
            : "bg-linear-to-br from-blue-600 to-indigo-700"
          }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />

          {activeMeal.meal ? (
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {activeMeal.status === "SERVING" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider border border-white/20 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Live
                      </span>
                    )}
                    <span className="text-blue-100 font-medium text-sm">
                      {activeMeal.status === "SERVING" ? "Currently Serving" : "Next Meal"}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                    {getMealName(activeMeal.meal.mealType)}
                  </h2>
                  <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
                    <Clock className="h-3.5 w-3.5" />
                    {getMealTimeDisplay(activeMeal.meal.mealType)}
                  </div>
                </div>

                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
                  {activeMeal.meal.mealType === 1 ? <Coffee className="h-7 w-7" />
                    : activeMeal.meal.mealType === 2 ? <Sun className="h-7 w-7" />
                      : <Moon className="h-7 w-7" />}
                </div>
              </div>

              <div className="rounded-xl bg-black/10 p-5 backdrop-blur-sm border border-white/10 mb-6">
                <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">
                  On the Menu
                </p>
                <h3 className="text-lg sm:text-xl font-medium leading-relaxed">
                  {activeMeal.meal.items.split(",").join(" • ")}
                </h3>
              </div>
              <div className="border-t border-white/20 pt-5">
                <div className="flex items-center gap-2 mb-4 text-white/80 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    {activeMeal.status === "SERVING"
                      ? "Service Ends In"
                      : "Service Starts In"}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <TimeUnit value={timeLeft.hours} label="Hours" />
                  <span className="text-2xl font-bold opacity-50 pb-4">:</span>
                  <TimeUnit value={timeLeft.minutes} label="Mins" />
                  <span className="text-2xl font-bold opacity-50 pb-4">:</span>
                  <TimeUnit value={timeLeft.seconds} label="Secs" />
                </div>
              </div>

            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center">
              <Moon className="h-12 w-12 text-white/50 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Mess Closed</h2>
              <p className="text-white/80 text-sm">See you tomorrow!</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <StatsCard title="Meals This Week" value={stats.mealsThisWeek} subValue={`/${stats.totalMeals}`} icon={<Calendar />} color="green" />
          <StatsCard title="Attendance" value={`${stats.attendanceRate}%`} icon={<TrendingUp />} color="blue" />
          <StatsCard title="Balance" value={`₹${user?.currentBalance || 0}`} icon={<Wallet />} color="orange" />
          <StatsCard title="Status" value={mealToken?.status || "Not Booked"} icon={<LucideAlarmCheck />} color={mealToken ? "green" : "gray"} />
        </div>

        {/* --- FULL MENU --- */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 mt-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-400" />
            Todays Complete Menu
          </h3>

          <div className="space-y-3">
            {[1, 2, 3].map((type) => {
              const item = menu.find((m) => m.mealType === type);
              if (!item) return null;

              const isActive = activeMeal.meal?.mealType === type;

              return (
                <MenuRow
                  key={type}
                  icon={type === 1 ? <Coffee className="h-5 w-5 text-orange-600" /> : type === 2 ? <Sun className="h-5 w-5 text-blue-600" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                  iconBg={type === 1 ? "bg-orange-100" : type === 2 ? "bg-blue-100" : "bg-indigo-100"}
                  title={getMealName(type)}
                  time={getMealTimeDisplay(type).split(" - ")[0]}
                  items={item.items}
                  active={isActive}
                  activeMeal={activeMeal?.status}
                />
              );
            })}

            {menu.length === 0 && (
              <div className="text-center py-8">
                <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Menu not uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
