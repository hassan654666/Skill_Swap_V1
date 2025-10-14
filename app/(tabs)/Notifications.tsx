import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, Alert, BackHandler } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { useUserContext } from "@/components/UserContext";
import { supabase } from "@/lib/supabase";

export default function Notifications() {
  const { userData, DarkMode, session } = useUserContext();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#626262" : "#C7C7C7";
  const SecondaryBackgroundColor = DarkMode ? "#7F8487" : "#B2B2B2";
  const buttonColor = DarkMode ? "#333" : "#007BFF";
  const buttonTextColor = "#fff";

  const [notifications, setNotifications] = useState<any[]>([]);

  // 🧠 Fetch notifications for the current user
  const fetchNotifications = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData?.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching notifications:", error);
    else setNotifications(data || []);
  };

  useEffect(() => {
    fetchNotifications();
  }, [session]);

//   const handleNotificationPress = (item: any) => {
//     if (item.type === "meeting_request") {
//       router.push({
//         pathname: '/MeetingDetails',
//         params: { meetingId: item.meeting_id },
//       });
//     } else if (item.type === "meeting_link") {
//       router.push({
//         pathname: '/Chat',
//         params: { receiverId: item.sender_id },
//       });
//     } else {
//       Alert.alert("Notification", item.message);
//     }
//   };

    const backAction = () => {
        navigation.navigate('Home');
        //navigation.navigate('Inbox'); 
        return true; 
    };

    useFocusEffect(
        useCallback(() => {    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
        }, [])
    );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { backgroundColor: SecondaryBackgroundColor }]}
    //   onPress={() => handleNotificationPress(item)}
    >
      <FontAwesome name="bell" size={20} color={buttonColor} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
        <Text style={[styles.message, { color: textColor }]}>{item.message}</Text>
        <Text style={[styles.time, { color: textColor }]}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor }]}>
        <TouchableOpacity style={{ margin: 10, marginLeft: 15 }} onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: textColor }]}>Notifications</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="bell-slash" size={60} color={buttonColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  topbar: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    width: "100%",
    height: 60,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
});
