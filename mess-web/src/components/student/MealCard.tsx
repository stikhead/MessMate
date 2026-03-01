

import { MealToken, MenuItem } from "@/types/common";
import { Coffee, Sun, Moon, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface MealCardProps {
  type: number;
  menuItem?: MenuItem;
  token?: MealToken | null;
  isPast: boolean;
  onBook: (type: number, price: number) => void;
  onCancel: (type: number) => void;
  loading: boolean;
  isCardHolder: boolean; 
}

export default function MealCard({ type, menuItem, token, isPast, onBook, onCancel, loading, isCardHolder }: MealCardProps) {
  const config = {
    1: { name: "Breakfast", time: "8:00 - 10:00 AM", icon: <Coffee className="h-6 w-6" />, color: "text-orange-600", bg: "bg-orange-50" },
    2: { name: "Lunch", time: "1:00 - 3:00 PM", icon: <Sun className="h-6 w-6" />, color: "text-blue-600", bg: "bg-blue-50" },
    3: { name: "Dinner", time: "8:00 - 10:00 PM", icon: <Moon className="h-6 w-6" />, color: "text-indigo-600", bg: "bg-indigo-50" },
  }[type] || { name: "", time: "", icon: null, color: "", bg: "" };

  const isBooked = token?.status === 'BOOKED' || token?.status === 'REDEEMED';
  const isCancelled = token?.status === 'CANCELLED';
  const isMenuAvailable = !!menuItem;
  const price = menuItem?.price || 0;

  return (
    <div className={`relative flex flex-col bg-white rounded-2xl border transition-all duration-300 ${isBooked ? "border-green-200 shadow-md shadow-green-50" : "border-gray-200 shadow-sm hover:shadow-md"}`}>
      <div className={`p-5 sm:p-6 border-b border-gray-100 ${isBooked ? "bg-green-50/30" : ""}`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${config.bg} ${config.color}`}>
            {config.icon}
          </div>
          {isBooked && (
            <div className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Booked
            </div>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{config.name}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
          <Clock className="h-3.5 w-3.5" /> {config.time}
        </p>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">On the Menu</p>
        <div className="flex-1">
          {isMenuAvailable ? (
            <p className="text-gray-700 text-sm sm:text-base font-medium leading-relaxed">
              {menuItem.items.split(",").join(" • ")}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 italic text-sm">
              <AlertCircle className="h-4 w-4" /> Menu not updated yet
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Price</p>
            <p className="text-2xl font-bold text-gray-900">₹{price}</p>
          </div>

          <div className="flex gap-2">
            {isCardHolder ? (
              isCancelled ? (
                <button
                  onClick={() => onBook(type, price)}
                  disabled={isPast || loading || !isMenuAvailable}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-2 ${
                    isPast || !isMenuAvailable ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                  }`}
                >
                  {loading ? "Processing..." : "Emergency Re-book"}
                </button>
              ) : isBooked ? (
                <div className="px-5 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm border border-green-200 flex items-center gap-2 cursor-default">
                  <CheckCircle2 className="h-4 w-4" /> Auto-Booked
                </div>
              ) : null
            ) : (
              <>
                <button
                  onClick={() => onCancel(type)}
                  disabled={isCancelled || isPast || loading || !isMenuAvailable || !isBooked}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    isPast || !isMenuAvailable || isCancelled || !isBooked ? "bg-gray-100 text-gray-400 cursor-not-allowed hidden sm:flex" : "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-md"
                  }`}
                >
                  Cancel
                </button>

                <button
                  onClick={() => onBook(type, price)}
                  disabled={isBooked || isPast || loading || !isMenuAvailable}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    isBooked ? "bg-green-100 text-green-700 cursor-not-allowed" : isPast || !isMenuAvailable ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md"
                  }`}
                >
                  {isBooked ? "Confirmed" : isPast ? "Closed" : "Book Now"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isPast && !isBooked && (
        <div className="absolute inset-0 bg-gray-50/50 rounded-2xl backdrop-blur-[1px] cursor-not-allowed z-10" />
      )}
    </div>
  );
}