import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, useColorScheme, Alert, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import CustomDrawer from "@/components/customDrawer";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

interface MeetingRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  proposed_datetime: string;
  reschedule_of: string;
  status: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function Request() {
  const { userData, usersData, DarkMode } = useUserContext();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [request, setRequest] = useState<MeetingRequest | null>(null);
  const [original, setOriginal] = useState<MeetingRequest | null>(null);
  const [senderProfile, setSenderProfile] = useState<Profile | null>(null);
  const [handled, setHandled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const { meetingId } = useLocalSearchParams<{ meetingId?: string }>();

  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
  const buttonTextColor = "#fff";

  // Fetch meeting request
  const fetchRequest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meeting_requests")
      .select("*")
      .eq("id", meetingId)
      .eq("receiver_id", userData?.id)
      .eq("status", "pending")
      .single();

    if (error) {
      console.error("Error fetching meeting request:", error);
      setLoading(false);
      return;
    }

    setRequest(data || null);

    if (data?.requester_id) fetchSenderProfile(data.requester_id);
    else setLoading(false);
  };

  // Fetch meeting request
  const fetchOriginal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meeting_requests")
      .select("*")
      .eq("id", request?.reschedule_of)
      .single();

    if (error) {
      console.error("Error fetching meeting request:", error);
      setLoading(false);
      return;
    }

    setOriginal(data || null);

    if (data?.requester_id) fetchSenderProfile(data.requester_id);
    else setLoading(false);
  };

  // Fetch sender profile from profiles table
    const fetchSenderProfile = (sender_id: string) => {
    if (!usersData || usersData.length === 0) return;

    const sender = usersData.find((user: any) => user.id === sender_id);

    if (sender) {
        setSenderProfile({
        id: sender.id,
        name: sender.name,
        avatar_url: sender.avatar_url,
        });
    } else {
        console.warn("Sender not found in usersData for ID:", sender_id);
    }

    setLoading(false);
    };


  const handleAccept = async (id: string) => {
    const { error } = await supabase.from("meeting_requests").update({ status: "accepted" }).eq("id", id);
    if (error) Alert.alert("Error", error.message);
    else {  
      const { error: userError } = await supabase.from("schedules").insert({
        user_id: userData?.id,
        partner_id: senderProfile?.id,
        meeting_id: id,
        datetime: request?.proposed_datetime,
        status: "scheduled",
      });
      if (userError) Alert.alert("Error", userError.message);
      if (request?.reschedule_of){
        const { error: senderError } = await supabase.from("schedules").delete().eq('meeting_id', original?.id ? original.id : request.reschedule_of);
        if (senderError) Alert.alert("Error", senderError.message);
      }
      Alert.alert("Accepted", "Meeting has been added to your schedule.");
      const { error: notifError } = await supabase.from("notifications").update({ read: true }).eq("meeting_id", id);
      if (notifError) Alert.alert("Error", notifError.message);
      setHandled(true);
      fetchRequest();
    }
  };

  const handleDecline = async (id: string) => {
    const { error } = await supabase.from("meeting_requests").update({ status: "declined" }).eq("id", id);
    if (error) Alert.alert("Error", error.message);
    else {
      const { error: notifError } = await supabase.from("notifications").update({ read: true }).eq("meeting_id", id);
      if (notifError) Alert.alert("Error", notifError.message);
      Alert.alert("Declined", "Meeting request has been declined.");
      fetchRequest();
      setHandled(true);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, []);

  useEffect(() => {
    if(request?.reschedule_of){
        fetchOriginal();
    }
  }, [request]);

  if (loading)
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={buttonColor} />
      </View>
    );

  if (!request)
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.noRequestText, { color: textColor }]}>No pending meeting request found.</Text>
      </View>
    );

  const formattedDate = new Date(request.proposed_datetime).toDateString();
  const formattedTime = new Date(request.proposed_datetime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedOriginalDate = original?.proposed_datetime
    ? new Date(original.proposed_datetime).toDateString()
    : "";
  const formattedOriginalTime = original?.proposed_datetime
    ? new Date(original.proposed_datetime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>
        <FontAwesome
          name="bars"
          size={22}
          color={textColor}
          style={{ margin: 15 }}
          onPress={() => setDrawerVisible(true)}
        />
        <TouchableOpacity style={{ marginRight: 20 }}>
          <Image
            source={userData?.avatar_url ? { uri: userData.avatar_url } : require("./Avatar.png")}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: SecondaryBackgroundColor }]}>
        {!request.reschedule_of ? (<Text style={[styles.title, { color: textColor }]}>📬 Meeting Request</Text>) : 
        (<Text style={[styles.title, { color: textColor }]}>📬 Reschedule Request</Text>)}
        {senderProfile && (
          <View style={styles.senderInfo}>
            <Image
              source={
                senderProfile.avatar_url
                  ? { uri: senderProfile.avatar_url }
                  : require("./Avatar.png")
              }
              style={styles.senderAvatar}
            />
            <Text style={[styles.senderName, { color: textColor }]}>
              From:{" "}
              <Text style={{ fontWeight: "bold", color: textColor }}>{senderProfile.name}</Text>
            </Text>
          </View>
        )}

        {original && (<View style={styles.details}>
          <Text style={[styles.label, { color: textColor, marginBottom: 10 }]}>Original schedule:</Text>
          <Text style={[styles.label, { color: textColor }]}>Date</Text>
          <Text style={[styles.value, { color: textColor }]}>{formattedOriginalDate}</Text>

          <Text style={[styles.label, { color: textColor, marginTop: 10 }]}>Time</Text>
          <Text style={[styles.value, { color: textColor }]}>{formattedOriginalTime}</Text>
        </View>)}

        <View style={styles.details}>
          <Text style={[styles.label, { color: textColor, marginBottom: 10 }]}>Proposed schedule:</Text>
          <Text style={[styles.label, { color: textColor }]}>Date</Text>
          <Text style={[styles.value, { color: textColor }]}>{formattedDate}</Text>

          <Text style={[styles.label, { color: textColor, marginTop: 10 }]}>Time</Text>
          <Text style={[styles.value, { color: textColor }]}>{formattedTime}</Text>
        </View>

        <View style={styles.buttonRow}>
          {!handled && (<TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => handleAccept(request.id)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>)}

          {!handled && (<TouchableOpacity
            style={[styles.button, { backgroundColor: redButton }]}
            onPress={() => handleDecline(request.id)}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>)}
        </View>
      </View>

      <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", alignItems: "center" },
  topbar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  card: {
    width: "90%",
    borderRadius: 14,
    padding: 20,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  senderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  senderName: {
    fontSize: 17,
    flexShrink: 1,
  },
  details: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    fontSize: 18,
    fontWeight: "400",
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  noRequestText: {
    marginTop: 50,
    fontSize: 18,
    fontWeight: "500",
  },
});
