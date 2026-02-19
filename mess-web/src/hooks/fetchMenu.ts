import API from "@/lib/api";
import { MenuItem, ToastState } from "@/types/common";
import { useCallback, useEffect, useState } from "react";


export function useFetchMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuToast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMenu = useCallback( async()=> {
    try {
      const res = await API.get("/menu/getWeeklyMenu");
      const data = Array.isArray(res?.data.data) ? res?.data.data : [];
      setMenuItems(data);
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      setToast({
        show: true,
        message: "Failed to load menu from server",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [])
  useEffect(() => {
    const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await API.get("/menu/getWeeklyMenu");
      const data = Array.isArray(res?.data.data) ? res?.data.data : [];
      setMenuItems(data);
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      setToast({
        show: true,
        message: "Failed to load menu from server",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  fetchMenu();
  }, []);

   return { menuItems, loading, menuToast, refreshMenu };
}


