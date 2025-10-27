import { Stack } from "expo-router";

export default function SalesmanStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="add-vendor" />
    </Stack>
  );
}
