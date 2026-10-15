import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import api from "./api";

// ============================================================
// OFFLINE SUPPORT
// 1) Cache-first reads: show the last saved data right away, refresh in the background.
// 2) Action queue: writes made offline (or on a bad connection) are saved on the
//    phone and sent in order once the connection is back.
// ============================================================

const CACHE_PREFIX = "cache:";
const QUEUE_KEY = "offlineQueue:v1";
const MAX_ATTEMPTS = 10;

// ---------- helpers ----------
const getUserId = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return null;
    const id = JSON.parse(raw)?.id;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
};

// No response from the server = no internet, timeout, or server unreachable
export const isNetworkError = (err: any) => !!err && !err.response;

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// A unique id the backend can use to ignore duplicates of the same action
export const newClientId = makeId;

// ---------- cache ----------
export type CacheMeta = {
  fromCache: boolean; // true = showing saved data (fresh data not loaded yet or unreachable)
  savedAt: number | null; // when the saved data was stored
};

const cacheKey = (userId: string, key: string) =>
  `${CACHE_PREFIX}${userId}:${key}`;

export async function readCache<T>(
  key: string,
): Promise<{ data: T; savedAt: number } | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;
    const raw = await AsyncStorage.getItem(cacheKey(userId, key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T) {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await AsyncStorage.setItem(
      cacheKey(userId, key),
      JSON.stringify({ data, savedAt: Date.now() }),
    );
  } catch {
    // storage full or unavailable: caching is optional, ignore
  }
}

// Update saved data in place, e.g. mark a meal as taken while offline
export async function patchCache<T>(key: string, updater: (old: T) => T) {
  const cached = await readCache<T>(key);
  if (!cached) return;
  try {
    await writeCache(key, updater(cached.data));
  } catch {
    // ignore
  }
}

// Same as patchCache, but for every saved key that starts with `prefix`
// (e.g. all "/meals/plan/me" variants, so every screen sees the change)
export async function patchCachePrefix<T>(
  prefix: string,
  updater: (old: T) => T,
) {
  try {
    const userId = await getUserId();
    if (!userId) return;
    const start = cacheKey(userId, prefix);
    const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
      k.startsWith(start),
    );
    for (const k of keys) {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw);
        entry.data = updater(entry.data);
        await AsyncStorage.setItem(k, JSON.stringify(entry));
      } catch {
        // skip entries that do not match the expected shape
      }
    }
  } catch {
    // ignore
  }
}

// Call on logout so the next account never sees this account's data
export async function clearCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (mine.length > 0) await AsyncStorage.multiRemove(mine);
  } catch {
    // ignore
  }
}

/**
 * Cache-first load.
 *  1. If saved data exists, onData() is called with it immediately.
 *  2. Then the fresh data is fetched; onData() is called again and the cache is updated.
 *  3. If the fetch fails but saved data exists, the saved data stays on screen (no error).
 *     If nothing is saved, the error is thrown so the screen can show its usual error.
 */
export async function loadWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T, meta: CacheMeta) => void,
): Promise<T | null> {
  const cached = await readCache<T>(key);
  if (cached) onData(cached.data, { fromCache: true, savedAt: cached.savedAt });

  try {
    const fresh = await fetcher();
    await writeCache(key, fresh);
    onData(fresh, { fromCache: false, savedAt: Date.now() });
    return fresh;
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }
}

// Shortcut for plain GET requests
export function apiGetCached<T = any>(
  url: string,
  onData: (data: T, meta: CacheMeta) => void,
  params?: Record<string, any>,
) {
  const key = params ? `${url}?${JSON.stringify(params)}` : url;
  return loadWithCache<T>(
    key,
    async () => (await api.get(url, { params })).data,
    onData,
  );
}

// ---------- action queue ----------
type Method = "post" | "put" | "patch" | "delete";

export type QueuedAction = {
  id: string;
  userId: string;
  method: Method;
  url: string;
  data?: any;
  createdAt: number;
  attempts: number;
};

const listeners = new Set<(count: number) => void>();

async function readQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// One change to the queue at a time, so quick actions (e.g. "Take all") cannot overwrite each other
let queueLock: Promise<unknown> = Promise.resolve();
function modifyQueue<R>(
  fn: (
    queue: QueuedAction[],
  ) =>
    | Promise<{ queue: QueuedAction[]; result: R }>
    | { queue: QueuedAction[]; result: R },
): Promise<R> {
  const run = queueLock.then(async () => {
    const { queue, result } = await fn(await readQueue());
    await writeQueue(queue);
    return result;
  });
  queueLock = run.catch(() => undefined);
  return run;
}

