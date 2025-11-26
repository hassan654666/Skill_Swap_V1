import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, useColorScheme, Alert, ActivityIndicator, Dimensions } from "react-native";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import CustomDrawer from "@/components/customDrawer";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

interface MeetingRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  proposed_datetime: string;
  reschedule_of: string;
  zoom_link: string;
  status: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

const { width, height } = Dimensions.get("window");

export default function Request() {
  const { userData, usersData, DarkMode } = useUserContext();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [request, setRequest] = useState<MeetingRequest | null>(null);
  const [original, setOriginal] = useState<MeetingRequest | null>(null);
  const [senderProfile, setSenderProfile] = useState<Profile | null>(null);
  const [handled, setHandled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [zoomMeetingId, setZoomMeetingId] = useState<string | null>(null);
  const { meetingId } = useLocalSearchParams<{ meetingId?: string }>();

  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
  const buttonTextColor = "#fff";
  const { supabaseUrl, supabaseAnonKey, sdkKey } = Constants.expoConfig?.extra || {};

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

  // Fetch original meeting request
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

  // Fetch meeting request
  const fetchZoomMeeting = async () => {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_id", original?.id || request?.reschedule_of || request?.id)
      .single();

    if (error) {
      console.error("Error fetching meeting request:", error);
      return;
    }

    setZoomMeetingId(data.zoom_meeting_id || null);
  };

  // 🔹 Create a meeting via Edge Function
  const createMeeting = async () => {
    if (!userData?.id || !senderProfile?.id) {
      Alert.alert("Error", "Missing user or partner ID.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://saxuhvcppykdazdfosae.supabase.co/functions/v1/create-zoom-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          meeting_request_id: meetingId,
          host_id: userData.id,
          guest_id: senderProfile.id,
          topic: "Skill Swap Meeting",
          start_time: request?.proposed_datetime,
          duration: 40,
        }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) throw new Error(data?.error || text);

    } catch (err: any) {
      console.error("❌ Meeting creation error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Reschedule a meeting via Edge Function
  const rescheduleMeeting = async () => {
    if (!userData?.id || !senderProfile?.id) {
      Alert.alert("Error", "Missing user or partner ID.");
      return;
    }

    console.log("Meeting ID:", meetingId);
    console.log("Zoom Meeting ID:", zoomMeetingId);
    console.log("User ID:", userData?.id);
    console.log("Sender Profile ID:", senderProfile?.id);
    console.log("Request Proposed Datetime:", request?.proposed_datetime);

    setLoading(true);

    try {
      const res = await fetch("https://saxuhvcppykdazdfosae.supabase.co/functions/v1/reschedule-zoom-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          meeting_request_id: meetingId,
          zoom_meeting_id: zoomMeetingId,
          // host_id: userData.id,
          // guest_id: senderProfile.id,
          topic: "Skill Swap Meeting",
          start_time: request?.proposed_datetime,
          duration: 40,
        }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) throw new Error(data?.error || text);

    } catch (err: any) {
      console.error("❌ Meeting reschedule error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    const { error } = await supabase.from("meeting_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) 
      Alert.alert("Error", error.message); 

    const { error: userError } = await supabase.from("schedules").insert({
      user_id: userData?.id,
      partner_id: senderProfile?.id,
      meeting_id: id,
      datetime: request?.proposed_datetime,
      status: "Scheduled",
    });
    if (userError) 
      Alert.alert("Error", userError.message);

    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: senderProfile?.id,
      type: "accepted",
      title: request?.reschedule_of ? "Reschedule Request Accepted" : "Meeting Request Accepted",
      message: request?.reschedule_of ? "Your reschedule request has been accepted" : "Your meeting request has been accepted",
      meeting_id: id,
      read: false,
    });
    if (notifyError) 
      Alert.alert("Error", notifyError.message);

    if (request?.reschedule_of){
      
      const { error: senderError } = await supabase.from("schedules").delete().eq('meeting_id', original?.id ? original.id : request.reschedule_of);
      if (senderError) 
        Alert.alert("Error", senderError.message);

      rescheduleMeeting();
    } else {
      createMeeting();
    }
    Alert.alert("Accepted", "Meeting has been added to your schedule.");
    const { error: notifError } = await supabase.from("notifications").update({ read: true }).eq("meeting_id", id).eq("user_id", userData.id);
    if (notifError) 
      Alert.alert("Error", notifError.message);

    setHandled(true);
    fetchRequest();
  };

  const handleDecline = async (id: string) => {
    const { error } = await supabase.from("meeting_requests").update({ status: "declined", updated_at: new Date().toISOString(), }).eq("id", id);
    if (error) Alert.alert("Error", error.message);
    else {
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: senderProfile?.id,
        type: "declined",
        title: request?.reschedule_of ? "Reschedule Request Declined" : "Meeting Request Declined",
        message: request?.reschedule_of ? "Your reschedule request has been declined" : "Your meeting request has been declined",
        meeting_id: id,
        read: false,
      });
      if (notifyError) Alert.alert("Error", notifyError.message);
      const { error: notifError } = await supabase.from("notifications").update({ read: true }).eq("meeting_id", id).eq("user_id", userData.id);
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
    if(request?.zoom_link){
      fetchZoomMeeting();
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
        {/* <FontAwesome
          name="bars"
          size={22}
          color={textColor}
          style={{ margin: 15 }}
          onPress={() => setDrawerVisible(true)}
        /> */}
        <Text style={[styles.title, { color: textColor }]}>Request</Text>
        {/* <TouchableOpacity style={{ marginRight: 20 }}>
          <Image
            source={userData?.avatar_url ? { uri: userData.avatar_url } : require("./Avatar.png")}
            style={styles.avatar}
          />
        </TouchableOpacity> */}
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
  container: { 
    flex: 1, 
    justifyContent: "flex-start", 
    alignItems: "center" 
  },
  topbar: {
    flexDirection: "row",
    width: "100%",
    height: height * 0.06,
    justifyContent: "center",
    alignItems: "center",
    //paddingVertical: 10,
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
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center' 
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
