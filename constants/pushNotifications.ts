import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import api from "./api";

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    Alert.alert("Push Debug", "Not a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Push Debug", "Permission not granted: " + finalStatus);
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    Alert.alert("Push Debug", "Project ID: " + String(projectId));

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    Alert.alert("Push Debug", "Got token: " + tokenData.data);
    return tokenData.data;
  } catch (err: any) {
    Alert.alert("Push Debug", "Error getting token: " + err.message);
    return null;
  }
}

export async function registerAndSavePushToken(): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) {
      Alert.alert("Push Debug", "No push token returned, stopping here.");
      return;
    }

    const savedPushToken = await AsyncStorage.getItem("pushToken");
    if (savedPushToken === pushToken) {
      Alert.alert("Push Debug", "Token unchanged, skipping save.");
      return;
    }

    Alert.alert("Push Debug", "Sending token to backend...");
    await api.post("/users/push-token", { push_token: pushToken });
    await AsyncStorage.setItem("pushToken", pushToken);
    Alert.alert("Push Debug", "Successfully saved to backend!");
  } catch (err: any) {
    Alert.alert(
      "Push Debug",
      "SAVE ERROR: " + (err.response?.data?.error || err.message),
    );
  }
}
