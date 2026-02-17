"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { UtensilsCrossed, CalendarDays, MessageSquare, QrCode, LogOut, Menu, X, LucideWallet } from "lucide-react";
import API from "@/lib/api";

interface NavbarProps {
  user: {
    fullName?: string | null;
    roll_no?: string | null;
    currentBalance?: number | null;
    role?: string | null;
  } | null | undefined;
}

interface NavLinkProps {
    href: string,
    icon: React.ReactNode,
    label: React.ReactNode,
    active?: boolean,
    onClick?: () => void
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout =  async () => {
    try {
      await API.post(`/users/logout`);
      Cookies.remove("accessToken");
      localStorage.removeItem("user");
      router.replace("/auth/login");
    } catch (error) {
      console.log("Logout error:", error)
    }
  };

  const isActive = (path: string) => pathname === path;
  
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="w-full sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-gray-900">MessMate</h1>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'student' ? user?.roll_no : 'Admin Portal'}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/student/dashboard" icon={<CalendarDays className="h-4 w-4" />} label="Home" active={isActive("/student/dashboard")} />
            <NavLink href="/student/menu" icon={<UtensilsCrossed className="h-4 w-4" />} label="Menu" active={isActive("/student/menu")} />
            <NavLink href="/student/issues" icon={<MessageSquare className="h-4 w-4" />} label="Complaint" active={isActive("/student/issues")} />
            <NavLink href="/student/pay" icon={<LucideWallet className="h-4 w-4" />} label="Wallet" active={isActive("/student/pay")} />
          </div>

          <div className="flex items-center gap-3">
       
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200">
              <span className="text-green-600">₹</span>
              {user?.currentBalance || 0}
            </div>

            <button 
              onClick={() => router.push('/student/scan')}
              className="hidden md:flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm active:scale-95"
            >
              <QrCode className="h-4 w-4" />
              Scan QR
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <MobileNavLink onClick={closeMenu} href="/student/dashboard" icon={<CalendarDays className="h-4 w-4" />} label="Home" active={isActive("/student/dashboard")} />
            <MobileNavLink onClick={closeMenu} href="/student/menu" icon={<UtensilsCrossed className="h-4 w-4" />} label="Menu" active={isActive("/student/menu")} />
            <MobileNavLink onClick={closeMenu} href="/student/pay" icon={<LucideWallet className="h-4 w-4" />} label="Wallet" active={isActive("/student/pay")} />
            <MobileNavLink onClick={closeMenu} href="/student/issues" icon={<MessageSquare className="h-4 w-4" />} label="Complaint" active={isActive("/student/issues")} />
            
            <div className="pt-3 mt-2 border-t border-gray-100 px-2">
               <div className="flex justify-between items-center mb-3 bg-green-50 p-3 rounded-lg border border-green-100">
                  <span className="text-sm font-medium text-green-800">Available Balance</span>
                  <span className="text-base font-bold text-green-700">₹{user?.currentBalance || 0}</span>
               </div>
            
               <button 
                 onClick={() => { closeMenu(); router.push('/student/scan'); }}
                 className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm active:bg-blue-700"
               >
                 <QrCode className="h-4 w-4" />
                 Scan QR Code
               </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
        active ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, label, active, onClick }: NavLinkProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "text-blue-700 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <div className={`${active ? "text-blue-600" : "text-gray-400"}`}>
        {icon}
      </div>
      {label}
    </Link>
  );
}