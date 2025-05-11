import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { darkColors } from '@rneui/themed';
import { FontAwesome } from '@expo/vector-icons';

export default function Home() {

  const [searchText, setSearchText] = useState<string>('');
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#929292' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';

  const { session, usersData, userData, fetchSessionAndUserData } = useUserContext();

  const checkSession = async () => {
    if(isFocused){
      try {
        if (!session) {
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Navigation Error:', error);
      }
    }
  };
  
  useEffect(() => {
    checkSession();
  }, [session, isFocused]);

  /*useEffect(() => {
    checkSession();
  }, []);*/

  const searchData = usersData?.filter((users: any) =>
    users?.name?.toLowerCase().includes(searchText?.toLowerCase()) || users?.skillsOffered?.toLowerCase().includes(searchText?.toLowerCase())
  );

  function goToProfile(){
    navigation.navigate('Profile');
  }

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.usersItem, {backgroundColor: TertiaryBackgroundColor}]}
      onPress={() => navigation.navigate('ChatScreen', { receiverId: item?.id })
      }
    >
      <View style= {styles.users}>
        <Image source= {item?.avatar_url? { uri: item?.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
        <View>
          {/*<Text style={[styles.usersName, {color: textColor}]}>{item.id}</Text>*/}
          <Text style={[styles.usersName, {color: textColor}]}>{item?.name}</Text>
          <Text style={[styles.usersEmail, {color: textColor}]}>{item?.email}</Text>
          <Text style={[styles.usersSkills, {color: textColor}]}>Skills Offered: {item?.skillsOffered}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // console.log('Home rendered');
  // console.log('user Id:', userData.id);
  // console.log('users Id:', usersData.map(user => user.id).join(', '));

    return (
      <View style={styles.container}>
        <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
          <Image source= {require('../logo.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
          <TouchableOpacity style= { [styles.avatar, {margin: 25, marginTop: 25,}] } onPress={goToProfile}>
            <Image source= {userData?.avatar_url? { uri: userData?.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
            <Text style= {[styles.username, {color: textColor}]}>{userData?.name || 'Guest'}</Text>
          </TouchableOpacity>
        </View>
        <View style= {[styles.inputArea, { backgroundColor: SecondaryBackgroundColor}]}>
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder='Search...'
          value = {searchText}
          onChangeText={setSearchText}
        />
        </View>
        <View style={[styles.content, {backgroundColor: backgroundColor}]}>
          <FlatList
            style={[styles.flatlist, {backgroundColor: backgroundColor}]}
            data={searchData}
            keyExtractor={item => item?.id}
            renderItem={renderItem}
            ListEmptyComponent={
            <Text style={styles.noUser}>No users found</Text>
            }
          />
        </View>
        <View style = {styles.navbar}>
          <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Home')}>
            <FontAwesome name="home" size={24} color={buttonTextColor} />
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Inbox')}>
            <FontAwesome name="comments" size={24} color={buttonTextColor} />
            <Text style={styles.buttonText}>Inbox</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.buttonText}>Schedule</Text>
          </TouchableOpacity> */}
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
      flex: 0.91,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    topbar: {
      flex: 0.06,
      flexDirection: 'row',
      width: '100%',
      padding: 20,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inputArea: {
      flex: 0.03,
      height: 40,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      verticalAlign: 'top',
      padding: 20,
    },
    input: {
      width: '80%',
      height: 40,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 15,
      padding: 10,
    },
    logo: {
      width: 120,
      height: 120,
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
      padding: 20,
    },
    username: {
      color: 'black', 
      width: 100, 
      fontSize: 11, 
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
      gap: 25, 
      alignContent: 'center',
    },
    usersItem: {
      padding: 15,
      margin: 10,
      marginBottom: 10,
      borderRadius: 8,
      justifyContent: 'center',
      resizeMode: 'contain',
    },
    usersName: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    usersEmail: {
      fontSize: 14,
    },
    usersSkills: {
      width: '75%',
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
      position: 'absolute',
      bottom: 0,
      flex: 0.08,
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
  });