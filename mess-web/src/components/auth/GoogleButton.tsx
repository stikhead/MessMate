
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleButton({ text = "Continue with Google", disabled = false }) {
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const handleReset = () => setLocalLoading(false);
    window.addEventListener("pageshow", handleReset);
    window.addEventListener("focus", handleReset);

    return () => {
      window.removeEventListener("pageshow", handleReset);
      window.removeEventListener("focus", handleReset);
    };
  }, []);

  const handleLogin = () => {
    setLocalLoading(true);
    
    try {
      const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      const options = {
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI as string,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
          "openid",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
      };

      const qs = new URLSearchParams(options);
      window.location.href = `${rootUrl}?${qs.toString()}`;
      setTimeout(() => {
        setLocalLoading(false);
      }, 3000);

    } catch (error) {
      console.error(error);
      setLocalLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={disabled || localLoading}
      className="group flex items-center justify-center w-full gap-3.5 py-4 px-5 border border-gray-200 rounded-xl bg-white shadow-sm transition-all duration-200 ease-in-out font-extrabold text-sm text-gray-800 tracking-tight hover:cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {localLoading ? (
        <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
      ) : (
        <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
        </svg>
      )}
      {localLoading ? "Connecting..." : text}
    </button>
  );
}