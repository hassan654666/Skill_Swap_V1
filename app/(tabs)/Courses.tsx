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
  BackHandler,
  TextInput,
  Keyboard,
  Pressable,
  Modal,
  ScrollView
} from "react-native";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import { FontAwesome } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Courses() {
  const { userData, DarkMode, courses, setCourses, skills, purchases } = useUserContext();
  const router = useRouter();
  const navigation = useNavigation<any>();

  // const [courses, setCourses] = useState<any[]>([]);
  // const [purchases, setPurchases] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [sortBy, setSortBy] = useState("name");
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  const toggleSearch = () => {
    if (showSearch) {
      Keyboard.dismiss();
      setSearchText('');
    }
    setShowSearch(!showSearch);
  };

  const searchData = (courses || []).filter((course: any) =>{

     // Basic text search
    const matchesText =
      course.title?.toLowerCase().includes(searchText?.trim().toLowerCase()) ||
      course.description?.toLowerCase().includes(searchText?.trim().toLowerCase());

    // Tag filter
    // const matchesTag =
    //   !selectedTag ||
    //   course.type?.toLowerCase() === selectedTag?.toLowerCase();

    let matchesTag = true;

    if (selectedTag) {
      const tag = selectedTag.toLowerCase();

      if (tag === "my courses") {
        // Show only courses uploaded by this user
        matchesTag = course.owner_id === userData.id;
      }
      else if (tag === "enrolled") {
        // Show only purchased courses
        matchesTag = purchases.find((p : any) => p.course_id === course.id && p.user_id === userData.id);
      }
      else {
        // Normal category/type tag
        matchesTag = course.type?.toLowerCase() === tag;
      }
    }

    return matchesText && matchesTag;
  });

  const sortedCourses = [...searchData].sort((a, b) => {
    switch (sortBy) {

      case "name":
        default:
        return a.title?.localeCompare(b.title);

      case "type":
        return a.type?.localeCompare(b.type); // alphabetical A → Z

      case "typeDesc":
        return b.type?.localeCompare(a.type); // Z → A (optional)

      case "priceHighToLow":
        return (Number(b.price) || 0) - (Number(a.price) || 0);

      case "priceLowToHigh":
        return (Number(a.price) || 0) - (Number(b.price) || 0);
    }
  });

  const baseTags = ["My Courses", "Enrolled"];

  const uniqueTypes : any[] = [ ...baseTags, ...new Set(skills.map((s: any) => s.type))];

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
              : require("@/assets/images/icon.png")
          }
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: textColor }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "500", color: textColor, marginTop: 6 }}>
          {item.type}
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
      <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
        <TouchableOpacity style= { {margin: 10, marginLeft: 10, marginRight: 20, paddingHorizontal: 10} }>
          {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
          <FontAwesome name='sort' size={24} color={textColor} onPress={() => setShowSortModal(true)} />
          {/* <Text style={{fontSize: 20}}>        </Text> */}
        </TouchableOpacity>
        {!showSearch && (<Text style={[styles.headerTitle, {color: textColor, backgroundColor: SecondaryBackgroundColor}]}>Courses</Text>)}
        {showSearch && (
          <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder='Search...'
            value = {searchText}
            onChangeText={setSearchText}
          />
        )}

        {/* Right Section */}
        <TouchableOpacity style={{ margin: 10, marginLeft: 10, paddingHorizontal: 10 }} onPress={toggleSearch}>
          <FontAwesome name={showSearch ? 'close' : 'search'} size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      <Modal visible={showSortModal} transparent animationType="fade">
        <Pressable
          onPress={() => setShowSortModal(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        >
          {/* Popover Box */}
          <View
            style={{
              position: "absolute",
              top: height * 0.05,   // Adjust to match your button's Y position
              left: width * 0.05, // Align with button
              backgroundColor: TertiaryBackgroundColor,
              padding: 12,
              borderRadius: 10,
              elevation: 5,
              width: 180,
            }}
          >
            <Text style={{fontSize: 16, color: textColor, marginBottom: 10}}>Sort by:</Text>
            <TouchableOpacity
              onPress={() => {
                setSortBy("name");
                setShowSortModal(false);
              }}
            >
              {/* <FontAwesome name="sort-alpha-asc" size={16} color={textColor} /> */}
              <Text style={{ color: textColor, paddingVertical: 6 }}>
                Name (A to Z)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setSortBy("priceLowToHigh");
                setShowSortModal(false);
              }}
              // style={{flexDirection: 'row'}}
            >
              {/* <FontAwesome name="sort-numeric-asc" size={16} color={textColor} /> */}
              <Text style={{ color: textColor, paddingVertical: 6 }}>
                Price (Low to High)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSortBy("priceHighToLow");
                setShowSortModal(false);
              }}
            >
              {/* <FontAwesome name="sort-numeric-desc" size={16} color={textColor} /> */}
              <Text style={{ color: textColor, paddingVertical: 6 }}>
                Price (High to Low)
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={{height: height * 0.04}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle= {{justifyContent: 'center', alignSelf: 'flex-start'}}>
          {uniqueTypes.map(tag => (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(prev => prev === tag ? null : tag)}
              style={{
                height: height * 0.04,
                minWidth: width/3.75,
                paddingVertical: 0,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 10,
                backgroundColor: selectedTag === tag ? buttonColor : TertiaryBackgroundColor,
                borderRadius: 0,
                borderColor: SecondaryBackgroundColor,
                borderBottomWidth: 0.5,
                borderLeftWidth: 0.5,
                borderRightWidth: 0.5,
                // marginRight: 8
              }}
            >
              <Text style={{ color: selectedTag === tag ? buttonTextColor : textColor }}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        style={{width: '100%'}}
        data={sortedCourses}
        keyExtractor={(i) => i.id}
        renderItem={renderCard}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: textColor }}>{loading ? "Loading..." : "No courses yet."}</Text>
          </View>
        )}
      />
      {userData.rating >= 4 && userData.reviews >= 10 ? (
          <TouchableOpacity onPress={() => router.push("/UploadCourse")} style={[styles.addBtn, { backgroundColor: buttonColor, margin: 10, alignSelf: 'flex-end' }]}>
            <FontAwesome name="plus" size={16} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 8 }}>Create Course</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style= { {margin: 10, marginLeft: 15,} }>
            {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
            <Text style={{fontSize: 14, fontWeight: 'bold', color: textColor}}>You are not eligible to create courses</Text>
          </TouchableOpacity>)
        }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  topbar: {
    width: "100%",
    height: height * 0.06,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    // paddingHorizontal: 14,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800" 
  },
  input: {
    width: '50%',
    height: height * 0.04,
    //height: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    //padding: 10,
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
