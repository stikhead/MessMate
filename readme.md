# 🍽️ MessMate – Intelligent Mess Management System

[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

A full-stack, digital dining management platform designed to eliminate paper coupons, reduce daily food wastage, and provide seamless wallet-based meal booking for university students.

---

## ✨ Features

### 🎓 For Students
- **Digital Wallet:** Integrated Razorpay gateway for instant, secure top-ups.
- **Smart Meal Booking:** 1-click booking and cancellation system with strict cut-off logic (2 hours before meals).
- **Wastage Tracker:** A dedicated analytics widget showing financial losses from missed meals.
- **QR Code Integration:** Contactless meal redemption at the mess counter.

### 🛡️ For Administration
- **Analytics Dashboard:** Real-time data visualization of consumption vs. wastage using Recharts.
- **Automated Expiry:** Serverless Vercel Cron Jobs that automatically handle meal token expiry.
- **Admin Security:** Role-based access control (RBAC) enforced via Next.js Middleware.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB & Mongoose |
| **Payments** | Razorpay SDK |
| **Auth** | JWT (JSON Web Tokens) & Next.js Middleware |
| **Automation** | Vercel Cron Jobs |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas URI
- Razorpay API Keys

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/stikhead/messmate.git
cd messmate
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Environment Variables**

Create a `.env` file in the root directory and add:

```env
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_secret_key
CRON_SECRET=your_vercel_cron_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
```

4. **Run the development server**
```bash
npm run dev
```

---

## 📡 API Documentation

### 🔐 Authentication (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/register` | Register a new student | No |
| `POST` | `/login` | Authenticate and return JWT | No |
| `GET` | `/getUsers` | Fetch all registered students | Yes (Admin) |

### 💳 Wallet & Payments (`/api/v1/wallet`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/create-order` | Initialize Razorpay order | Yes |
| `POST` | `/verify` | Verify signature & update balance | Yes |

### 🍱 Meal Management (`/api/v1/meal`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/book` | Book meal for a specific date | Yes |
| `POST` | `/cancel` | Cancel booking and refund wallet | Yes |
| `GET` | `/queue-status` | Real-time mess queue analytics | Yes (Admin) |

---

## ⚙️ System Architecture (Serverless Optimization)

This project is architected for **Vercel**:

- **Edge Middleware:** Custom JWT decoding in Next.js Middleware handles role-based redirection at the network edge.
- **Vercel Cron Jobs:** Automated cleanup tasks scheduled via Vercel's native cron engine to expire tokens.
- **Timezone Normalization:** Backend logic uses `setUTCHours` to maintain consistent 05:30 UTC (Midnight IST) timestamps.

---
