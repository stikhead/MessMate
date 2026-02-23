import API from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { UserProfile } from "@/types/common";



export function useUser() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    Cookies.remove("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    if (!pathname.startsWith('/auth')) {
      router.replace('/auth/login');
    }
  }, [router, pathname]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await API.get("/users/getCurrentUser");
      const userData = data?.data;
      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    const initUser = async () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem("user");
          console.log(e)
        }
      }

      try {
        const response = await API.get("/users/getCurrentUser");
        const freshData = response?.data?.data;
        if (isMounted && freshData) {
          const freshStringified = JSON.stringify(freshData);
          if (freshStringified !== stored) {
            setUser(freshData);
            localStorage.setItem("user", freshStringified);
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        if (e.newValue) setUser(JSON.parse(e.newValue));
        else logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout]); 

  return { user, loading, refreshUser, logout };
}
