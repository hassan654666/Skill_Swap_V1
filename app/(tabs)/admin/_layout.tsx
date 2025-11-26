import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Admin Dashboard", headerShown: false }} />
      <Stack.Screen name="Users" options={{ title: "Manage Users", headerShown: false }} />
      <Stack.Screen name="ManageUser" options={{ title: "Manage User", headerShown: false }} />
      <Stack.Screen name="ManageCourses" options={{ title: "Manage Courses", headerShown: false }} />
      <Stack.Screen name="ManageReports" options={{ title: "Manage Courses", headerShown: false }} />
    </Stack>
  );
}
