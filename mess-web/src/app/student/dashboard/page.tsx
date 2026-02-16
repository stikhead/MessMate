"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import { UtensilsCrossed, CalendarDays, Clock, Coffee, Sun, Moon, TrendingUp, Calendar, Wallet, LucideAlarmCheck } from "lucide-react";
import Navbar from "@/components/student/Navbar";
import StatsCard from "@/components/student/statsCard";
import MenuRow from "@/components/student/MenuRow";

// --- TYPES ---
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

interface UserProfile {
  fullName: string;
  roll_no: string;
  currentBalance: number;
}

interface UserStats {
  mealsThisWeek: number;
  totalMeals: number;
  attendanceRate: number;
}

export default function StudentDashboard() {

  // --- STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealToken, setMealToken] = useState<MealToken | null>(null);
  const [nextMeal, setNextMeal] = useState<MenuItem | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
   const [serverTime, setServeTime] = useState({
    hours: "01",
    minutes: "00",
    seconds: "00",
  });
  const [stats, /*setStats*/ ] = useState<UserStats>({ // todo fetch actual data
    mealsThisWeek: 18,
    totalMeals: 21,
    attendanceRate: 86,
  });

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const today = new Date(Date.now());
        const todayType = today.getDay();
        const menuRes = await API.get(`/menu/getMenu?day=${todayType}&mealType=0`);
        let mealType = 1;
        if(today.getHours() >= 8 && today.getHours() < 14) mealType = 2;
        else if(today.getHours() >= 14 && today.getHours() < 21) mealType = 3;
        
        const menuData = Array.isArray(menuRes.data.data) 
          ? menuRes.data.data 
          : [menuRes.data.data];

        const validMenu = menuData.filter((item: never) => item !== null);
        const mealTokenRes = await API.get(`/meal/get-token?day=${todayType}&mealType=${mealType}`).catch((err) => null);
       
        console.log(mealTokenRes)
      
        setMenu(validMenu);
        determineNextMeal(validMenu);
        setMealToken(mealTokenRes?.data.data);
        // todo fetch actual data
        // const statsRes = await API.get('/analytics/my-stats');
        // setStats(statsRes.data.data);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. TIMER & NEXT MEAL LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (nextMeal) {
        updateCountdown();
      } else if (menu.length > 0) {
        determineNextMeal(menu);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextMeal, menu]); // todo fix this

  const determineNextMeal = (menuItems: MenuItem[]) => {
    const currentHour = new Date().getHours();
    
  
    // < 9 AM -> breakfast (type 1)
    // < 2 PM  -> lunch (type 2)
    // < 9 PM  -> dinner (type 3)
    // else -> closed (type 0)

    let targetType = 1;
    if (currentHour >= 9 && currentHour < 14) targetType = 2;
    else if (currentHour >= 14 && currentHour < 21) targetType = 3;


    const found = menuItems.find((m) => m.mealType === targetType);
    if(currentHour>21){
      found!.mealType = 4 
    }
    
    setNextMeal(found || null);
    
  };

  const updateCountdown = () => {
  
    const now = new Date();
    
    const target = new Date(Date.now());
    if(nextMeal?.mealType===4){
      target.setDate(target.getDate() + 1);
    }

    if (nextMeal?.mealType === 1) target.setHours(8, 0, 0); // breakfast ends
    else if (nextMeal?.mealType === 2) target.setHours(13, 0, 0); // lunch ends
    else if (nextMeal?.mealType === 3) target.setHours(20, 0, 0); // dinner ends
    else if (nextMeal?.mealType === 4) target.setHours(8, 0, 0)
    else return;

  //  const targetServe = new Date()
  //   if (nextMeal?.mealType === 1) targetServe.setHours(9, 0, 0); // breakfast ends
  //   else if (nextMeal?.mealType === 2) target.setHours(14, 0, 0); // lunch ends
  //   else if (nextMeal?.mealType === 3) target.setHours(21, 0, 0); // dinner ends
  //   else return;

    const diff = target.getTime() - now.getTime();

    // const diffServe = targetServe.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
      // setServeTime({ hours: "01", minutes: "00", seconds: "00" });
      return;
    }

    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    console.log(h, m, s)
    setTimeLeft({
      hours: h.toString().padStart(2, "0"),
      minutes: m.toString().padStart(2, "0"),
      seconds: s.toString().padStart(2, "0"),
    });

    // const hs = Math.floor((diffServe / (1000 * 60 * 60)) % 24);
    // const ms = Math.floor((diffServe / (1000 * 60)) % 60);
    // const ss = Math.floor((diffServe / 1000) % 60);

    // setServeTime({  
    //   hours: hs.toString().padStart(2, "0"),
    //   minutes: ms.toString().padStart(2, "0"),
    //   seconds: ss.toString().padStart(2, "0"), });
  };



  // --- RENDER HELPERS ---
  const getMealName = (type: number) => {
    if (type === 1) return "Breakfast";
    if (type === 2) return "Lunch";
    if (type === 3) return "Dinner";
     if (type === 4) return "Breakfast";
    return "Mess Closed";
  };

  const getMealTime = (type: number) => {
    if (type === 1) return "8:00 AM - 9:00 AM";
    if (type === 2) return "1:00 PM - 2:00 PM";
    if (type === 3) return "8:00 PM - 9:00 PM";
     if (type === 4) return "8:00 AM - 9:00 AM";
    return "";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- NAVBAR --- */}
      <Navbar user={user}/>

      {/* --- MAIN CONTENT --- */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">

        {/* (Next Meal) */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-blue-600 to-blue-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-800/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          {nextMeal ? (
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                     {(timeLeft.hours === '00' && timeLeft.minutes === '00' && timeLeft.seconds === '00') ? 'Currently Serving: ' : 'Next Meal: '}{getMealName(nextMeal.mealType)}
                  </h2>
                  <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
                    <Clock className="h-3.5 w-3.5" />
                    {getMealTime(nextMeal.mealType)}
                  </div>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
                  {nextMeal.mealType === 1 ? (
                    <Coffee className="h-6 w-6 sm:h-7 sm:w-7" />
                  ) : nextMeal.mealType === 2 ? (
                    <Sun className="h-6 w-6 sm:h-7 sm:w-7" />
                  ) : (
                    <Moon className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/20 mb-6">
                <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-2">
                  Todays Menu
                </p>
                
                <h3 className="text-lg sm:text-xl font-semibold leading-relaxed">
                  {nextMeal.items.split(',').join(' • ')} 
                </h3>
              </div>

             {timeLeft.hours==='00' ? ( 
              <div></div>
               ) : (
                <div className="border-t border-white/20 pt-5">
                <div className="flex items-center gap-2 mb-4 text-blue-100 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Time Remaining</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <TimeUnit value={timeLeft.hours} label="Hours" />
                  <span className="text-2xl font-bold opacity-50">:</span>
                  <TimeUnit value={timeLeft.minutes} label="Minutes" />
                  <span className="text-2xl font-bold opacity-50">:</span>
                  <TimeUnit value={timeLeft.seconds} label="Seconds" />
                </div>
              </div>
              )}
            </div> 
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm">
                <Moon className="h-8 w-8 text-blue-200" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Mess Cfrrlosed</h2>
              <p className="text-blue-100 text-sm">
                See you tomorrow for Breakfast!
              </p>
            </div>
          )}
        </div>

        {/*STATS CARDS */}
        <div className="grid grid-cols-2 gap-4">
          
          <StatsCard
            title="Meals This Week"
            value={0}
            subValue={`/${0}`}
            icon={<Calendar />}
            color="green"
          />

          <StatsCard
            title="Attendance"
            value={`${0}%`}
            icon={<TrendingUp />}
            color="blue"
          />

          <StatsCard title="Balance" value={`₹${user?.currentBalance}`} icon={<Wallet />} color="orange" />

          <StatsCard title="Booking Status" value={`${mealToken ? mealToken?.status : "NOT BOOKED"} `} icon={<LucideAlarmCheck />} color="orange" />
        </div>
       

        {/*COMPLETE MENU */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-400" />
            Todays Complete Menu
          </h3>

          <div className="space-y-3">
            {[1, 2, 3].map((type) => {
              const item = menu.find((m) => m.mealType === type);
              if (!item) return null;

              const isActive = nextMeal?.mealType === type;

              return (
                <MenuRow
                  key={type}
                  icon={
                    type === 1 ? (
                      <Coffee className="h-5 w-5 text-orange-600" />
                    ) : type === 2 ? (
                      <Sun className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Moon className="h-5 w-5 text-indigo-600" />
                    )
                  }
                  iconBg={
                    type === 1
                      ? "bg-orange-100"
                      : type === 2
                      ? "bg-blue-100"
                      : "bg-indigo-100"
                  }
                  title={getMealName(type)}
                  time={getMealTime(type).split(" - ")[0]}
                  items={item.items}
                  active={isActive}
                  timeLeft={timeLeft}
                />
              );
            })}

            {menu.length === 0 && (
              <div className="text-center py-8">
                <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Menu not uploaded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center flex-1">
      <div className="flex h-14 sm:h-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-2xl sm:text-3xl font-bold shadow-sm border border-white/20">
        {value}
      </div>
      <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-wide text-blue-200 font-medium">
        {label}
      </p>
    </div>
  );
}

