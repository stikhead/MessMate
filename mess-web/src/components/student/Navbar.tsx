"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { UtensilsCrossed, CalendarDays, MessageSquare, QrCode, LogOut, LucideWallet, LucideForkKnifeCrossed, LucideReceiptText } from "lucide-react";
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
  href: string,
  icon: React.ReactNode,
  label: React.ReactNode,
  active?: boolean,
  onClick?: () => void
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
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
            <NavLink href="/student/booking" icon={<LucideForkKnifeCrossed className="h-4 w-4" />} label="Booking" active={isActive("/student/booking")} />
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">

          <div className="absolute -top-10 right-4 bg-white/90 backdrop-blur-md">
           <div className="relative flex justify-center w-16 -top-10">
              <button
                onClick={() => { closeMenu(); router.push('/student/scan'); }}
                className="absolute flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white border-[6px] border-gray-50 shadow-lg shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <QrCode className="h-7 w-7" />
              </button>
            </div>
          </div>

          <div className="flex justify-around items-center h-16 relative px-1">
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-27.5 h-6 pointer-events-none z-0">


            </div>
            <Link
              href="/student/dashboard"
              onClick={closeMenu}
              className={`flex flex-col items-center justify-center w-14 gap-1 mt-1 ${isActive("/student/dashboard") ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
            >
              <CalendarDays className={`h-5 w-5 ${isActive("/student/dashboard") ? "fill-blue-50 stroke-blue-600" : ""}`} />
              <span className="text-[10px] font-bold tracking-wide">Home</span>
            </Link>

            <Link
              href="/student/menu"
              onClick={closeMenu}
              className={`flex flex-col items-center justify-center w-14 gap-1 mt-1 pr-4 ${isActive("/student/menu") ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
            >
              <UtensilsCrossed className={`h-5 w-5 ${isActive("/student/menu") ? "fill-blue-50 stroke-blue-600" : ""}`} />
              <span className="text-[10px] font-bold tracking-wide">Menu</span>
            </Link>

            <Link
              href="/student/issues"
              onClick={closeMenu}
              className={`flex flex-col items-center justify-center w-14 gap-1 mt-1 ${isActive("/student/issues") ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
            >
              <MessageSquare className={`h-5 w-5 ${isActive("/student/issues") ? "fill-blue-50 stroke-blue-600" : ""}`} />
              <span className="text-[10px] font-bold tracking-wide">Complaints</span>
            </Link>
            {/* BIG CENTER SCAN BUTTON */}
            

            <Link
              href="/student/pay"
              onClick={closeMenu}
              className={`flex flex-col items-center justify-center w-14 gap-1 mt-1 pl-4 ${isActive("/student/pay") ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
            >
              <LucideWallet className={`h-5 w-5 ${isActive("/student/pay") ? "fill-blue-50 stroke-blue-600" : ""}`} />
              <span className="text-[10px] font-bold tracking-wide">Wallet</span>
            </Link>

            <Link
              href="/student/booking"
              onClick={closeMenu}
              className={`flex flex-col items-center justify-center w-14 gap-1 mt-1 ${isActive("/student/booking") ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
            >
              <LucideReceiptText className={`h-5 w-5 ${isActive("/student/booking") ? "fill-blue-50 stroke-blue-600" : ""}`} />
              <span className="text-[10px] font-bold tracking-wide">Booking</span>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}


function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
        }`}
    >
      {icon}
      {label}
    </Link>
  );
}

