import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUserContext } from "@/components/UserContext";

export default function Revenue({ searchText }: { searchText: string }) {
  const router = useRouter();
  const { DarkMode, allUsers, courses, purchases } = useUserContext();

  // Colors
  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";

  const [user, setUser] = useState();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAdminRevenue, setTotalAdminRevenue] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [usersRevenue, setUsersRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!purchases.length || !courses.length) return;

    const successful = purchases.filter((p : any) => p.status === "success");

    // Total revenue (creator + admin)
    const total = successful.reduce(
      (sum : any, p : any) => sum + (p.creator_amount || 0) + (p.commission || 0),
      0
    );

    // Total admin revenue (commissions)
    const adminRev = successful.reduce(
      (sum : any, p : any) => sum + (p.commission || 0),
      0
    );

    // Total payable (creator_amount)
    const payable = successful.reduce(
      (sum : any, p : any) => sum + (p.creator_amount || 0),
      0
    );

    // Per-user total payable
    const userMap: any = {};
    successful.forEach((p : any) => {
      const course = courses.find((c : any) => c.id === p.course_id);
      if (!course) return;

      if (!userMap[course.owner_id]) {
        userMap[course.owner_id] = {
          owner_id: course.owner_id,
          totalPayable: 0,
          courses: {},
        };
      }

      userMap[course.owner_id].totalPayable += p.creator_amount || 0;

      if (!userMap[course.owner_id].courses[course.id]) {
        userMap[course.owner_id].courses[course.id] = {
          ...course,
          earnings: 0,
        };
      }

      userMap[course.owner_id].courses[course.id].earnings += p.creator_amount || 0;
      setUser(allUsers.find((u : any) => u.id === userMap[u.id]?.owner_id));
    });

    const usersArr = Object.values(userMap).map((u: any) => ({
      owner_id: u.owner_id,
      user: allUsers.find((usr : any) => usr.id === u.owner_id),
      totalPayable: u.totalPayable,
      courses: Object.values(u.courses),
    }));

    setTotalRevenue(total);
    setTotalAdminRevenue(adminRev);
    setTotalPayable(payable);
    setUsersRevenue(usersArr);
  }, [purchases, courses]);

  const searchData = usersRevenue.filter((item: any) => {
    if (!searchText.trim()) return true;
    return item.user?.name
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
  });

  const renderUser = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: TertiaryBackgroundColor }]}
      onPress={() =>
        router.push({
          pathname: "/admin/UserRevenue",
          params: { userId: item.owner_id },
        })
      }
    >
      <Image
        source={item.user?.avatar_url ? { uri: item.user.avatar_url } : require('@/assets/images/Avatar.png')}
        style={{ width: 50, height: 50, borderRadius: 25 }}
      />
      <Text style={[styles.title, { color: textColor }]}>
        {item.user?.name}
      </Text>
      <Text style={{ color: "#1DCD9F", position: "absolute", top: 25, right: 10 }}>
        Total Payable: PKR {item.totalPayable.toFixed(0)}
      </Text>
      {/* <FontAwesome
        name="arrow-right"
        size={20}
        color={textColor}
        style={{ position: "absolute", right: 10, top: 20 }}
      /> */}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.totalCard, { backgroundColor: TertiaryBackgroundColor }]}>
        <Text style={{ color: textColor, fontSize: 16 }}>Total Revenue (App + Creators)</Text>
        <Text style={{ color: "#1DCD9F", fontSize: 22, fontWeight: "800" }}>
          PKR {totalRevenue.toFixed(0)}
        </Text>

        <Text style={{ color: textColor, fontSize: 16 }}>Total Admin Revenue</Text>
        <Text style={{ color: "#1DCD9F", fontSize: 22, fontWeight: "800" }}>
          PKR {totalAdminRevenue.toFixed(0)}
        </Text>

        <Text style={{ color: textColor, fontSize: 16 }}>Total Payable (Creators)</Text>
        <Text style={{ color: "#1DCD9F", fontSize: 22, fontWeight: "800" }}>
          PKR {totalPayable.toFixed(0)}
        </Text>

        <TouchableOpacity
          style={[styles.withdrawBtn, { backgroundColor: buttonColor }]}
          onPress={() => router.push('/admin/WithdrawalRequests')}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Withdrawal Requests</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searchData}
        keyExtractor={(item) => item.owner_id}
        renderItem={renderUser}
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
              No payouts yet
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", flex: 1 },
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
    gap: 15,
    borderRadius: 8,
    marginBottom: 10,
    position: "relative",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    maxWidth: "40%",
  },
});
