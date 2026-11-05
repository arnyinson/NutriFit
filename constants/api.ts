import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

const API_BASE_URL = "https://nutrifit-backend-api-t21p.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatic na maglalagay ng token sa bawat request kung naka-login
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the admin bans or deactivates the account while the user is still logged
// in (the JWT lasts 30 days), the backend answers every request with
// ACCOUNT_BANNED / ACCOUNT_DEACTIVATED. Log the user out right away.
// Banned users go to the Banned screen (reason + appeal); deactivated users
// get an alert. The login request itself is skipped because the login screen
// handles its own errors.
let handlingBlockedAccount = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const data = error?.response?.data;
    const code = data?.code;
    const isLoginRequest = String(error?.config?.url || "").includes(
      "/auth/login",
    );

    if (
      !isLoginRequest &&
      (code === "ACCOUNT_BANNED" || code === "ACCOUNT_DEACTIVATED") &&
      !handlingBlockedAccount
    ) {
      handlingBlockedAccount = true;
      try {
        await AsyncStorage.multiRemove(["token", "user"]);
      } catch {
        // ignore storage errors, we still send the user away
      }

      // Banned and deactivated users both go to the same screen (reason +
      // appeal). It is not an alert any more.
      router.replace({
        pathname: "/banned",
        params: {
          kind: code === "ACCOUNT_BANNED" ? "banned" : "deactivated",
          reason: data?.ban_reason || "",
          appealToken: data?.appealToken || "",
        },
      } as any);
      setTimeout(() => {
        handlingBlockedAccount = false;
      }, 3000);
    }

    return Promise.reject(error);
  },
);

export default api;
