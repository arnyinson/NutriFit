import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import OfflineBanner from "../components/OfflineBanner";
import { useOfflineSync } from "../constants/offline";
import { setupNotificationTapListener } from "../constants/pushNotifications";
import { ThemeProvider, useTheme } from "../constants/theme";

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

function AppStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  const router = useRouter();
  useOfflineSync(); // send saved offline changes when the connection returns

  useEffect(() => {
    // Tap on a notification (foreground, background, or app opened from killed state):
    // ticket pushes open /ticket?ticketId=..., others open /notifications
    return setupNotificationTapListener(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider>
      <AppStatusBar />
      <OfflineBanner />
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
