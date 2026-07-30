import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import api from "../constants/api";
import { ThemeProvider } from "../constants/theme";

// Kung paano ipapakita ang notification habang bukas ang app (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  // Push notifications ay hindi gumagana sa emulator/simulator, kailangan ng totoong device
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

export default function RootLayout() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        // Kunin lang kung may naka-login na user (may token sa AsyncStorage)
        const authToken = await AsyncStorage.getItem("token");
        if (!authToken) return;

        const pushToken = await registerForPushNotificationsAsync();
        if (!pushToken) return;

        // I-check kung nagbago ang token bago tumawag sa backend (iwasan ang unnecessary requests)
        const savedPushToken = await AsyncStorage.getItem("pushToken");
        if (savedPushToken === pushToken) return;

        await api.post("/users/push-token", { push_token: pushToken });
        await AsyncStorage.setItem("pushToken", pushToken);
        console.log("Push token registered successfully.");
      } catch (err) {
        console.error("Push notification setup error:", err);
      }
    };

    setupPushNotifications();

    // Listener kapag tinap ng user ang notification (habang bukas o sarado ang app)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "Notification tapped:",
          response.notification.request.content.data,
        );
        // Dito pwede tayong mag-navigate papunta sa Ticket screen kung type === 'ticket_response'
      });

    return () => {
      responseListener.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login/index" />
        <Stack.Screen name="forgot-password/index" />
        <Stack.Screen name="register/index" />
        <Stack.Screen name="dashboard/index" />
        <Stack.Screen name="meal/index" />
        <Stack.Screen name="workout/index" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="progress/index" />
        <Stack.Screen name="achievements/index" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="calendar/index" />
        <Stack.Screen name="ticket/index" />
      </Stack>
    </ThemeProvider>
  );
}
