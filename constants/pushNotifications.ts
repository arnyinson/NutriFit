import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import api from "./api";

// Show notifications even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    console.log("Push notifications need a physical device");
    return null;
  }

  // Android requires a channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#14b8a6",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Push permission not granted");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  if (!projectId) {
    console.log("Missing EAS projectId");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e) {
    console.log("Failed to get push token:", e);
    return null;
  }
}

// Cache is keyed per user, so logging into another account re-posts the token.
export async function registerAndSavePushToken() {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;

    const userStr = await AsyncStorage.getItem("user");
    const userId = userStr ? JSON.parse(userStr)?.id : "anon";
    const cacheValue = `${userId}:${token}`;

    const cached = await AsyncStorage.getItem("pushToken");
    if (cached === cacheValue) return;

    await api.post("/users/push-token", { push_token: token });
    await AsyncStorage.setItem("pushToken", cacheValue);
  } catch (e) {
    console.log("Push token save failed:", e);
  }
}

// Call on logout (and optionally tell backend to drop the token)
export async function clearPushTokenCache() {
  try {
    await AsyncStorage.removeItem("pushToken");
  } catch {}
}

// Call once in app/_layout.tsx:  useEffect(() => setupNotificationTapListener(router), [])
// Backend push must send: data: { type: "ticket", ticket_id: <id> }
export function setupNotificationTapListener(router: {
  push: (p: any) => void;
}) {
  const handle = (data: any) => {
    if (data?.type === "ticket" && data?.ticket_id) {
      router.push(`/ticket?ticketId=${data.ticket_id}` as any);
    } else {
      router.push("/notifications" as any);
    }
  };

  // App opened from a killed state by tapping a notification
  Notifications.getLastNotificationResponseAsync().then((r) => {
    if (r) handle(r.notification.request.content.data);
  });

  const sub = Notifications.addNotificationResponseReceivedListener((r) =>
    handle(r.notification.request.content.data),
  );
  return () => sub.remove();
}
