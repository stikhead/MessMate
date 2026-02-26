"use client";

import { useState, useEffect } from "react";
import {Users, IndianRupee, Utensils, AlertTriangle, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import API from "@/lib/api";
import AdminLayout from "@/components/admin/Sidebar";
import { useUser } from "@/hooks/useUser";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { AnalyticsData } from "@/types/common";
import MetricCard from "@/components/admin/MetricCard";


export default function AnalyticsPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);


  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/analytics/overview?date=${selectedDate}`);
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedDate]);

  if (loading && !data) {
    return (
      <AdminLayout user={user}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const currentData = data || {
    totalStudents: 0,
    todaysRevenue: 0,
    expenditure: 0,
    mealWastage: 0,
    trendData: [],
    monthlyData: []
  };

  const profit = currentData.todaysRevenue - currentData.expenditure;
  const isToday = selectedDate === todayStr;


  const [selYear, selMonth] = selectedDate.split('-').map(Number);
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const startDayOfMonth = new Date(selYear, selMonth - 1, 1).getDay();

  const revenueMap: Record<string, number> = {};

  currentData.monthlyData.forEach(item => {
    revenueMap[item._id] = item.revenue;
  });

  const handlePrevMonth = () => {
    const prev = new Date(selYear, selMonth - 2, 1);
    setSelectedDate(prev.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const next = new Date(selYear, selMonth, 1);
    if (next > today) return; 
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  return (
    <AdminLayout user={user}>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Select a date below to view daily stats and trends.</p>
          </div>

          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input 
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-gray-700 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <MetricCard 
            title="Total Registered" 
            value={currentData.totalStudents.toString()} 
            icon={<Users className="h-5 w-5 text-blue-600" />} 
            bg="bg-blue-50" 
          />
          <MetricCard 
            title={isToday ? "Today's Revenue" : "Selected Day Revenue"} 
            value={`₹${currentData.todaysRevenue.toLocaleString()}`} 
            icon={<IndianRupee className="h-5 w-5 text-green-600" />} 
            bg="bg-green-50" 
          />
          <MetricCard 
            title={isToday ? "Wastage Today" : "Wastage on Date"} 
            value={`${currentData.mealWastage} Meals`} 
            icon={<AlertTriangle className="h-5 w-5 text-orange-600" />} 
            bg="bg-orange-50" 
          />
          <MetricCard 
            title={isToday ? "Net Profit" : "Net Profit on Date"} 
            value={`₹${profit.toLocaleString()}`} 
            icon={<IndianRupee className="h-5 w-5 text-purple-600" />} 
            bg="bg-purple-50" 
          />
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Utensils className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">7-Day Attendance Trend</h2>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAte" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  <Area type="monotone" name="Actually Ate" dataKey="ate" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAte)" />
                  <Area type="monotone" name="Predicted (Booked)" dataKey="predicted" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Revenue vs Wastage (7 Days)</h2>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  <Bar yAxisId="left" name="Revenue (₹)" dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" name="Wasted Meals" dataKey="wastage" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                Monthly Revenue Calendar
              </h2>
              <p className="text-sm text-gray-500 mt-1">Click a day to view detailed stats above.</p>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-gray-800 min-w-25 text-center">
                {new Date(selYear, selMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const currentCellDateStr = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const isSelected = selectedDate === currentCellDateStr;
                const isFuture = new Date(currentCellDateStr) > today;
  
                const dayRevenue = revenueMap[currentCellDateStr] || 0;

                return (
                  <button
                    key={day}
                    onClick={() => !isFuture && setSelectedDate(currentCellDateStr)}
                    disabled={isFuture}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-20 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100 ring-offset-1' 
                        : isFuture
                        ? 'border-gray-50 bg-gray-50/50 opacity-50 cursor-not-allowed'
                        : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm cursor-pointer'
                    }`}
                  >
                    <span className={`text-sm font-bold mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    
                    {!isFuture && (
                      <span className={`text-xs font-bold ${
                        dayRevenue > 0 ? (isSelected ? 'text-green-600' : 'text-green-500') : 'text-gray-400 font-medium'
                      }`}>
                        {dayRevenue > 0 ? `₹${dayRevenue}` : '-'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

