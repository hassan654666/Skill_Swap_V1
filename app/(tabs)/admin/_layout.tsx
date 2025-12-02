import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Admin Dashboard", headerShown: false }} />
      <Stack.Screen name="AdminDashboard" options={{ title: "Admin Dashboard", headerShown: false }} />
      <Stack.Screen name="Users" options={{ title: "Manage Users", headerShown: false }} />
      <Stack.Screen name="ManageUser" options={{ title: "Manage User", headerShown: false }} />
      <Stack.Screen name="ManageCourse" options={{ title: "Manage Course", headerShown: false }} />
      <Stack.Screen name="Course" options={{ title: "Courses", headerShown: false }} />
      <Stack.Screen name="Reports" options={{ title: "Reports", headerShown: false }} />
    </Stack>
  );
}
