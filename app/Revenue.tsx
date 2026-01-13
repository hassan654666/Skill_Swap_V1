import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";

const { width } = Dimensions.get("window");

export default function Revenue() {
  const router = useRouter();
  const { userData, DarkMode, courses, purchases } = useUserContext();

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

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [coursesRevenue, setCoursesRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate earnings
  useEffect(() => {
    if (!userData?.id || !purchases.length || !courses.length) return;

    const creatorPurchases = purchases.filter(
      (p: any) =>
        p.status === "success" &&
        courses.find((c: any) => c.id === p.course_id)?.owner_id === userData.id
    );

    const total = creatorPurchases.reduce(
      (sum: any, p: any) => sum + (p.creator_amount || 0),
      0
    );

    const map: any = {};

    creatorPurchases.forEach((p: any) => {
      const course = courses.find((c: any) => c.id === p.course_id);
      if (!course) return;

      if (!map[course.id]) {
        map[course.id] = {
          ...course,
          earnings: 0,
        };
      }

      map[course.id].earnings += p.creator_amount || 0;
    });

    setTotalRevenue(total);
    setCoursesRevenue(Object.values(map));
  }, [purchases, courses, userData?.id]);

  // Submit withdrawal request
  const submitWithdraw = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Please enter both name and phone number.");
      return;
    }

    if (totalRevenue <= 0) {
      Alert.alert("No Earnings", "You have no earnings to withdraw.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.from("withdraws").insert([
      {
        user_id: userData.id,
        name: name.trim(),
        phone_number: phone.trim(),
        amount: totalRevenue,
        status: "pending",
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.log(error);
      Alert.alert("Error", "Failed to submit withdrawal request.");
      return;
    }

    Alert.alert("Success", "Withdrawal request submitted successfully.");
    setModalVisible(false);
    setName("");
    setPhone("");
  };

  const renderCourse = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: TertiaryBackgroundColor }]}>
      <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
        <Text style={{ color: textColor, opacity: 0.7 }}>{item.type}</Text>
        <Text style={{ color: textColor }}>Price: PKR {item.price}</Text>
        <Text
          style={{
            color: "#1DCD9F",
            fontWeight: "700",
            marginTop: 4,
            position: "absolute",
            top: 10,
            right: 10,
          }}
        >
          Earnings: PKR {item.earnings.toFixed(0)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: SecondaryBackgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: textColor }]}>Earnings</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Total Revenue */}
      <View style={[styles.totalCard, { backgroundColor: TertiaryBackgroundColor }]}>
        <Text style={{ color: textColor, fontSize: 16 }}>Total Earnings</Text>
        <Text style={{ color: "#1DCD9F", fontSize: 22, fontWeight: "800" }}>
          PKR {totalRevenue.toFixed(0)}
        </Text>

        <TouchableOpacity
          style={[styles.withdrawBtn, { backgroundColor: buttonColor }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Request Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Per Course List */}
      <FlatList
        data={coursesRevenue}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: textColor, opacity: 0.6, textAlign: "center", marginTop: 30 }}>
              No earnings yet
            </Text>
          ) : null
        }
      />

      {/* Withdrawal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: TertiaryBackgroundColor }]}>
            <Text style={[styles.modalHeader, { color: textColor }]}>Withdraw Request</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your JazzCash name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: buttonColor }]}
              onPress={submitWithdraw}
              disabled={submitting}
            >
              <Text style={{ color: buttonTextColor, fontWeight: "700" }}>
                {submitting ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: redButton, marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: buttonTextColor }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  totalCard: {
    width: "90%",
    alignSelf: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 15,
  },
  withdrawBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    width: "90%",
    alignSelf: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  thumbnail: { width: 70, height: 70, borderRadius: 6, backgroundColor: "#ccc" },
  title: { fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 8,
    padding: 20,
  },
  modalHeader: { fontSize: 18, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
});
