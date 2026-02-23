"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, IndianRupee, 
  Utensils, AlertTriangle, Loader2
} from "lucide-react";
import API from "@/lib/api";
import AdminLayout from "@/components/admin/Sidebar";
import { useUser } from "@/hooks/useUser";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

interface TrendData {
  date: string;
  predicted: number;
  ate: number;
  wastage: number;
  revenue: number;
}

interface metricCard {
     title: string;
     value: string;
      icon:  React.ReactNode; 
      bg: string;
}

interface AnalyticsData {
  totalStudents: number;
  predictedStudents: number;
  studentsAte: number;
  mealWastage: number;
  totalRevenue: number;
  expenditure: number;
  trendData: TrendData[];
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get("/analytics/overview");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <AdminLayout user={user}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const profit = data.totalRevenue - data.expenditure;

  return (
    <AdminLayout user={user}>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time insights and 7-day trends.</p>
        </div>

        {/* Top KPI Cards (Simplified for brevity, use your existing MetricCards here) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Registered" value={data.totalStudents.toString()} icon={<Users className="h-5 w-5 text-blue-600" />} bg="bg-blue-50" />
          <MetricCard title="Today's Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} icon={<IndianRupee className="h-5 w-5 text-green-600" />} bg="bg-green-50" />
          <MetricCard title="Wastage Today" value={`${data.mealWastage} Meals`} icon={<AlertTriangle className="h-5 w-5 text-orange-600" />} bg="bg-orange-50" />
          <MetricCard title="Net Profit" value={`₹${profit.toLocaleString()}`} icon={<IndianRupee className="h-5 w-5 text-purple-600" />} bg="bg-purple-50" />
        </div>

        {/* --- GRAPHS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Graph 1: 7-Day Attendance Trend (Area Chart) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Utensils className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">7-Day Attendance Trend</h2>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAte" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  
                  {/* The actual lines */}
                  <Area type="monotone" name="Actually Ate" dataKey="ate" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAte)" />
                  <Area type="monotone" name="Predicted (Booked)" dataKey="predicted" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 2: Revenue vs Wastage (Bar Chart) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Revenue vs Wastage (7 Days)</h2>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  
                  {/* The bars */}
                  <Bar yAxisId="left" name="Revenue (₹)" dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" name="Wasted Meals" dataKey="wastage" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({title, bg, icon, value}: metricCard) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`h-10 w-10 ${bg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}