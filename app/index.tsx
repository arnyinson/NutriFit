import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView } from "react-native";
import { useTheme } from "../constants/theme";

export default function Index() {
  const { colors } = useTheme();
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setHasToken(!!token);
      } catch (err) {
        console.error("Auth check error:", err);
        setHasToken(false);
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, []);

  if (checking) {
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
