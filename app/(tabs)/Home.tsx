import React, { useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList, BackHandler, KeyboardAvoidingView, Platform, Pressable, Dimensions, Modal } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import CustomDrawer from '@/components/customDrawer';
import { supabase } from '@/lib/supabase'
//import { savePushToken } from '@/utils/savePushToken';
//import { usePushToken } from '@/hooks/usePushToken';

const { width, height } = Dimensions.get("window");

export default function Home() {

  const { session, skills, setSkills, usersData, userData, fetchSessionAndUserData, unreadCount, DarkMode, setIsDark } = useUserContext();

  const [users, setUsers] = useState<any[]>(usersData);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("rating");
  const [showSortModal, setShowSortModal] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigation = useNavigation<any>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();

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

  //const { expoPushToken } = usePushToken();

  // useEffect(() => {
  //   if(expoPushToken && userData?.id){
  //     savePushToken(userData?.id, expoPushToken);
  //   }
  // }, [expoPushToken, userData]);
  //savePushToken(userData?.id);
  //usePushNotifications();

  const checkSession = async () => {
    if(isFocused){
      try {
        if (!session) {
          router.replace('/Login');
          //navigation.navigate('Login');
        } else if(session && !userData){
          router.replace('/CompleteProfile');
        }
      } catch (error) {
        console.error('Navigation Error:', error);
      }
    }
    if(userData.banned){
      router.replace('/Banned');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkSession();
    }, [session])
  );

  // useEffect(() => {
  //   checkSession();
  // }, [session]);

  /*useEffect(() => {
    checkSession();
  }, []);*/

  async function fetchAllData() {
    try {

      // Fetch all skills
      const { data: skillsData, error: sError } = await supabase
        .from("skills")
        .select("id, name, type, description");

      if (sError) {
        console.log("skills error:", sError);
        return;
      }
      if(skillsData)
        setSkills(skillsData);

      // Fetch profile_skills with join
      const { data: profileSkills, error: psError } = await supabase
        .from("profile_skills")
        .select("profile_id, category, skills(id, name, type)");

      if (psError) {
        console.log("profile_skills error:", psError);
        return;
      }

      // Merge skills into profiles
      const finalUsers = usersData.map((user) => {
        const offered = profileSkills
          .filter(ps => ps.profile_id === user.id && ps.category === "offered")
          .map(ps => ps.skills);

        const required = profileSkills
          .filter(ps => ps.profile_id === user.id && ps.category === "required")
          .map(ps => ps.skills);

        return {
          ...user,
          skillsOffered: offered,
          skillsRequired: required
        };
      });

      if(finalUsers)
        setUsers(finalUsers);

    } catch (err) {
      console.log("fetchAllData catch:", err);
    }
  }

  useEffect(() => {
    fetchAllData();
  }, []);

  const uniqueTags : any[] = Array.from(new Set(skills.map((s: any) => s.type)));

  const searchData = usersData.filter((user: any) => {
    const text = searchText.trim().toLowerCase();

    // Basic text search
    const matchesText =
      user.name?.toLowerCase().includes(text) ||
      user.username?.toLowerCase().includes(text) ||
      user.skillsOffered.some((s: any) => s?.name?.toLowerCase().includes(text));

    // Tag filter
    const matchesTag =
      !selectedTag ||
      user.skillsOffered.some((s: any) => s?.type === selectedTag);

    return matchesText && matchesTag;
  });

  const sortedUsers = [...searchData].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name?.localeCompare(b.name);

      case "skills":
        return (b.skillsOffered?.length || 0) - (a.skillsOffered?.length || 0);

      case "rating":
      default:
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    }
  });



  function goToProfile(){
    router.push('/Profile')
    //navigation.navigate('Profile');
  }

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        //router.back();
        //router.replace('/(tabs)/Home');
        //router.push('/Home');
        ///navigation.navigate('Home'); 
        return true; 
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [])
  );

  const renderItem = ({ item }: any) => {

    const safeRating = Math.max(0, Math.min(5, Number(item?.rating) || 0));

    const fullStars = Math.floor(safeRating);
    const halfStar = safeRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    const groupedUserSkills = item?.skillsOffered.reduce((acc: any, s: any) => {
      const key = s.type ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {});

    const types = Object.keys(groupedUserSkills);

    return (
    <TouchableOpacity
      style={[styles.usersItem, {backgroundColor: TertiaryBackgroundColor}]}
      // onPress={() => navigation.navigate('UserProfile', { userId: item?.id })
      // }
      onPress={() => router.push({
        pathname: '/UserProfile',
        params:{
          userId: item?.id
        }
      })
      }
    >
      <View style= {styles.users}>
        <Image source= {item?.avatar_url? { uri: item?.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
        <View>
          {/*<Text style={[styles.usersName, {color: textColor}]}>{item.id}</Text>*/}
          <Text numberOfLines={2} style={[styles.usersName, {color: textColor}]}>{item?.name}</Text>
          <Text numberOfLines={1} style={[styles.usersUsername, {color: textColor}]}>@{item?.username}</Text>
          {item.reviews >= 1 && (<View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 5, marginBottom: 5 }}>
            {/* Full Stars */}
            {[...Array(fullStars)].map((_, i) => (
              <FontAwesome key={`full-${i}`} name="star" size={14} color="gold" />
            ))}
  
            {/* Half Star */}
            {halfStar && <FontAwesome name="star-half-full" size={14} color="gold" />}
  
            {/* Empty Stars */}
            {[...Array(emptyStars)].map((_, i) => (
              <FontAwesome key={`empty-${i}`} name="star-o" size={14} color="grey" />
            ))}
  
            <Text style={{ marginLeft: 5, fontSize: 16, color: textColor }}>
              ({item?.reviews})
            </Text>
          </View>)}
          <Text numberOfLines={1} style={[styles.usersSkills, {color: textColor}]}>Skills Offered:</Text>
          
          {types.length === 0 ? 
            (<Text style={{ color: textColor, paddingLeft: 20, fontSize: 14, opacity: 0.8 }}>
                No skills added yet.
              </Text>
            ) :
            (types.map((type) => (
              <View key={type} style={{ width: '80%', flexDirection: 'row', flexWrap: "wrap", paddingLeft: 20, }}>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '500' }}>{type}:</Text>
                {groupedUserSkills[type].map((skill: any) => (
                  <Text key={skill.id} style={{ color: textColor, fontSize: 14, fontWeight: '400', marginLeft: 5}}>
                    • {skill.name}
                  </Text>
                ))}
              </View>
            ))
          )}
          
          {/* <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
            {item?.skillsOffered?.map((skill) => (
              <View
                key={skill.id}
                style={{
                  // backgroundColor: "#007bff",
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderRadius: 10,
                  marginRight: 5,
                  marginBottom: 5
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>{skill.name}</Text>
              </View>
            ))}
          </View> */}
          
        </View>
      </View>
    </TouchableOpacity>
  )};

  console.log('Home rendered');
  // console.log('user Id:', userData.id);
  // console.log('users Id:', usersData.map(user => user.id).join(', '));

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <View style={[styles.container, {backgroundColor: backgroundColor}]}>
        <View style= {{height: height * 0.16, width: '100%', justifyContent: 'space-between', backgroundColor: SecondaryBackgroundColor}}>
          <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
            <FontAwesome name="bars" size={24} color={textColor} style={{height: height * 0.05, width: width * 0.1, padding: height * 0.01, paddingHorizontal: width * 0.02}} onPress={() => setDrawerVisible(true)} />
            {/* <Image source= {require('../logo.png')} style= {[styles.logo, {marginLeft: 20, marginTop: 0,}]}></Image> */}
            <Pressable style= { [styles.avatar, {marginRight: 10, marginLeft: 20}] } onPress={goToProfile}>
              <Image source= {userData?.avatar_url? { uri: userData?.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
              {/* <Text style= {[styles.username, {color: textColor}]}>{userData?.name || 'Guest'}</Text> */}
            </Pressable>
          </View>
          <View style= {[styles.inputArea, { backgroundColor: SecondaryBackgroundColor}]}>
            <TextInput
              style={[styles.input, {backgroundColor: inputColor}]}
              placeholder='Search...'
              value = {searchText}
              onChangeText={setSearchText}
            />
            
            {/* <View style={{alignSelf: 'flex-start', position: 'absolute', right: width * 0, height: height * 0.05, width: width * 0.1, padding: height * 0.01, paddingHorizontal: 10}}>
              <Picker
                selectedValue={sortBy}
                onValueChange={(value) => setSortBy(value)}
                style={{
                  // backgroundColor: TertiaryBackgroundColor,
                  color: textColor,
                  borderRadius: 10,
                  height: 40,
                }}
              >
                <Picker.Item label="Sort by Rating" value="rating" />
                <Picker.Item label="Sort by Name (A-Z)" value="name" />
                <Picker.Item label="Sort by Skills Offered" value="skills" />
              </Picker>
            </View> */}

            <FontAwesome name='sort' size={24} color={textColor} style={{alignSelf: 'flex-start', position: 'absolute', right: width * 0, height: height * 0.05, width: width * 0.1, padding: height * 0.01, paddingHorizontal: 10}} onPress={() => setShowSortModal(true)} />

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
                    top: height * 0.1,   // Adjust to match your button's Y position
                    right: width * 0.05, // Align with button
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
                      setSortBy("rating");
                      setShowSortModal(false);
                    }}
                  >
                    <Text style={{ color: textColor, paddingVertical: 6 }}>
                      Rating
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSortBy("name");
                      setShowSortModal(false);
                    }}
                  >
                    <Text style={{ color: textColor, paddingVertical: 6 }}>
                      Name (A–Z)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSortBy("skills");
                      setShowSortModal(false);
                    }}
                  >
                    <Text style={{ color: textColor, paddingVertical: 6 }}>
                      Skills Offered
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </View>
          <View style={{height: height * 0.04}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle= {{justifyContent: 'center', alignSelf: 'flex-start'}}>
              {uniqueTags.map(tag => (
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
        </View>
        <View style={[styles.content, {backgroundColor: backgroundColor}]}>
          <FlatList
            style={[styles.flatlist, {backgroundColor: backgroundColor}]}
            data={sortedUsers}
            keyExtractor={item => item?.id}
            renderItem={renderItem}
            ListEmptyComponent={
            <Text style={styles.noUser}>No users found</Text>
            }
          />
        </View>
        {/* Custom Drawer */}
        <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        {/* <View style = {styles.navbar}>
          <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Home')}>
            <FontAwesome name="home" size={24} color={buttonTextColor} />
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Inbox')}>
            <View style={{ position: "relative" }}>
              <FontAwesome name="comments" size={24} color={buttonTextColor} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount < 99 ?unreadCount: "99+"}</Text>
                </View>
              )}
            </View>
            <Text style={styles.buttonText}>Inbox</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.buttonText}>Schedule</Text>
          </TouchableOpacity> }
        </View> */}
      </View>
      </KeyboardAvoidingView>
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
      // position: 'absolute',
      // top: 0,
      // flex: 0.08,
      flexDirection: 'row',
      width: '100%',
      height: height * 0.06,
      //height: 100,
      //padding: 20,
      //padding: '1%',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: height * 0.01,

    },
    inputArea: {
      //position: 'absolute',
      //top: 90,
      // flex: 0.03,
      //height: 100,
      flexDirection: 'row',
      height: height * 0.04,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: height * 0.01,
      // padding: 20,

    },
    input: {
      width: width * 0.7,
      height: height * 0.04,
      //height: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 20,
      verticalAlign: 'middle',
      textAlignVertical: 'center',
      paddingHorizontal: 10,
    },
    logo: {
      width: width * 0.08,
      height: width * 0.08,
      borderRadius: 90,

    },
    avatar: {
      width: width * 0.1,
      height: width * 0.1,
      borderRadius: 90,
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',

    },
    flatlist: {
      width: '100%',
      paddingTop: height * 0.01,
    },
    username: {
      color: 'black',
      width: width * 0.2,
      fontSize: 9,
      fontWeight: 'bold',
      textAlign: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
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
      // maxHeight: height * 0.2,
      gap: 25,
      alignContent: 'center',
      // resizeMode: 'contain',
      //backgroundColor: 'red'
    },
    usersItem: {
      padding: width * 0.05,
      margin: width * 0.01,
      //paddingLeft: 40,
      marginBottom: 10,
      borderRadius: 8,
      width: '90%',
      // maxHeight: height * 0.2,
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
      paddingLeft: 10,
      fontSize: 16,
      fontWeight: '500',
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
      position: 'absolute',
      bottom: 0,
      //flex: 0.1,
      flexDirection: 'row',
      width: '100%',
      gap: 0,
      alignContent: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'black',
    },
    navButton: {
      width: '50%',
      padding: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
    // badge: {
    //   position: "absolute",
    //   top: -5,      // pushes it slightly above the icon
    //   right: -10,   // shifts it to the right edge of the icon
    //   backgroundColor: "red",
    //   borderRadius: 10,
    //   minWidth: 18, // ensures it stays round
    //   paddingHorizontal: 5,     // allows growth for larger numbers
    //   height: 18,
    //   justifyContent: "center",
    //   alignItems: "center",
    // },
    // badgeText: {
    //   color: "white",
    //   fontSize: 11,
    //   fontWeight: "bold",
    // },

  });