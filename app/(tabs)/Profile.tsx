import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import { color } from '@rneui/themed/dist/config';


export default function Profile(){

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
    
    const { session, userData, fetchSessionAndUserData } = useUserContext();

    useEffect(() => {
      if(isFocused){
        try {
          if (!session) {
            navigation.navigate('LoginPage', { screen: 'Login' });
          }
        } catch (error) {
          console.error('Navigation Error:', error);
        }
      }
    }, [session]);
    

    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        navigation.navigate('LoginPage', {screen: 'Login'});
        Alert.alert('Success', 'You have been logged out.');
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    };

    function editProfile() {
      navigation.navigate('Edit Profile');
    }

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home'); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); 
  }, [navigation]);
  
  console.log('Profile rendered');

      return(
        <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
            <Image source= {userData?.avatar_url? {uri: userData?.avatar_url } : require('../Avatar.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
            <View style = {styles.content}>
              <Text style= {styles.title}>Name: {userData?.name}</Text>
              <Text style= {styles.title}>Username: @{userData?.username}</Text>
              <Text style= {styles.title}>Email: {userData?.email}</Text>
              <Text style= {styles.title}>Description: {userData?.description}</Text>
              <Text style= {styles.title}>Skills Offered: {userData?.skillsOffered}</Text>
              <Text style= {styles.title}>Skills Required: {userData?.skillsRequired}</Text>
            </View>
            <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={editProfile}>
                <Text style={[styles.buttonText, {color: buttonTextColor}]}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor: 'red',}]} onPress={handleLogout}>
                <Text style={[styles.buttonText, {color: buttonTextColor}]}>Log Out</Text>
            </TouchableOpacity>
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
        flex: 0.5,
        justifyContent: 'center',
        alignContent: 'center',
        textAlign: 'left',
        padding: 40,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      button: {
        width: '25%',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        margin: 20,
      },
      buttonText: {
        fontWeight: 'bold',
      },
      logo: {
        width: 300,
        height: 300,
        marginBottom: 20,
      },

})