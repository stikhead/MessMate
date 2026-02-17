import API from "@/lib/api";
import { useEffect, useState } from "react";

export interface UserProfile {
  fullName: string;
  roll_no: string;
  currentBalance: number;
  role: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
            setUser(JSON.parse(stored));
            setLoading(false); 
        }

        const freshUser =  await API.get("/users/getCurrentUser").catch(() => null);

        if (isMounted && freshUser?.data?.data) {
            
           if (JSON.stringify(freshUser.data.data) !== stored) {
               setUser(freshUser.data.data);
               localStorage.setItem("user", JSON.stringify(freshUser.data.data));
           }
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();

    return () => { isMounted = false; };
  }, []); 

  const refreshUser = async () => {
      try {
          const { data } = await API.get("/users/getCurrentUser");
          setUser(data.data);
          localStorage.setItem("user", JSON.stringify(data.data));
      } catch (err) {
          console.error(err);
      }
  };

  return { user, loading, refreshUser };
}