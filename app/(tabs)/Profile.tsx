import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
//import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
//import { Picker } from '@react-native-picker/picker';
//import CheckBox from 'expo-checkbox';
//import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
//import * as ImagePicker from 'expo-image-picker';
//import { Avatar } from '@rneui/themed';
//import { BackgroundImage } from '@rneui/themed/dist/config';

export default function Profile(){

    //const [selectedImage, setSelectedImage] = useState<any>();
    //const [uploading, setUploading] = useState(false);
    //const [avatarURL, setAvatarURL] = useState<any>();
    //const [userdata, setUserData] = useState<any>();
    //const [sessionChecked, setSessionChecked] = useState(false);
    //const [thisuser, setThisUser] = useState<any>();
    const navigation = useNavigation<any>();
    //const isFocused = useIsFocused();
    
    //const { session, thisUser, usersData, userData, fetchSessionAndUserData } = useUserContext();
    const { session, userData } = useUserContext();

    useEffect(() => {
      if (!session) {
        if (navigation.getState().routes[0]?.name !== 'LoginPage') {
          navigation.navigate('LoginPage', { screen: 'Login' });
        }
      }
    }, [session]);

    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
  
        Alert.alert('Success', 'You have been logged out.');
          navigation.navigate('LoginPage', {screen: 'Login'});
          //setSessionChecked(false);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    };

    function editProfile() {
      navigation.navigate('Edit Profile');
      //setSessionChecked(false);
    }

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home'); // Navigate to a specific screen
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup
  }, [navigation]);
  
  console.log('Profile rendered');

      return(
        <View style= {styles.container}>
            <Image source= {userData?.avatar_url? {uri: userData?.avatar_url } : require('../Avatar.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
            <View style = {styles.content}>
              <Text style= {styles.title}>Name: {userData?.name}</Text>
              <Text style= {styles.title}>Username: @{userData?.username}</Text>
              <Text style= {styles.title}>Email: {userData?.email}</Text>
              <Text style= {styles.title}>Description: {userData?.description}</Text>
              <Text style= {styles.title}>Skills Offered: {userData?.skillsOffered}</Text>
              <Text style= {styles.title}>Skills Required: {userData?.skillsRequired}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={editProfile}>
                <Text style={styles.buttonText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor: 'red',}]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log Out</Text>
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
        //textAlign: 'left',
        padding: 10,
        //margin: 10,
        backgroundColor: 'white',
    },
    content:{
        flex: 0.5,
        justifyContent: 'center',
        alignContent: 'center',
        //alignItems: 'center',
        textAlign: 'left',
        padding: 40,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        //color: 'white',
        marginBottom: 5,
      },
      button: {
        width: '25%',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#007BFF',
        margin: 20,
        //backgroundColor: 'black',
      },
      buttonText: {
        color: '#f5f5f5',
        fontWeight: 'bold',
      },
      logo: {
        width: 300,
        height: 300,
        marginBottom: 20,
      },

})