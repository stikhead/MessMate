"use client";

import React from "react";

interface MenuRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  time: string;
  items: string;
  active: boolean;
  timeLeft?: {
    hours: string;
    minutes: string;
    seconds: string;
  };
  activeMeal: string;
}

export default function MenuRow({ icon, iconBg, title, time, items, active, activeMeal }: MenuRowProps) {
  const foodList = items
    ? items
        .split(",")
        .map((item: string) => item.trim())
        .filter((i: string) => i)
    : [];

  return (
    <div
      className={`group relative flex items-start gap-4 p-5 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default overflow-hidden ${
        active
          ? "bg-blue-50/80 border-2 border-blue-200 shadow-sm ring-4 ring-blue-50/50"
          : "bg-white border border-gray-100 hover:border-blue-100"
      }`}
    >
      {active && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      )}

      <div
        className={`relative z-10 mt-0.5 h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-md ${iconBg}`}
      >
        {icon}
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h4
              className={`font-extrabold text-base sm:text-lg transition-colors duration-300 ${
                active ? "text-blue-900" : "text-gray-900 group-hover:text-blue-600"
              }`}
            >
              {title}
            </h4>
            
            {active && activeMeal === "SERVING" && (
              <span className="flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm shadow-blue-600/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live
              </span>
            )}
            
            {active && activeMeal !== "SERVING" && (
              <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
                Up Next
              </span>
            )}
          </div>
          
          <span className="text-xs font-bold text-gray-400 hidden sm:block transition-colors duration-300 group-hover:text-blue-400">
            {time}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {foodList.length > 0 ? (
            foodList.map((food: string, index: number) => (
              <span
                key={index}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-300 group-hover:shadow-sm ${
                  active
                    ? "bg-white text-blue-700 border-blue-200 shadow-sm hover:scale-105"
                    : "bg-gray-50 text-gray-600 border-gray-100 group-hover:bg-white group-hover:border-blue-100 group-hover:text-blue-600 hover:scale-105"
                }`}
              >
                {food}
              </span>
            ))
          ) : (
            <span className="text-xs font-bold text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-xl border border-dashed border-gray-200">
              No items listed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}