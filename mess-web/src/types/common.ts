import { ReactNode } from "react";

export interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export interface UserProfile {
  fullName: string;
  roll_no: string;
  currentBalance: number;
  role: string;
  cardNumber: MessCard;
  isCardHolder: boolean;
}

export interface Student {
  _id: string;
  fullName: string;
  roll_no: string;
  email: string;
  phone?: string;
  hostel?: string;
  currentBalance: number;
  isCardHolder: boolean;
  cardNumber?: {
    mealAmount?: number;
    isActive?: "ACTIVE" | "INACTIVE";
    isAutoBookingEnabled?: boolean;
  };
  createdAt: string;
}

export interface AssignCardForm {
  userId: string;
}

export interface MessCard {
  number: string;
  mealAmount: number;
  isActive: string;
  isAutoBookingEnabled: boolean;
}

export interface MenuItem {
  _id: string;
  mealType: number;
  day: number;
  items: string;
  price: number;
}

export interface MealToken {
    _id: string;
    mealType: number;
    status: "BOOKED" | "REDEEMED" | "CANCELLED";
    qrCode: string;
    createdAt: string;
    day?: number;
}

export interface UserStats {
  mealsThisWeek: number;
  totalMeals: number;
  attendanceRate: number;
}


export interface LoginFormData {
  cardNumber: string;
  password: string;
}


export interface RegisterFormData {
 fullName: string;
    email: string;
    roll_no: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    user: {
      id: string;
      role: string;
      [key: string]: unknown;
    };
  };
}

export interface Transaction {
  _id: string;
  amount: number;
  transactionType: "credit";
  status: "success" | "failed" | "pending";
  description: string;
  date: string;
  razorpay_payment_id?: string;
}


export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}


export interface Complaint {
  _id: string;
  category: string;
  day?: number;
  mealType?: number;
  description: string;
  status: "Pending" | "In Progress" | "Resolved";
  response?: string;
  createdAt: string;
}

export interface CategoryCardProps {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}

export interface MenuFormData {
  day: number;
  mealType: number;
  items: string;
  price: number;
}