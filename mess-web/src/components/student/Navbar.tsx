"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { UtensilsCrossed, CalendarDays, MessageSquare, QrCode, LogOut, LucideWallet, LucideReceiptText, User } from "lucide-react";
import API from "@/lib/api";

interface NavbarProps {
  user: {
    fullName?: string | null;
    roll_no?: string | null;
    currentBalance?: number | null;
    role?: string | null;
    isCardHolder?: boolean | null;
  } | null | undefined;
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  active?: boolean;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await API.post(`/users/logout`);
      Cookies.remove("accessToken");
      localStorage.removeItem("user");
      router.replace("/auth/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="w-full sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-gray-900">MessMate</h1>
                <p className="text-xs font-medium text-gray-500 capitalize">
                  {user?.role === 'student' ? user?.roll_no : 'Admin Portal'}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <NavLink href="/student/dashboard" icon={<CalendarDays className="h-4 w-4" />} label="Home" active={isActive("/student/dashboard")} />
              <NavLink href="/student/menu" icon={<UtensilsCrossed className="h-4 w-4" />} label="Menu" active={isActive("/student/menu")} />
              <NavLink href="/student/issues" icon={<MessageSquare className="h-4 w-4" />} label="Complaints" active={isActive("/student/issues")} />
              <NavLink href="/student/pay" icon={<LucideWallet className="h-4 w-4" />} label="Wallet" active={isActive("/student/pay")} />
              <NavLink href="/student/booking" icon={<LucideReceiptText className="h-4 w-4" />} label="Booking" active={isActive("/student/booking")} />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/student/scan')}
                className="hidden md:flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <QrCode className="h-4 w-4" />
                Scan QR
              </button>

              <button
                onClick={() => router.push('/student/profile')}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm hover:-translate-y-0.5 transition-all active:scale-95 border border-blue-100"
                title="Profile"
              >
                {user?.fullName ? (
                  <span className="text-sm font-black">{user.fullName.charAt(0).toUpperCase()}</span>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:-translate-y-0.5 transition-all active:scale-95"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <button
          onClick={() => router.push('/student/scan')}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 hover:bg-blue-700 active:scale-90 transition-all"
        >
          <QrCode className="h-6 w-6" />
        </button>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-1">
          
          <MobileNavLink 
            href="/student/dashboard" 
            icon={<CalendarDays className="h-5 w-5" />} 
            label="Home" 
            active={isActive("/student/dashboard")} 
          />
          <MobileNavLink 
            href="/student/menu" 
            icon={<UtensilsCrossed className="h-5 w-5" />} 
            label="Menu" 
            active={isActive("/student/menu")} 
          />
          <MobileNavLink 
            href="/student/issues" 
            icon={<MessageSquare className="h-5 w-5" />} 
            label="Issues" 
            active={isActive("/student/issues")} 
          />
          <MobileNavLink 
            href="/student/pay" 
            icon={<LucideWallet className="h-5 w-5" />} 
            label="Wallet" 
            active={isActive("/student/pay")} 
          />
          <MobileNavLink 
            href="/student/booking" 
            icon={<LucideReceiptText className="h-5 w-5" />} 
            label="Booking" 
            active={isActive("/student/booking")} 
          />

        </div>
      </div>
    </>
  );
}


function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2 text-sm font-bold transition-all duration-200 ${
        active 
          ? "text-blue-600" 
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      <div className={`transition-transform duration-200 group-hover:scale-110 group-active:scale-95 ${active ? "fill-blue-50" : ""}`}>
        {icon}
      </div>
      {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors duration-200 active:scale-95 ${
        active ? "text-blue-600" : "text-gray-400 hover:text-gray-900"
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? "scale-110 drop-shadow-sm" : ""}`}>
               {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: `h-5 w-5 ${active ? "fill-blue-50 stroke-blue-600" : ""}`
        })}
      </div>
      <span className="text-[10px] font-extrabold tracking-wide">{label}</span>
    </Link>
  );
}