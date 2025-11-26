import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
  Keyboard,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import { FontAwesome } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function ManageReports() {
  const { userData, usersData, DarkMode, reports, setReports } = useUserContext();

  // const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const router = useRouter();

  const [searchText, setSearchText] = useState<string>('');
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

  // ------------------------------
  // FETCH REPORTS + PROFILES
  // ------------------------------
  const loadReports = async () => {
    try {

      const { data: reportData, error: reportErr } =
        await supabase.from("reports").select("*").order("id", { ascending: false });

      if (reportErr) throw reportErr;

      setReports(reportData || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } 
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ------------------------------
  // RESOLVE REPORT
  // ------------------------------
  const resolveReport = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "Report marked as resolved.");
      loadReports();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // DISMISS REPORT
  // ------------------------------
  const dismissReport = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("reports")
        .update({ status: "dismissed" })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Dismissed", "Report has been dismissed.");
      loadReports();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSearch = () => {
        if (showSearch) {
          Keyboard.dismiss();
          setSearchText('');
        }
        setShowSearch(!showSearch);
      };
    
      const searchData = reports?.filter((report: any) => {

        const reportedUser =
          usersData?.find((p: any) => `${p.id}` === `${report.user_id}`) ||
          (`${userData?.id}` === `${report.user_id}` ? userData : null);

        const reporter =
          usersData?.find((p: any) => `${p.id}` === `${report.reporter_id}`) ||
          (`${userData?.id}` === `${report.reporter_id}` ? userData : null);

        return(
          report?.topic?.toLowerCase().includes(searchText?.toLowerCase()) 
          || report?.message?.toLowerCase().includes(searchText?.toLowerCase()) 
          || report?.status?.toLowerCase().includes(searchText?.toLowerCase()) 
          || reportedUser?.name?.toLowerCase().includes(searchText?.toLowerCase()) 
          || reporter?.name?.toLowerCase().includes(searchText?.toLowerCase())
        );
      });

  // ------------------------------
  // RENDER A SINGLE REPORT
  // ------------------------------
  const renderReport = ({ item: report }: any) => {
    const reportedUser =
      usersData?.find((p: any) => `${p.id}` === `${report.user_id}`) ||
      (`${userData?.id}` === `${report.user_id}` ? userData : null);

    const reporter =
      usersData?.find((p: any) => `${p.id}` === `${report.reporter_id}`) ||
      (`${userData?.id}` === `${report.reporter_id}` ? userData : null);


    const isPending = report.status === "pending";

    return (
        <View
          style={{
            backgroundColor: SecondaryBackgroundColor,
            padding: 14,
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
              onPress={() => router.push({
              pathname: '/(tabs)/admin/ManageUser',
              params:{
                id: reportedUser?.id
              }
            })
          }
          style={{
            backgroundColor: TertiaryBackgroundColor,
            padding: 14,
            borderRadius: 12,
            // marginBottom: 10,
          }}>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: "700" }}>
            Report Topic: {report.topic}
          </Text>

          <Text style={{ color: textColor, marginTop: 5 }}>
            <Text style={{ fontWeight: "bold" }}>Reported User:</Text>{" "}
            {reportedUser?.name || "Unknown User"}
          </Text>

          <Text style={{ color: textColor, marginTop: 2 }}>
            <Text style={{ fontWeight: "bold" }}>Reporter:</Text>{" "}
            {reporter?.name || "Unknown Reporter"}
          </Text>

          <Text style={{ color: textColor, marginTop: 10 }}>
            <Text style={{ fontWeight: "bold" }}>Message:</Text> {report.message}
          </Text>

          <Text
            style={{
              color:
                report.status === "resolved"
                  ? "#00c851"
                  : report.status === "dismissed"
                  ? "#ff4444"
                  : "#ffbb33",
              marginTop: 10,
              marginBottom: 12,
              fontWeight: "bold",
            }}
          >
            Status: {report?.status?.toUpperCase()}
          </Text>
          </TouchableOpacity>
          {isPending && (<View style={{ flexDirection: "row", gap: 10, marginTop: 14, }}>
            <TouchableOpacity
              disabled={!isPending}
              onPress={() => resolveReport(report.id)}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: buttonColor,
                opacity: isPending ? 1 : 0.4,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: buttonTextColor, fontWeight: "700" }}>
                Resolve
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!isPending}
              onPress={() => dismissReport(report.id)}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: redButton,
                opacity: isPending ? 1 : 0.4,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Dismiss</Text>
            </TouchableOpacity>
          </View>)}
        </View>
      
    );
  };

  // ------------------------------
  // MAIN UI
  // ------------------------------
  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <View style= {{height: height * 0.12, width: '100%', justifyContent: 'space-between', backgroundColor: SecondaryBackgroundColor}}>
          <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
              <TouchableOpacity 
              // onPress={() => navigation.navigate('AdminDashboard')}
              style= { {margin: 10, marginLeft: 5, paddingHorizontal: 10} } >
                  {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
              <Text></Text>
              </TouchableOpacity>
              {!showSearch && (
                  <Text style={[styles.title, {color: textColor, backgroundColor: SecondaryBackgroundColor}]}>Manage Reports</Text>
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
                  )} */}
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
                  )} */}
              </View>
              <Text style={styles.buttonText}>Reports</Text>
              </TouchableOpacity>
          </View>
      </View>
    <View style={{ width: '100%', flex: 1, backgroundColor, padding: 12 }}>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={buttonColor}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={searchData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReport}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
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