async function writeQueue(queue: QueuedAction[]) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
  const userId = await getUserId();
  const count = userId ? queue.filter((a) => a.userId === userId).length : 0;
  listeners.forEach((cb) => cb(count));
}

export async function pendingCount(): Promise<number> {
  const userId = await getUserId();
  if (!userId) return 0;
  return (await readQueue()).filter((a) => a.userId === userId).length;
}

async function enqueue(method: Method, url: string, data?: any) {
  const userId = await getUserId();
  if (!userId) return false;
  await modifyQueue((queue) => ({
    queue: [
      ...queue,
      {
        id: makeId(),
        userId,
        method,
        url,
        data,
        createdAt: Date.now(),
        attempts: 0,
      },
    ],
    result: true,
  }));
  return true;
}

let syncing = false;

/**
 * Send queued actions for the current user, in order.
 * Stops at the first network/server problem so the order is kept, and tries again later.
 * An action the server rejects as invalid (4xx) is dropped so it cannot block the rest.
 */
export async function syncQueue(): Promise<{
  sent: number;
  remaining: number;
  dropped: number;
}> {
  if (syncing) return { sent: 0, remaining: await pendingCount(), dropped: 0 };
  syncing = true;
  let sent = 0;
  let dropped = 0;
  try {
    const userId = await getUserId();
    if (!userId) return { sent, remaining: 0, dropped };

    const mine = (await readQueue()).filter((a) => a.userId === userId);
    for (const action of mine) {
      try {
        await api.request({
          method: action.method,
          url: action.url,
          data: action.data,
          timeout: 20000,
        });
        await modifyQueue((q) => ({
          queue: q.filter((a) => a.id !== action.id),
          result: null,
        }));
        sent++;
      } catch (err: any) {
        const status = err?.response?.status;
        if (!status) break; // still offline or timeout: stop, retry later
        if (
          status === 401 ||
          status === 408 ||
          status === 429 ||
          status >= 500
        ) {
          // temporary or auth problem: keep it, count the attempt, stop here
          const gaveUp = await modifyQueue((q) => {
            const idx = q.findIndex((a) => a.id === action.id);
            if (idx < 0) return { queue: q, result: false };
            const next = q.map((a) => ({ ...a }));
            next[idx].attempts += 1;
            if (next[idx].attempts >= MAX_ATTEMPTS) {
              next.splice(idx, 1);
              return { queue: next, result: true };
            }
            return { queue: next, result: false };
          });
          if (gaveUp) dropped++;
          break;
        }
        // 4xx other than the above: the server will never accept it, drop it
        await modifyQueue((q) => ({
          queue: q.filter((a) => a.id !== action.id),
          result: null,
        }));
        dropped++;
      }
    }
  } finally {
    syncing = false;
  }
  return { sent, remaining: await pendingCount(), dropped };
}

const isOnlineState = (s: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) => s.isConnected !== false && s.isInternetReachable !== false;

/**
 * Send a change to the server, or save it for later when there is no connection.
 * Returns { queued: true } when it was saved on the phone: the screen should then
 * update its own state (and patchCache) so the user sees the change immediately.
 * Real server errors (validation etc.) are thrown as usual.
 */
export async function mutate(
  method: Method,
  url: string,
  data?: any,
): Promise<{ queued: boolean; response?: any }> {
  const net = await NetInfo.fetch();
  const online = isOnlineState(net);

  // No connection: save it for later.
  if (!online) {
    await enqueue(method, url, data);
    return { queued: true };
  }

  // Keep the order: if something is already waiting, this action waits behind it.
  if ((await pendingCount()) > 0) {
    await enqueue(method, url, data);
    syncQueue();
    return { queued: true };
  }

  try {
    const response = await api.request({ method, url, data, timeout: 15000 });
    return { queued: false, response };
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueue(method, url, data);
      return { queued: true };
    }
    throw err;
  }
}

// ---------- hooks ----------
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    NetInfo.fetch().then((s) => setOnline(isOnlineState(s)));
    return NetInfo.addEventListener((s) => setOnline(isOnlineState(s)));
  }, []);
  return online;
}

export function usePendingCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    pendingCount().then((c) => active && setCount(c));
    listeners.add(setCount);
    return () => {
      active = false;
      listeners.delete(setCount);
    };
  }, []);
  return count;
}

// Put this once in the root layout: syncs on app start, when the connection returns,
// and when the app comes back to the foreground.
export function useOfflineSync() {
  useEffect(() => {
    syncQueue();
    const unsubNet = NetInfo.addEventListener((s) => {
      if (isOnlineState(s)) syncQueue();
    });
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") syncQueue();
    });
    return () => {
      unsubNet();
      sub.remove();
    };
  }, []);
}
