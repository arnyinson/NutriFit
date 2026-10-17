import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { apiGetCached } from "./offline";

type Listener = (n: number) => void;
const listeners = new Set<Listener>();
let current = 0;

export function publishUnread(n: number) {
  current = n;
  listeners.forEach((l) => l(n));
}

export function useUnreadCount() {
  const [count, setCount] = useState(current);

  useEffect(() => {
    listeners.add(setCount);
    setCount(current);
    return () => {
      listeners.delete(setCount);
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      await apiGetCached<any>(
        "/notifications",
        (data) => {
          const list = data?.notifications || [];
          publishUnread(list.filter((n: any) => !n.is_read).length);
        },
        { type: "all" },
      );
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return count;
}
