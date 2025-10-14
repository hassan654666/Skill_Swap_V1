import React, { useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList, BackHandler, Keyboard, Dimensions } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { darkColors } from '@rneui/themed';
import { FontAwesome } from '@expo/vector-icons';
//import { savePushToken } from '@/utils/savePushToken';
//import { usePushToken } from '@/hooks/usePushToken';

const { width, height } = Dimensions.get("window");

export default function AdminDashboard() {

  const { session, usersData, userData, fetchSessionAndUserData, unreadCount, DarkMode } = useUserContext();

  const [searchText, setSearchText] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const navigation = useNavigation<any>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  // const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';


  const searchData = usersData?.filter((users: any) =>
    users?.name?.toLowerCase().includes(searchText?.toLowerCase()) || users?.skillsOffered?.toLowerCase().includes(searchText?.toLowerCase()) || users?.username?.toLowerCase().includes(searchText?.toLowerCase())
  );

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

  const toggleSearch = () => {
    if (showSearch) {
      Keyboard.dismiss();
      setSearchText('');
    }
    setShowSearch(!showSearch);
  };

  const TotalUsers = () => {
    return usersData?.length || 0;
  }

  const renderItem = ({ item }: any) => (
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
        <Image source= {item?.avatar_url? { uri: item?.avatar_url } : require('../../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
        <View>
          {/*<Text style={[styles.usersName, {color: textColor}]}>{item.id}</Text>*/}
          <Text numberOfLines={2} style={[styles.usersName, {color: textColor}]}>{item?.name}</Text>
          <Text numberOfLines={1} style={[styles.usersUsername, {color: textColor}]}>@{item?.username}</Text>
          <Text numberOfLines={4} style={[styles.usersSkills, {color: textColor}]}>Skills Offered: {item?.skillsOffered}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  console.log('Admin Dashboard rendered');
  // console.log('user Id:', userData.id);
  // console.log('users Id:', usersData.map(user => user.id).join(', '));

    return (
      <View style={[styles.container, {backgroundColor: backgroundColor}]}>
        <View style= {{height: height * 0.12, width: '100%', justifyContent: 'space-between', backgroundColor: SecondaryBackgroundColor}}>
        <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
                {/* <TouchableOpacity style= { {margin: 10, marginRight: 20,} } onPress={() => navigation.navigate('Home')}>
                  <FontAwesome name="arrow-left" size={20} color={textColor} />
                </TouchableOpacity> */}
                <Text style={[styles.title, {color: textColor, backgroundColor: SecondaryBackgroundColor}]}>Admin Dashboard</Text>
                {showSearch && (
                  <TextInput
                    style={[styles.input, {backgroundColor: inputColor}]}
                    placeholder='Search...'
                    value = {searchText}
                    onChangeText={setSearchText}
                  />
                )}
        
                {/* Right Section */}
                {/* <TouchableOpacity style={{ margin: 10, marginLeft: 20 }} onPress={toggleSearch}>
                  <FontAwesome name={showSearch ? 'close' : 'search'} size={20} color={textColor} />
                </TouchableOpacity> */}
              </View>
        <View style = {[styles.navbar, {backgroundColor: SecondaryBackgroundColor}]}>
          <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Users')}>
            <FontAwesome name="user" size={24} color={buttonTextColor} />
            <Text style={styles.buttonText}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.navButton} >
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
          <TouchableOpacity style ={styles.navButton} >
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
        <View style={[styles.content, {backgroundColor: backgroundColor}]}>
          {/* <FlatList
            style={[styles.flatlist, {backgroundColor: backgroundColor}]}
            data={searchData}
            keyExtractor={item => item?.id}
            renderItem={renderItem}
            ListEmptyComponent={
            <Text style={styles.noUser}>No users found</Text>
            }
          /> */}

          <Text style= {[styles.title, {color: textColor}]}>Total Users: {TotalUsers()}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Approved Courses: {}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Courses Rejected: {}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Reports Resolved: {}</Text>

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
      flex: 0.9,
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
      justifyContent: 'center',

    },
    inputArea: {
      //position: 'absolute',
      //top: 90,
      // flex: 0.03,
      //height: 100,
      width: '100%',
      height: height * 0.04,
      justifyContent: 'center',
      alignItems: 'center',
      verticalAlign: 'top',
      // padding: 20,

    },
    input: {
      width: '80%',
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
      width: 50,
      height: 50,
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
      // padding: 20,
      // borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: height * 0.01,
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