import React from "react";
type ColorTheme = "blue" | "green" | "orange" | "purple" | "red";

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string | number; 
  icon: React.ReactNode;     
  color?: ColorTheme;   
  className?: string; 
}

const colorMap: Record<ColorTheme, { bg: string; text: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
  green:  { bg: "bg-green-50",  text: "text-green-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  red:    { bg: "bg-red-50",    text: "text-red-600" },
};

export default function StatsCard({ title, value, subValue, icon, color = "blue", className = "" }: StatsCardProps) {
  
  const theme = colorMap[color];

  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
      
      {/* Header: Title + Icon */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${theme.bg}`}>
          {/* We clone the icon to force the correct text color onto it */}
          {React.cloneElement(icon as React.ReactElement)}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subValue && (
          <span className="text-lg font-medium text-gray-400">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}