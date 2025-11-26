// CoursesScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  BackHandler
} from "react-native";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function Courses() {
  const { userData, DarkMode, courses, setCourses } = useUserContext();
  const router = useRouter();
  const navigation = useNavigation<any>();

  // const [courses, setCourses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Show approved courses and the user's own courses (so user can see their pending)
      const query = supabase
        .from("courses")
        .select("*")
        .or(`status.eq.approved,owner_id.eq.${userData?.id ?? "null"}`)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setCourses(data ?? []);
    } catch (err) {
      console.error("fetchCourses", err);
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
      if (!userData?.id) return;
  
      fetchCourses();
  
      const chatChannel = supabase
        .channel('courses')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'courses',
          },
          (payload) => {
            if(!payload.new) return;
            fetchCourses();
          }
        )
        
        .subscribe();
  
      return () => {
        supabase.removeChannel(chatChannel);
      };
    }, [userData?.id]);

    useFocusEffect(
      useCallback(() => {
        const backAction = () => {
          //router.back();
          //router.replace('/(tabs)/Home');
          //router.push('/Home');
          navigation.navigate('Home'); 
          return true; 
        };
    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
        return () => backHandler.remove();
      }, [])
    );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCourses();
    setRefreshing(false);
  }, [userData?.id]);

  const renderCard = ({ item }: { item: any }) => {

  return (
    <TouchableOpacity 
    onPress={() => {
      if(item.status === 'pending') return; 
      router.push({pathname:'/OpenCourse', params:{courseId: item.id}});}}
    style={[styles.card, { backgroundColor: SecondaryBackgroundColor }]}>
      <View style={{ width: 110, height: 120, borderRadius: 10, overflow: "hidden" }}>
        <Image
          source={
            item.thumbnail_url
              ? { uri: item.thumbnail_url }
              : require("@/assets/images/logo.png")
          }
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: textColor }}>
          {item.title}
        </Text>

        <Text numberOfLines={2} style={{ color: textColor, marginTop: 6 }}>
          {item.description}
        </Text>

        <View
          style={{
            flexDirection: "row",
            marginTop: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontWeight: "700", color: textColor }}>
            ${item.price ?? 0}
          </Text>

          {item.owner_id === userData.id && (
            <Text
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor:
                  item.status === "approved"
                    ? "#2ecc71"
                    : item.status === "rejected"
                    ? "#e74c3c"
                    : "#f39c12",
                color: "#fff",
                fontWeight: "700",
              }}
            >
              {item.status?.toUpperCase() ?? "PENDING"}
            </Text>)
          }
        </View>
      </View>
    </TouchableOpacity>
  );
};


  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>

        <TouchableOpacity style= { {margin: 10, marginLeft: 15,} }>
          {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
          <Text style={{fontSize: 20}}>            </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textColor }]}>Courses</Text>

        {userData.rating >= 4 && userData.reviews >= 10 ? (
          <TouchableOpacity onPress={() => router.push("/UploadCourse")} style={[styles.addBtn, { backgroundColor: buttonColor }]}>
            <FontAwesome name="plus" size={16} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 8 }}>Upload</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style= { {margin: 10, marginLeft: 15,} }>
            {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
            <Text style={{fontSize: 20}}>            </Text>
          </TouchableOpacity>)
        }
      </View>

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        style={{width: width}}
        data={courses}
        keyExtractor={(i) => i.id}
        renderItem={renderCard}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: textColor }}>{loading ? "Loading..." : "No courses yet."}</Text>
          </View>
        )}
      />
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
  addBtn: { 
    padding: 10, 
    borderRadius: 10, 
    flexDirection: "row", 
    alignItems: "center" 
  },
  button: {
    width: '25%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    minHeight: 120,
  },
});
