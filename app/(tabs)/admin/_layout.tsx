import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Admin Dashboard", headerShown: false }} />
      <Stack.Screen name="AdminDashboard" options={{ title: "Admin Dashboard", headerShown: false }} />
      <Stack.Screen name="Users" options={{ title: "Manage Users", headerShown: false }} />
      <Stack.Screen name="courses" options={{ title: "Manage Courses", headerShown: false }} />
      <Stack.Screen name="reports" options={{ title: "Reports", headerShown: false }} />
    </Stack>
  );
}
