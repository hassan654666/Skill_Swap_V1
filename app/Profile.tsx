import React, { useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { BackHandler } from 'react-native';
import { color } from '@rneui/themed/dist/config';
import { Avatar } from '@rneui/themed';
import { FontAwesome } from '@expo/vector-icons';
//import { removePushToken } from '@/utils/removePushToken';


export default function Profile(){
    const { session, userData, fetchSessionAndUserData, clearUserData, DarkMode } = useUserContext();
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

    const checkSession = async () => {
      if(isFocused){
        try {
          if (!session) {
            router.replace('/Login');
            //navigation.navigate('Login');
          }
        } catch (error) {
          console.error('Navigation Error:', error);
        }
      }
    };
  
    useFocusEffect(
      useCallback(() => {
        checkSession();
      }, [session])
    );
    

    const handleLogout = async () => {
      try {
        clearUserData();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        //navigation.navigate('Login');
        //removePushToken(userData?.id);
        //Alert.alert('Success', 'You have been logged out.');
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    };

    function editProfile() {
      //navigation.navigate('EditProfile');
      router.push('/EditProfile')
    }

  const backAction = () => {
     if(router.canGoBack()){
       router.back();
     } else {
     router.replace('/(tabs)/Home');
     //router.push('/Home');
     }
     return true; 
   };
 
   useFocusEffect(
     useCallback(() => {    
       const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
       return () => backHandler.remove();
     }, [])
   );

  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase.channel('ProfileChannel');

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userData?.id}`,
      },
      (payload) => {
        console.log('Profile updated:', payload.new);
        // Fetch the updated user data
        fetchSessionAndUserData();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  console.log('Profile rendered');

  return(
    <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
      <View style= {[styles.topbar, {backgroundColor: backgroundColor}]}>
        <TouchableOpacity style= { {margin: 10, marginLeft: 15} } onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
      </View>
      <View style = {styles.content}>
        <Image source= {userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png')} style= {[styles.avatar, {marginTop: 10,}]}></Image>
        <View style = {styles.userInfo}>
          <Text style= {[styles.title, {color: textColor}]}>Name: {userData?.name}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Username: @{userData?.username}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Email: {userData?.email}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Description: {userData?.description}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Skills Offered: {userData?.skillsOffered}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Skills Required: {userData?.skillsRequired}</Text>
        </View>
        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={editProfile}>
            <Text style={[styles.buttonText, {color: buttonTextColor}]}>Edit profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, {backgroundColor: redButton,}]} onPress={handleLogout}>
            <Text style={[styles.buttonText, {color: buttonTextColor}]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>

  );

}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 10,
  },
  topbar: {
    // flex: 0.1,
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    width: '100%',
    height: 60,
    //marginBottom: '10%',
    //height: '6.6%',
    //padding: 20,
    alignItems: 'center',
    //justifyContent: 'flex-start', 
    verticalAlign: 'top',
    //flexGrow: 1,
    //flexShrink: 0,
  },
  content:{
      flex: 0.9,
      width: '100%',
      paddingTop: 20,
      paddingBottom: 20,
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'center',
      //textAlign: 'left',
      //padding: 10,
  },
  userInfo:{
      //flex: 0.6,
      marginLeft: 10,
      marginRight: 10,
      paddingLeft: 10,
      paddingRight: 10,
      justifyContent: 'center',
      alignContent: 'center',
      textAlign: 'left',
      padding: 5,
  },
  title: {
      fontSize: 15,
      fontWeight: 'bold',
      marginBottom: 5,
      padding: 5,
  },
  button: {
    width: '25%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  avatar: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },

})