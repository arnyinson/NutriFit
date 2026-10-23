import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView } from "react-native";
import {
  consumePendingTarget,
  markAppReady,
} from "../constants/pushNotifications";
import { useTheme } from "../constants/theme";

export default function Index() {
  const { colors } = useTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  // true when we opened a tapped notification ourselves (skip the Redirect)
  const [handedOff, setHandedOff] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      let loggedIn = false;
      try {
        const token = await AsyncStorage.getItem("token");
        loggedIn = !!token;
        setHasToken(loggedIn);
      } catch (err) {
        console.error("Auth check error:", err);
        setHasToken(false);
      }

      if (loggedIn) {
        // From here on, notification taps can navigate directly
        markAppReady();

        // App was opened from a killed state by tapping a push:
        // go to the dashboard first, then open the target on top of it,
        // so Back returns to the dashboard instead of leaving the app.
        const target = consumePendingTarget();
        if (target) {
          setHandedOff(true);
          router.replace("/dashboard" as any);
          setTimeout(() => router.push(target as any), 100);
        }
      }

      setChecking(false);
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking || handedOff) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return <Redirect href={hasToken ? "/dashboard" : "/login"} />;
}
