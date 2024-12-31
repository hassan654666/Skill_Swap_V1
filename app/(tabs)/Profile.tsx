import React, { useEffect, useState } from 'react';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
//import { Picker } from '@react-native-picker/picker';
//import CheckBox from 'expo-checkbox';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@rneui/themed';
import { BackgroundImage } from '@rneui/themed/dist/config';

export default function Profile(){

    const [selectedImage, setSelectedImage] = useState<any>();
    const [uploading, setUploading] = useState(false);
    const [avatarURL, setAvatarURL] = useState<any>();
    const [userdata, setUserData] = useState<any>();
    const [thisuser, setThisUser] = useState<any>();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    

    const checkSession = async () => {
        const {data: {session}} = await supabase.auth.getSession();
        console.log('session at Profile: ')
        console.log(session)
        if(!session){
          navigation.navigate('LoginPage', {screen: 'Login'});
          return;
        }
        const { data: {user}} = await supabase.auth.getUser();
        if(user){
          setThisUser(user);
          fetchUserProfile(user.id);
        }
      };

    const handleLogout = async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
    
          Alert.alert('Success', 'You have been logged out.');
            navigation.navigate('LoginPage', {screen: 'Login'});
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      };

      function editProfile() {
        navigation.navigate('Edit Profile');
      }

    const fetchUserProfile = async (userId: any) => {
      try {
        if (userId) {
            
        const { data, error } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, skillsOffered, skillsRequired, avatar_url, description')
          .eq('authid', userId)
          .single();
    
        if (error) throw error;
        setUserData(data);
        return data;
      } else {
          console.log('No user session found');
      }
      } catch (error: any) {
        console.error('Error fetching profile:', error.message);
        return null;
      }
    };

  useEffect(() => {  
    if(isFocused){  
      checkSession();
    }
  }, [isFocused]);

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home'); // Navigate to a specific screen
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup
  }, [navigation]);
  

      return(
        <View style= {styles.container}>
            {/* <Text style= {styles.title}>Profile</Text> */}
            <Image source= {userdata?.avatar_url? {uri: userdata?.avatar_url } : require('../Avatar.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
            <View style = {styles.content}>
              <Text style= {styles.title}>Name: {userdata?.name}</Text>
              <Text style= {styles.title}>Username: @{userdata?.username}</Text>
              <Text style= {styles.title}>Email: {userdata?.email}</Text>
              <Text style= {styles.title}>Description: {userdata?.description}</Text>
              <Text style= {styles.title}>Skills Offered: {userdata?.skillsOffered}</Text>
              <Text style= {styles.title}>Skills Required: {userdata?.skillsRequired}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={editProfile}>
                <Text style={styles.buttonText}>Edit profile</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.button} onPress={uploadImage}>
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity> */}
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