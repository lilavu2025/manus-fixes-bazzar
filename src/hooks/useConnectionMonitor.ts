import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseConnectionMonitorOptions {
  onReconnect?: () => void;
  onDisconnect?: () => void;
  checkInterval?: number; // بالميلي ثانية
}

export const useConnectionMonitor = (
  options: UseConnectionMonitorOptions = {},
) => {
  const {
    onReconnect,
    onDisconnect,
    checkInterval = 30000, // 30 ثانية افتراضياً
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isOnlineRef = useRef(navigator.onLine);
  const lastCheckRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // فحص الاتصال بقاعدة البيانات
  const checkDatabaseConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      return !error;
    } catch (error) {
      console.error("Database connection check failed:", error);
      return false;
    }
  }, []);

  // تم حذف مراقبة الاتصال من خارج AuthContext. استخدم AuthContext فقط لأي منطق جلسة أو مراقبة اتصال.
  useEffect(() => {
    return () => {
      // window.removeEventListener('online', handleOnline);
      // window.removeEventListener('offline', handleOffline);
    };
  }, [onReconnect, onDisconnect]);

  // تم حذف مراقبة حالة visibility من خارج AuthContext. استخدم AuthContext فقط لأي منطق جلسة أو مراقبة اتصال.
  useEffect(() => {
    return () => {
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkDatabaseConnection, onReconnect, onDisconnect]);

  // فحص دوري للاتصال (فقط عندما تكون الصفحة مرئية)
  useEffect(() => {
    const startPeriodicCheck = () => {
      intervalRef.current = setInterval(async () => {
        if (document.visibilityState === "visible") {
          const isConnected = await checkDatabaseConnection();
          const wasOnline = isOnlineRef.current;
          if (!isConnected && wasOnline) {
            isOnlineRef.current = false;
            setIsOnline(false);
            onDisconnect?.();
          } else if (isConnected && !wasOnline) {
            isOnlineRef.current = true;
            setIsOnline(true);
            onReconnect?.();
          }
          lastCheckRef.current = Date.now();
        }
      }, checkInterval);
    };
    startPeriodicCheck();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInterval, checkDatabaseConnection, onReconnect, onDisconnect]);

  return {
    isOnline,
    checkConnection: checkDatabaseConnection,
  };
};
