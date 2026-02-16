"use client";

import { ReactNode, useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import API from "@/lib/api";
import Navbar from "@/components/student/Navbar";
import Toast from "@/components/student/Toast"; // <--- Import Toast
import { 
  Droplets, Utensils, Scale, Clock, 
  CheckCircle2, Loader2, Calendar, Coffee 
} from "lucide-react";
import { AxiosError } from "axios";

// --- TYPES ---
interface Complaint {
  _id: string;
  category: string;
  day?: number;      
  mealType?: number; 
  description: string;
  status: "Pending" | "In Progress" | "Resolved";
  response?: string;
  createdAt: string;
}

interface CategoryCardProps {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}

interface ToastState {
    show: boolean;
    message: string;
    type: "success" | "error";
}

// Fetcher for SWR
const fetcher = (url: string) =>
  API.get(url).then((res) => {
    const data = Array.isArray(res.data.data)
      ? res.data.data
      : [res.data.data];
    return data.filter((i: unknown) => i !== null);
  });


const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["Breakfast", "Lunch", "Dinner"];

const dayMap: Record<string, number> = {
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4, 
  "Friday": 5,
  "Saturday": 6,
  "Sunday": 7
};

const mealMap: Record<string, number> = {
  "Breakfast": 1,
  "Lunch": 2,
  "Dinner": 3
};

const getDayName = (num: number) => DAYS[num - 1] || "Unknown";
const getMealName = (num: number) => MEALS[num - 1] || "Unknown";


export default function ComplaintPage() {

  const [selectedCategory, setSelectedCategory] = useState<string>("HYGIENE");
  const todayIndex = new Date().getDay(); 
  const defaultDay = todayIndex === 0 ? "Sunday" : DAYS[todayIndex - 1]; 

  const [selectedDay, setSelectedDay] = useState<string>(defaultDay); 
  const [selectedMeal, setSelectedMeal] = useState<string>("Lunch");

  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  
  

  const [toast, setToast] = useState<ToastState | null>(null);


  const { data: complaints, isLoading } = useSWR(
    "/feedback/get",
    fetcher, {
      revalidateOnFocus: false, 
      dedupingInterval: 60000, 
      keepPreviousData: true, 
  });


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setUserLoading(false);
  }, []);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      triggerToast("Please describe the issue in the text box.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const dayInt = dayMap[selectedDay];
      const mealTypeInt = mealMap[selectedMeal];

      await API.post("/feedback/new", {
        category: selectedCategory,
        day: dayInt,        
        mealType: mealTypeInt, 
        description: description,
      });
      
      setDescription("");
      mutate("/feedback/get");
      triggerToast("Complaint submitted successfully!", "success");
      
    } catch (error: unknown) {
      console.error("Submit Error:", error);
      

      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || "Failed to submit complaint.";
      
      triggerToast(errorMessage, "error");

    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || (!complaints && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar user={user} />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          
          <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">1. Select Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <CategoryCard label="Hygiene" icon={<Droplets />} selected={selectedCategory === "HYGIENE"} onClick={() => setSelectedCategory("HYGIENE")} />
            <CategoryCard label="Taste" icon={<Utensils />} selected={selectedCategory === "TASTE"} onClick={() => setSelectedCategory("TASTE")} />
            <CategoryCard label="Quantity" icon={<Scale />} selected={selectedCategory === "QUANTITY"} onClick={() => setSelectedCategory("QUANTITY")} />
            <CategoryCard label="Delay" icon={<Clock />} selected={selectedCategory === "DELAY"} onClick={() => setSelectedCategory("DELAY")} />
          </div>

  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            <div>
              <label className="text-sm font-bold text-gray-900 mb-2 block uppercase tracking-wider">2. Which Day?</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none transition-all text-gray-700 font-medium cursor-pointer hover:bg-gray-100"
                >
                  {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-900 mb-2 block uppercase tracking-wider">3. Which Meal?</label>
              <div className="grid grid-cols-3 gap-2">
                {MEALS.map(meal => (
                  <button
                    key={meal}
                    onClick={() => setSelectedMeal(meal)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                      selectedMeal === meal
                        ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">4. Describe the Issue</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., The dal was too salty during lunch..."
              className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Complaint"}
          </button>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Complaints</h2>
            
            {complaints && complaints.length > 0 ? (
              complaints.map((item: Complaint) => (
                <div key={item._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200 uppercase">
                        {item.category}
                      </span>
                      
                      {item.day && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100 flex items-center gap-1">
                          <Calendar className="h-3 w-3"/> {getDayName(item.day)}
                        </span>
                      )}
                      {item.mealType && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-xs font-medium border border-orange-100 flex items-center gap-1">
                          <Coffee className="h-3 w-3"/> {getMealName(item.mealType)}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <p className="text-gray-800 text-sm mb-3 leading-relaxed">{item.description}</p>
                  
                  {item.response && (
                    <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 border border-blue-100 mt-3 flex items-start gap-2">
                      <div className="font-bold shrink-0">Admin:</div>
                      <div>{item.response}</div>
                    </div>
                  )}
                </div>
              ))
            ) : (
               <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                 <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle2 className="h-6 w-6" />
                 </div>
                 <h3 className="text-gray-900 font-medium">No complaints yet</h3>
                 <p className="text-gray-500 text-sm">Everything seems to be going well!</p>
               </div>
            )}
        </div>

      </main>

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


function CategoryCard({ label, icon, selected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-24 ${
        selected
          ? "bg-blue-50 border-blue-500 shadow-sm"
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`mb-2 ${selected ? "text-blue-600" : "text-gray-400"}`}>
        <div className="h-6 w-6">{icon}</div>
      </div>
      <span className={`text-xs font-bold ${selected ? "text-blue-700" : "text-gray-600"}`}>
        {label}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "RESOLVED") {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 uppercase tracking-wide">
        <CheckCircle2 className="h-3 w-3" /> Resolved
      </span>
    );
  }
  if (status === "SUBMITTED") {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200 uppercase tracking-wide">
        <Loader2 className="h-3 w-3 animate-spin" /> In Progress
      </span>
    );
  }
}