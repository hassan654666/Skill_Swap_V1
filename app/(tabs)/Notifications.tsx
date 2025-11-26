import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, Alert, BackHandler, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { useUserContext } from "@/components/UserContext";
import { supabase } from "@/lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

export default function Notifications() {
  const { userData, DarkMode, session } = useUserContext();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // 🎨 Color palette
  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
  const linkTextColor = DarkMode ? "#007bffff" : "#0040ffff";
  const buttonTextColor = "#fff";
  const bubbleOneColor = DarkMode ? '#183B4E' : '#3D90D7';
  const bubbleTwoColor = DarkMode ? '#015551' : '#1DCD9F';

  const [notifications, setNotifications] = useState<any[]>([]);

  const CACHE_KEY = `user_notifications${userData.id}`;

  useEffect(() => {
    const loadCachedNotifications = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setNotifications(parsedData);
        }
      } catch (error) {
        console.error('Failed to load cached schedule:', error);
      }
    };
    loadCachedNotifications();
  }, [userData?.id]);

  // 🧠 Fetch notifications for the current user
  const fetchNotifications = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []); 
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
  };

  useEffect(() => {
    fetchNotifications();
     const chatChannel = supabase
      .channel('notification')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData?.id}`,
        },
        (payload) => {
          if(!payload.new) return;
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [userData?.id]);

  const handleNotificationPress = async (item: any) => {
    if ((item.type === "meeting_request" && item.read === false) || (item.type === "reschedule" && item.read === false)) {
      router.push({
        pathname: '/Request',
        params: { meetingId: item.meeting_id },
      });
    } else if (item.type === "meeting_link") {
      
      const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("*")
      .eq("meeting_id", item.meeting_id)
      .single()
      if(scheduleError) console.error('Error fetching schedule: ', scheduleError);

      if(schedule.status !== "Missed" && schedule.status !== "Completed"){

        const updatedjoined = Array.isArray(schedule?.joined)
          ? [...new Set([...schedule.joined, userData?.id])]
          : [userData?.id];

        const { data: sched, error: schedError } = await supabase
        .from("schedules")
        .update({ joined:  updatedjoined})
        .eq("meeting_id", schedule.meeting_id)
        .single()
        if(schedError) console.error('Error marking meeting joined: ', schedError);

        const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("meeting_id", item.meeting_id)
        .single()
        if(error) console.error('Error fetching meeting: ', error);

        const partnerId = data.host_id === item.user_id ? data.guest_id : data.host_id;
        router.push({
          pathname: '/Meeting',
          params: { 
            partnerId: partnerId, 
            meetingId: data.zoom_meeting_id, 
            password: data.zoom_password, 
            Link: data.zoom_join_url 
          },
        });
      } else {
        Alert.alert("Meeting Inactive", "This meeting is either missed or completed.");
      }
      
    } else if (item.type === "meeting_missed"){
      Alert.alert("Meeting Missed", 'You missed a scheduled meeting')
    } else if (item.type === "accepted"){
      Alert.alert("Request Accepted", 'Your meeting request has been accepted');
    } else {
      Alert.alert(`${item.title}`, item.message);
    }
  };

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
      onPress={() => handleNotificationPress(item)}
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
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>
        {/* <TouchableOpacity style={{ margin: 10, marginLeft: 15 }} onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity> */}
        <Text style={[styles.headerText, { color: textColor }]}>Notifications</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="bell-slash" size={60} color={buttonColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          style={{ width: '100%' }}
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
    // position: "absolute",
    // top: 0,
    flexDirection: "row",
    width: "100%",
    height: height * 0.06,
    //gap: width * 0.25,
    alignItems: "center",
    justifyContent: 'center'
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
