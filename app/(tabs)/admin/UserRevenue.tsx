import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";

const { width } = Dimensions.get("window");

export default function UserRevenue() {
  const userId = useLocalSearchParams().userId; // get userId from route params
  const router = useRouter();
  const { allUsers, DarkMode, courses, purchases } = useUserContext();

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

  const [user, setUser] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [coursesRevenue, setCoursesRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (!userId || !purchases.length || !courses.length) return;

  setUser(allUsers.find((u : any) => u.id === userId));

  const creatorPurchases = purchases.filter(
    (p : any) =>
      p.status === "success" &&
      courses.find((c : any) => c.id === p.course_id)?.owner_id === userId
  );

  const total = creatorPurchases.reduce(
    (sum : any, p : any) => sum + (p.creator_amount || 0),
    0
  );

  const map: any = {};

  creatorPurchases.forEach((p : any) => {
    const course = courses.find((c : any) => c.id === p.course_id);
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
}, [purchases, courses, userId]);

  // const requestWithdraw = () => {
  //   Alert.alert(
  //     "Withdraw Request",
  //     "Withdrawal request flow will be added next.",
  //     [{ text: "OK" }]
  //   );
  // };

  const renderCourse = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: TertiaryBackgroundColor }]}>
      <Image
        source={{ uri: item.thumbnail_url }}
        style={styles.thumbnail}
      />

      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.title, { color: textColor }]}>
          {item.title}
        </Text>

        <Text style={{ color: textColor, opacity: 0.7 }}>
          {item.type}
        </Text>

        <Text style={{ color: textColor }}>
          Price: PKR {item.price}
        </Text>

        <Text style={{ color: "#1DCD9F", fontWeight: "700", marginTop: 4, position: 'absolute', top: 10, right: 10 }}>
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

        <Text style={[styles.header, { color: textColor }]}>
          User Earnings
        </Text>

        <View style={{ width: 20 }} />
      </View>

      <View style={[styles.userInfo, { backgroundColor: TertiaryBackgroundColor, padding: 15, margin: 15, borderRadius: 8 }]}>
        <Image
          source={user?.avatar_url ? { uri: user.avatar_url } : require('@/assets/images/Avatar.png')}
          style={{ width: 50, height: 50, borderRadius: 25 }}
        />

        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.title, { color: textColor }]}>
            {user?.name}
          </Text>
          <Text style={{ color: textColor, opacity: 0.7 }}>
            @{user?.username}
          </Text>
        </View>
      </View>

      {/* Total Revenue */}
      <View style={[styles.totalCard, { backgroundColor: TertiaryBackgroundColor }]}>
        <Text style={{ color: textColor, fontSize: 16 }}>
          Total Earnings
        </Text>
        <Text style={{ color: "#1DCD9F", fontSize: 22, fontWeight: "800" }}>
          PKR {totalRevenue.toFixed(0)}
        </Text>

        {/* <TouchableOpacity
          style={[styles.withdrawBtn, { backgroundColor: buttonColor }]}
          onPress={requestWithdraw}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            Request Withdraw
          </Text>
        </TouchableOpacity> */}
      </View>

      {/* Per Course List */}
      <FlatList
        data={coursesRevenue}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          !loading ? (
            <Text
              style={{
                color: textColor,
                opacity: 0.6,
                textAlign: "center",
                marginTop: 30,
              }}
            >
              No earnings yet
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
  },
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
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: "#ccc",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
});
