import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login/index" />
      <Stack.Screen name="register/index" />
      <Stack.Screen name="dashboard/index" />
      <Stack.Screen name="meal/index" />
      <Stack.Screen name="workout/index" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="progress/index" />
      <Stack.Screen name="achievements/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="calendar/index" />
    </Stack>
  );
}