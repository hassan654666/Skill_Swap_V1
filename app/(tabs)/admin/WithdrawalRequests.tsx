import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";

const { width, height } = Dimensions.get("window");

export default function WithdrawalRequests() {
  const router = useRouter();
  const { userData, allUsers, DarkMode, courses, purchases } = useUserContext();

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

  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWithdraws = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("withdraws")
      .select("*")
      .eq("status", "pending")
      .neq("user_id", userData.id)
      .order("requested_at", { ascending: false });

    setLoading(false);

    console.log("Withdraws data:", data, "Error:", error);
    
    if (!error) setWithdraws(data || []);
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  // ✅ APPROVE
  const approveWithdraw = async (item: any) => {
  Alert.alert("Confirm", "Approve this withdrawal?", [
    { text: "Cancel" },
    {
      text: "Approve",
      onPress: async () => {
        try {
          setLoading(true);

          // 1️⃣ Mark withdraw as done
          await supabase
            .from("withdraws")
            .update({ status: "done" })
            .eq("id", item.id);

          // 2️⃣ Get creator's courses
          const creatorCourseIds = courses
            .filter((c: any) => c.owner_id === item.user_id)
            .map((c: any) => c.id);

          if (creatorCourseIds.length > 0) {
            // 3️⃣ Reset creator_amount ONLY for those courses
            await supabase
              .from("purchases")
              .update({ creator_amount: 0 })
              .in("course_id", creatorCourseIds)
              .gt("creator_amount", 0);
          }

          // 4️⃣ Notify user
          await supabase.from("notifications").insert({
            user_id: item.user_id,
            title: "Withdrawal Approved",
            message: `Your withdrawal of PKR ${item.amount} has been approved.`,
          });

          fetchWithdraws();
        } catch (e) {
          console.error(e);
          Alert.alert("Error", "Something went wrong");
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};

  // ❌ REJECT
  const rejectWithdraw = async (item: any) => {
    Alert.alert("Confirm", "Reject this withdrawal?", [
      { text: "Cancel" },
      {
        text: "Reject",
        onPress: async () => {
          setLoading(true);

          await supabase
            .from("withdraws")
            .update({ status: "rejected" })
            .eq("id", item.id);

          await supabase.from("notifications").insert({
            user_id: item.user_id,
            title: "Withdrawal Rejected",
            message: "Your withdrawal request was rejected by admin.",
          });

          setLoading(false);
          fetchWithdraws();
        },
      },
    ]);
  };

  const renderItem = ({ item }: any) => {
    const user = allUsers.find((u: any) => u.id === item.user_id);

    return(

    <View style={[styles.card, { backgroundColor: TertiaryBackgroundColor, marginTop: 15 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>  
        <Image
            source={user?.avatar_url ? { uri: user.avatar_url } : require('@/assets/images/Avatar.png')}
            style={{ width: width * 0.15, height: width * 0.15, borderRadius: 90, marginBottom: 10 }}
        />
        <View style={{ flexDirection: 'column', marginLeft: width * 0.03 }}>
            <Text style={[styles.name, { color: textColor }]}>{user?.name}</Text>
            <Text style={{ color: textColor, opacity: 0.7 }}>@{user?.username}</Text>
            <Text style={[styles.name, { width: width * 0.5, color: textColor }]}>JazzCash name: {item.name}</Text>
            <Text style={{ color: textColor, opacity: 1 }}>
                Phone: {item.phone_number}
            </Text>
            <Text style={{ color: textColor }}>
                Amount: PKR {item.amount}
            </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: buttonColor }]}
          onPress={() => approveWithdraw(item)}
        >
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: redButton }]}
          onPress={() => rejectWithdraw(item)}
        >
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
      
    </View>
    );
    };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: SecondaryBackgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: textColor }]}>
          Withdrawal Requests
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <FlatList
        data={withdraws}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ textAlign: "center", color: textColor, marginTop: 40 }}>
              No pending requests
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    height: 55,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: { fontSize: 18, fontWeight: "700" },
  card: {
    width: "90%",
    alignSelf: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  name: { fontSize: 16, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 5,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
