import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ThemeProvider } from "../constants/theme";

// How notifications should appear while the app is open (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Listener for when the user taps a notification (foreground or background)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "Notification tapped:",
          response.notification.request.content.data,
        );
        // Could navigate to the Ticket screen here if type === 'ticket_response'
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
        <Stack.Screen name="verify-otp/index" />
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