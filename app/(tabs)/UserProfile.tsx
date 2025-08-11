import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import { color } from '@rneui/themed/dist/config';
import { Avatar } from '@rneui/themed';


export default function Profile(){

    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const colorScheme = useColorScheme();
    const DarkMode = colorScheme === 'dark';
    const textColor = DarkMode ? '#fff' : '#000';
    const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
    const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
    const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
    const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
    const buttonColor = DarkMode ? '#333' : '#007BFF';
    const buttonTextColor = DarkMode ? '#fff' : '#fff';
    
    const { session, usersData, fetchSessionAndUserData, clearUserData } = useUserContext();
    const route = useRoute();
    const userId = (route.params as { userId?: string })?.userId;
    // console.log('User ID from route:', userId);

    useEffect(() => {
      if(isFocused){
        try {
          if (!session) {
            navigation.navigate('Login');
          }
        } catch (error) {
          console.error('Navigation Error:', error);
        }
      }
    }, [session]);
    
    const userData = usersData?.find((users: any) =>
    users?.id === userId
    );

    function MessageUser() {
      navigation.navigate('ChatScreen', { receiverId: userId });
    }

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home'); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); 
  }, [navigation]);

  // console.log('User Profile rendered');

  return(
    <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
      <View style = {styles.content}>
        <Image source= {userData?.avatar_url? {uri: userData?.avatar_url } : require('../Avatar.png')} style= {[styles.avatar, {marginTop: 10,}]}></Image>
        <View style = {styles.userInfo}>
          <Text style= {[styles.title, {color: textColor}]}>Name: {userData?.name}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Username: @{userData?.username}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Description: {userData?.description}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Skills Offered: {userData?.skillsOffered}</Text>
          <Text style= {[styles.title, {color: textColor}]}>Skills Required: {userData?.skillsRequired}</Text>
        </View>
        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={MessageUser}>
            <Text style={[styles.buttonText, {color: buttonTextColor}]}>Message</Text>
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
        padding: 10,
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