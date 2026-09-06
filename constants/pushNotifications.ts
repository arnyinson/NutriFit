import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import api from "./api";

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
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

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    console.error("Error getting push token:", err);
    return null;
  }
}

export async function registerAndSavePushToken(): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) return;

    const savedPushToken = await AsyncStorage.getItem("pushToken");
    if (savedPushToken === pushToken) return;

    await api.post("/users/push-token", { push_token: pushToken });
    await AsyncStorage.setItem("pushToken", pushToken);
    console.log("Push token registered successfully.");
  } catch (err) {
    console.error("Push notification registration error:", err);
  }
}
