import { useUserContext } from "@/components/UserContext";
import { Link, useRouter } from "expo-router";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, Pressable } from "react-native";
import AdminDashboard from "./AdminDashboard";

export default function AdminTabScreen() {

  const { userData } = useUserContext();
  const router = useRouter();

  const redirect = async () =>{
    if (!userData?.is_admin) {
      router.replace('/(tabs)/Home');
    }
    return true;
  }

  useFocusEffect(
    useCallback(() => {
      redirect();
    }, [userData])
  );

  return (
    <View style={{ flex: 1}}>
      <AdminDashboard />
    </View>
  );
}