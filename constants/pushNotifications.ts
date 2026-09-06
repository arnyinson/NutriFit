import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import api from "./api";

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Push notifications require a physical device, not an emulator/simulator
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted.");
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

// Call this AFTER the user is confirmed logged in (e.g. on Dashboard mount)
export async function registerAndSavePushToken(): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) return;

    // Skip the API call if this exact token was already saved before
    const savedPushToken = await AsyncStorage.getItem("pushToken");
    if (savedPushToken === pushToken) {
      console.log("Push token unchanged, skipping save.");
      return;
    }

    await api.post("/users/push-token", { push_token: pushToken });
    await AsyncStorage.setItem("pushToken", pushToken);
    console.log("Push token registered successfully:", pushToken);
  } catch (err) {
    console.error("Push notification registration error:", err);
  }
}
