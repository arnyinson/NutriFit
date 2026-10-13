import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { Alert } from "react-native";

const API_BASE_URL = "https://nutrifit-backend-api-t21p.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
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
// ACCOUNT_BANNED / ACCOUNT_DEACTIVATED. Log the user out right away and tell
// them why. The login request itself is skipped because the login screen
// already shows its own error message.
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
        // ignore storage errors, we still send the user to the login screen
      }

      const title =
        code === "ACCOUNT_BANNED" ? "Account Banned" : "Account Deactivated";
      const message =
        data?.error ||
        (code === "ACCOUNT_BANNED"
          ? "Your account has been banned. Please contact support if you believe this is a mistake."
          : "Your account has been deactivated. Please contact support.");

      router.replace("/login" as any);
      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            handlingBlockedAccount = false;
          },
        },
      ]);
    }

    return Promise.reject(error);
  },
);

export default api;
