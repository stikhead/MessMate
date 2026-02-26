"use client";

import { useState, useEffect } from "react";
import { Users, Loader2 } from "lucide-react";
import API from "@/lib/api";

export default function LiveQueueCard() {
  const [queueCount, setQueueCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true; // Safeguard against unmounted state updates

    const fetchQueue = async () => {
      try {
        const res = await API.get("/meal/queue-status").catch(() => null);
        if (res?.data?.data && isMounted) {
          setQueueCount(res.data.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch queue", error);
      }
    };

    fetchQueue(); // Call immediately on mount
    
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchQueue, 30000);
    
    return () => {
      isMounted = false; // Cleanup
      clearInterval(interval);
    };
  }, []);

  // Determine status based on thresholds
  let status = "Loading...";
  let colorTheme = "bg-gray-100 text-gray-500";
  let barWidth = "w-0";
  let barColor = "bg-gray-200";

  if (queueCount !== null) {
    if (queueCount >= 40) {
      status = "Very Busy";
      colorTheme = "bg-red-50 text-red-700 border-red-100";
      barWidth = "w-[90%]";
      barColor = "bg-red-500";
    } else if (queueCount >= 15) {
      status = "Moderate";
      colorTheme = "bg-orange-50 text-orange-700 border-orange-100";
      barWidth = "w-[50%]";
      barColor = "bg-orange-500";
    } else {
      status = "Smooth";
      colorTheme = "bg-green-50 text-green-700 border-green-100";
      barWidth = "w-[15%]";
      barColor = "bg-green-500";
    }
  }

  return (
    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${colorTheme}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5 mb-1">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${barColor}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${barColor}`}></span>
            </span>
            Live Crowd
          </p>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            {queueCount === null ? <Loader2 className="h-4 w-4 animate-spin" /> : status}
          </h3>
        </div>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-white/50 shadow-sm`}>
          <Users className="h-5 w-5" />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
          <span>Capacity</span>
          <span>{queueCount !== null ? `${queueCount} Scans (15m)` : "..."}</span>
        </div>
        <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor} ${barWidth}`} />
        </div>
      </div>
    </div>
  );
}