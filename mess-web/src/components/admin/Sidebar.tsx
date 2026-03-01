"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { LayoutDashboard, Users, Inbox, UtensilsCrossed, Store, LogOut, Menu, X, QrCode, LucideChartArea } from "lucide-react";
import API from "@/lib/api";

interface AdminLayoutProps {
  user: {
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null | undefined;
  children: React.ReactNode;
}

export default function AdminLayout({ user, children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await API.post(`/users/logout`);
      Cookies.remove("accessToken");
      localStorage.removeItem("user");
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Menu Control", icon: UtensilsCrossed, path: "/admin/menu-controller" },
    { name: "Analytics", icon: LucideChartArea, path: "/admin/analytics" },
    { name: "Students", icon: Users, path: "/admin/students" },
    { name: "QR Code", icon: QrCode, path: "/admin/qrcode" },
    { name: "Smart Inbox", icon: Inbox, path: "/admin/inbox", badge: 4 },
    { name: "Vendors", icon: Store, path: "/admin/vendors" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20">
        
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-gray-900">MessMate</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-blue-50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"${
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  {item.name}
                </div>
                {item.badge && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-gray-200 p-4 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || "Super Admin"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "admin@university.edu"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-gray-200 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900">MessMate Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
             <div 
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
              onClick={closeMenu}
            
            
            />
            <div className="relative flex w-4/5 max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                <span className="font-bold text-gray-900">Menu</span>
                <button onClick={closeMenu} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-blue-50 text-blue-700" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                        {item.name}
                      </div>
                      {item.badge && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-50 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}