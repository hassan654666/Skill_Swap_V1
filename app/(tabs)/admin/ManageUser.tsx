import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import { FontAwesome } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function ManageUser() {
  const { id } = useLocalSearchParams(); // user_id passed to this screen
  const userId = Array.isArray(id) ? id[0] : id;

  const {usersData, DarkMode} = useUserContext();

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --------- THEME ---------
  // You may replace this with your global theme hook
  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff";
  const linkTextColor = DarkMode ? "#007bffff" : "#0040ffff";
  const buttonTextColor = "#fff";
  const bubbleOneColor = DarkMode ? "#183B4E" : "#3D90D7";
  const bubbleTwoColor = DarkMode ? "#015551" : "#1DCD9F";

  // --------------------
  // FETCH USER DETAILS
  // --------------------
  const fetchUser = async () => {
    try {
      setLoading(true);

      setUser(usersData.find(user => user.id === userId));
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  // --------------------
  // SEND WARNING
  // --------------------
  const sendWarning = async () => {
    if (!warningMessage.trim()) {
      return Alert.alert("Alert", "Please write a warning message.");
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        title: "⚠️ Warning",
        message: warningMessage,
        type: "warning",
      });

      if (error) throw error;

      Alert.alert("Success", "Warning sent.");
      setWarningMessage("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // BAN USER
  // --------------------
  const toggleBan = async () => {
    const newStatus = !user.banned;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({ banned: newStatus })
        .eq("id", userId);

      if (error) throw error;

      Alert.alert("Success", newStatus ? "User banned." : "User unbanned.");
      fetchUser();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // UI
  // --------------------

  if (loading && !user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={buttonColor} />
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: textColor }}>User not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>

        <TouchableOpacity style= { {flexDirection: 'row', paddingHorizontal: 15, marginRight: width * 0.1} } onPress={router.back}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textColor }]}>Manage User</Text>

        <TouchableOpacity style= { {margin: 10, marginLeft: 15,} }>
          {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
          <Text style={{fontSize: 20}}>            </Text>
        </TouchableOpacity>
      </View>
    <ScrollView style={{ width: '100%', flex: 1, backgroundColor }}>
      <View style={{ padding: 20 }}>
        {/* USER HEADER */}
        <View
          style={{
            backgroundColor: SecondaryBackgroundColor,
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Image source= {user?.avatar_url? { uri: user?.avatar_url } : require('@/assets/images/Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: textColor,
              marginBottom: 6,
            }}
          >
            {user.name}
          </Text>
          <Text style={{ color: textColor, marginBottom: 4 }}>
            {user.email}
          </Text>
          <Text style={{ color: user.banned ? redButton : bubbleTwoColor }}>
            {user.banned ? "🚫 BANNED" : "✔ ACTIVE"}
          </Text>
        </View>

        {/* WARNING INPUT */}
        <View
          style={{
            backgroundColor: SecondaryBackgroundColor,
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: textColor, fontSize: 18, marginBottom: 8 }}>
            Send Warning
          </Text>

          <TextInput
            placeholder="Write warning message..."
            placeholderTextColor={textColor}
            style={{
              backgroundColor: inputColor,
              color: textColor,
              padding: 12,
              borderRadius: 10,
              height: 120,
              textAlignVertical: "top",
            }}
            multiline
            value={warningMessage}
            onChangeText={setWarningMessage}
          />

          <TouchableOpacity
            onPress={sendWarning}
            style={{
              backgroundColor: buttonColor,
              maxWidth: '40%',
              padding: 12,
              borderRadius: 10,
              marginTop: 12,
              alignItems: "center",
              alignSelf: 'center',
            }}
          >
            <Text style={{ color: buttonTextColor, fontWeight: "700" }}>
              Send Warning
            </Text>
          </TouchableOpacity>
        </View>

        {/* BAN / UNBAN BUTTON */}
        <TouchableOpacity
          onPress={toggleBan}
          style={{
            backgroundColor: user.banned ? buttonColor : redButton,
            maxWidth: '40%',
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            alignSelf: 'center',
            marginBottom: 40,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {user.banned ? "Unban User" : "Ban User"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
container: { flex: 1, alignItems: "center" },
  topbar: {
    width: "100%",
    height: 64,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 14,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800" 
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',

  },
})