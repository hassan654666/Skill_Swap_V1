import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions,
  Keyboard,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useNavigation, useRouter } from "expo-router";
import { useUserContext } from "@/components/UserContext";
import { FontAwesome } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Courses({searchText}:{searchText: string}) {
  const { DarkMode, usersData, courses, setCourses, allUsers } = useUserContext();

  // const [courses, setCourses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>(allUsers);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>()
  const router = useRouter();

  // const [searchText, setSearchText] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);

  // THEME
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

  // -------------------------
  // FETCH ALL COURSES + PROFILES
  // -------------------------
  const loadData = async () => {
    try {

      const [{ data: courseData, error: courseErr }, { data: profileData, error: profileErr }] =
        await Promise.all([
          supabase.from("courses").select("*").order("id", { ascending: false }),
          supabase.from("profiles").select("id, name"),
        ]);

      if (courseErr) throw courseErr;
      if (profileErr) throw profileErr;

      if(courseData){
      setCourses(courseData);
      setProfiles(profileData);
      }

    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if(!usersData) return;

    const coursesChannel = supabase
      .channel("courses-update")
      .on(
        "postgres_changes",
        {
          event: "*", // insert/update/delete
          schema: "public",
          table: "courses",
        },
        () => {
          // Re-fetch all counts whenever something changes
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
    };
  }, [usersData, loadData]);

  // const toggleSearch = () => {
  //     if (showSearch) {
  //       Keyboard.dismiss();
  //       setSearchText('');
  //     }
  //     setShowSearch(!showSearch);
  //   };
  
    const searchData = courses?.filter((course: any) =>
      course?.title?.toLowerCase().includes(searchText?.toLowerCase()) || course?.description?.toLowerCase().includes(searchText?.toLowerCase()) || course?.status?.toLowerCase().includes(searchText?.toLowerCase())
    );

  // -------------------------
  // RENDER SINGLE COURSE
  // -------------------------
  const renderCourse = ({ item: course }: any) => {
    const owner = profiles.find((p) => p.id === course.owner_id);

    const isPending = course.status === "pending";
    const isApproved = course.status === "approved";
    const isRejected = course.status === "rejected";

    return (
      <TouchableOpacity
        style={{
          backgroundColor: TertiaryBackgroundColor,
          marginVertical: 10,
          borderRadius: 12,
          padding: 14,
        }}
        onPress={() => router.push({
        pathname: '/admin/ManageCourse',
        params:{
          courseId: course?.id
        }
      })
      }
      >
        {/* THUMBNAIL */}
        <Image
          source={course?.thumbnail_url ? { uri: course?.thumbnail_url } : require('@/assets/images/icon.png')}
          style={{
            width: "100%",
            height: 180,
            borderRadius: 10,
            backgroundColor: "#999",
          }}
        />

        {/* TITLE */}
        <Text
          style={{
            color: textColor,
            fontSize: 20,
            marginTop: 10,
            fontWeight: "600",
          }}
        >
          {course.title}
        </Text>

        {/* OWNER */}
        <Text style={{ color: linkTextColor, marginBottom: 6 }}>
          By {owner?.name || "Unknown"}
        </Text>

        {/* DESCRIPTION */}
        <Text style={{ color: textColor }}>{course.description}</Text>

        {/* PRICE */}
        <Text
          style={{
            color: DarkMode ? "#1DCD9F" : "#008662",
            fontWeight: "700",
            marginTop: 8,
          }}
        >
          Price: ${course.price}
        </Text>

        {/* STATUS */}
        <Text
          style={{
            marginTop: 6,
            marginBottom: 10,
            color:
              isApproved
                ? "#00c851"
                : isRejected
                ? "#ff4444"
                : "#ffbb33",
            fontWeight: "bold",
          }}
        >
          Status: {course.status.toUpperCase()}
        </Text>

      </TouchableOpacity>
    );
  };

  // -------------------------
  // MAIN UI
  // -------------------------
  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
        {/* <View style= {{height: height * 0.12, width: '100%', justifyContent: 'space-between', backgroundColor: SecondaryBackgroundColor}}>
            <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
                <TouchableOpacity 
                // onPress={() => navigation.navigate('AdminDashboard')}
                style= { {margin: 10, marginLeft: 5, paddingHorizontal: 10} } >
                    {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> *
                <Text></Text>
                </TouchableOpacity>
                {!showSearch && (
                    <Text style={[styles.title, {color: textColor, backgroundColor: SecondaryBackgroundColor}]}>Manage Courses</Text>
                )}
                {showSearch && (
                <TextInput
                    style={[styles.input, {backgroundColor: inputColor}]}
                    placeholder='Search...'
                    value = {searchText}
                    onChangeText={setSearchText}
                />
                )}

                <TouchableOpacity style={{ margin: 10, marginLeft: 20 }} onPress={toggleSearch}>
                    <FontAwesome name={showSearch ? 'close' : 'search'} size={20} color={textColor} />
                </TouchableOpacity>
            </View>
            <View style = {[styles.navbar, {backgroundColor: SecondaryBackgroundColor}]}>
                <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Users')}>
                <FontAwesome name="user" size={24} color={buttonTextColor} />
                <Text style={styles.buttonText}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('ManageCourses')}>
                <View style={{ position: "relative" }}>
                    <FontAwesome name="book" size={24} color={buttonTextColor} />
                    {/* {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount < 99 ?unreadCount: "99+"}</Text>
                    </View>
                    )} *
                </View>
                <Text style={styles.buttonText}>Courses</Text>
                </TouchableOpacity>
                <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('ManageReports')}>
                <View style={{ position: "relative" }}>
                    <FontAwesome name="file" size={24} color={buttonTextColor} />
                    {/* {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount < 99 ?unreadCount: "99+"}</Text>
                    </View>
                    )} *
                </View>
                <Text style={styles.buttonText}>Reports</Text>
                </TouchableOpacity>
            </View>
        </View> */}
        <View style={{ width: '100%', flex: 1, backgroundColor, padding: 10 }}>
        {/* <Text
            style={{
            color: textColor,
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 10,
            }}
        >
            Manage Courses
        </Text> */}

        {loading ? (
            <ActivityIndicator size="large" color={buttonColor} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
            data={searchData}
            style={styles.flatlist}
            renderItem={renderCourse}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 70 }}
            />
        )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content:{
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      //marginBottom: '20%',
      //paddingBottom: 20,
    },
    topbar: {
      //position: 'absolute',
      //top: 0,
      // flex: 0.08,
      flexDirection: 'row',
      width: '100%',
      height: height * 0.06,
      //height: 100,
      //padding: 20,
      //padding: '1%',
      alignItems: 'center',
      justifyContent: 'space-between',

    },
   inputArea: {
      //position: 'absolute',
      //top: 90,
      // flex: 0.03,
      //height: 100,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      verticalAlign: 'middle',
      //padding: 20,
      marginBottom: height * 0.01,

    },
    input: {
      width: '50%',
      // height: 40,
      //height: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 20,
      //padding: 10,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 90,

    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 90,
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',

    },
    flatlist: {
      width: '100%',

    },
    username: {
      color: 'black',
      width: 100,
      fontSize: 9,
      fontWeight: 'bold',
      textAlign: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      //marginBottom: 20,
    },
    linkText: {
      color: '#007BFF',
      textAlign: 'center',
      marginTop: 20,
      marginVertical: 10,
      textDecorationLine: 'underline',
      padding: 30,
      borderRadius: 15,
      backgroundColor: '#f5f5f5',
    },
    users: {
      flexDirection: 'row',
      maxWidth: '100%',
      gap: 25,
      alignContent: 'center',
      //backgroundColor: 'red'
    },
    usersItem: {
      padding: 20,
      margin: 10,
      //paddingLeft: 40,
      marginBottom: 10,
      borderRadius: 8,
      width: '90%',
      justifyContent: 'center',
      alignSelf: 'center',
      resizeMode: 'contain',
      flexShrink: 1,
    },
    usersName: {
      fontSize: 18,
      maxWidth: '98%',
      fontWeight: 'bold',
    },
    usersUsername: {
      maxWidth: '98%',
      fontSize: 14,
    },
    usersSkills: {
      maxWidth: '98%',
      padding: 10,
      fontSize: 16,
    },
    noUser: {
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center',
      margin: 20,
      padding: 30,
      borderRadius: 15,
    },
    columnWrapper: {
      justifyContent: 'space-around',
    },
    navbar: {
      // position: 'absolute',
      // top: 0,
      // bottom: 0,
      // flex: 0.09,
      flexDirection: 'row',
      width: '100%',
      height: height * 0.06,
      gap: 0,
      alignContent: 'center',
      justifyContent: 'space-around',
      //backgroundColor: 'black',
    },
    navButton: {
      width: '33%',
      // padding: height * 0.01,
      //borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: height * 0.01,
      // backgroundColor: 'red',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
    badge: {
      position: "absolute",
      top: -5,      // pushes it slightly above the icon
      right: -10,   // shifts it to the right edge of the icon
      backgroundColor: "red",
      borderRadius: 10,
      minWidth: 18, // ensures it stays round
      paddingHorizontal: 5,     // allows growth for larger numbers
      height: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      color: "white",
      fontSize: 11,
      fontWeight: "bold",
    },

  });