import React, { SetStateAction, useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
//import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
//import { Picker } from '@react-native-picker/picker';
//import CheckBox from 'expo-checkbox';
//import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// import { Avatar } from '@rneui/themed';
// import { BackgroundImage } from '@rneui/themed/dist/config';

export default function EditProfile(){

  const [sessionChecked, setSessionChecked] = useState(false);
  //const [userdata, setUserData] = useState<any>();
  //const [thisuser, setThisUser] = useState<any>();
  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [skillsoffered, setSkillsOff] = useState('');
  const [skillsrequired, setSkillsReq] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>();
  const navigation = useNavigation<any>();
  //const isFocused = useIsFocused();

  //const { session, thisUser, usersData, userData, fetchSessionAndUserData } = useUserContext();
  const { session, thisUser, userData, fetchSessionAndUserData } = useUserContext();
  
  useEffect(() => {
    if (!session) {
      if (navigation.getState().routes[0]?.name !== 'LoginPage') {
        navigation.navigate('LoginPage', { screen: 'Login' });
      }
    }
  }, [session]);
    
  // useEffect(() => {
  //   const fetchSessionAndUserData = async () => {
  //     try {
  //       // Check session
  //       const { data: { session } } = await supabase.auth.getSession();
  //       console.log('Session at Edit Profile:', session);
  
  //       if (!session) {
  //         if (navigation.getState().routes[0]?.name !== 'LoginPage') {
  //           navigation.navigate('LoginPage', { screen: 'Login' });
  //         }
  //         return;
  //       }
  
  //       // Fetch authenticated user
  //       const { data: { user } } = await supabase.auth.getUser();
  //       if (user) {
  //         setThisUser(user);
  
  //         // Fetch user profile
  //         const { data: profileData, error } = await supabase
  //           .from('profiles')
  //           .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url')
  //           .eq('authid', user.id)
  //           .single();
  
  //         if (error) throw error;
  //         setUserData(profileData);
  //       } else {
  //         console.log('No authenticated user found.');
  //       }
  //     } catch (error: any) {
  //       console.error('Error:', error.message);
  //     }
  //   };
  
  //   fetchSessionAndUserData();
  // }, []); // Empty dependency array ensures this runs only once on mount.

  function resetPassword() {
    navigation.navigate('Reset Password');
  };

  const save = async () => {
    // Build the updates dynamically for profiles and auth
    const profileUpdates: {
      name?: string;
      username?: string;
      email?: string;
      description?: string;
      skillsOffered?: string;
      skillsRequired?: string;
      //authid?: string;
    } = {};
  
    const authUpdates: {
      email?: string;
      data?: {
        full_name?: string;
        username?: string;
      };
    } = { data: {} };
  
    // Add fields only if they are not empty
    if (name) {
      profileUpdates.name = name;
      authUpdates.data!.full_name = name;
    }
    if (username) {
      profileUpdates.username = username;
      authUpdates.data!.username = username;
    }
    if (email) {
      profileUpdates.email = email;
      authUpdates.email = email;
    }
    if (description) profileUpdates.description = description;
    if (skillsoffered) profileUpdates.skillsOffered = skillsoffered;
    if (skillsrequired) profileUpdates.skillsRequired = skillsrequired;
  
    // Ensure there are updates to make
    if (Object.keys(profileUpdates).length === 0 && Object.keys(authUpdates.data!).length === 0 && selectedImage === undefined) {
      Alert.alert('Error', 'No fields to update!');
      navigation.navigate('Profile'); // Navigate to the Profile screen
      return;
    }
  
    try {
      // Update Supabase Auth user if there are auth updates
      if (authUpdates.email || Object.keys(authUpdates.data!).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }
  
      // Update or insert into profiles table
      //profileUpdates.authid = thisuser.id; // Ensure authid is included for upsert
      const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('authid', thisUser.id);
      if (profileError) throw profileError;

      if(selectedImage){
        await uploadImage(selectedImage);
      }
  
      Alert.alert('Success', 'Profile updated successfully!');
      fetchSessionAndUserData();
      navigation.navigate('Profile'); // Navigate to the Profile screen
    } catch (error: any) {
      console.error('Error saving profile:', error.message);
      Alert.alert('Error', error.message);
    }
  };

  const changePic = async () => {
        await pickImage();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      //base64: true,
    });

    if (!result.canceled) {
      //setSelectedImage(result.assets[0].uri);
      const image = result.assets[0].uri;
      //return image;
      setSelectedImage(image);
      //uploadImage(image);
      //console.log("image: ", selectedImage);
    }
  };  

  const uploadImage = async (theselectedImage: any) => {
    if (!theselectedImage) {
      Alert.alert('Please select an image first.');
      return;
    }

    try {
      //setUploading(true);

      const imagePath = `${thisUser?.id}.png`;
      
      const file = {
        uri: theselectedImage,
        name: theselectedImage.split('/').pop(),
        type: typeof(theselectedImage),
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(imagePath, file, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const publicUrl = supabase.storage
        .from('avatars')
        .getPublicUrl(imagePath).data.publicUrl;

       //Alert.alert('Image uploaded successfully!');
      console.log('Public URL:', publicUrl);

      //setAvatarURL(publicUrl);

      await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq("authid", thisUser?.id);

    } catch (error: any) {
      console.error('Upload failed:', error.message);
      Alert.alert('Image upload failed.');
    } finally {
      //setUploading(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Profile'); // Navigate to a specific screen
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup
  }, [navigation]);
  
  console.log('Edit Profile rendered');

  return(
    <View style= {styles.container}>
      <Image source= {selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('../Avatar.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
      <TouchableOpacity style={styles.button} onPress={changePic}>
          <Text style={styles.buttonText}>Change picture</Text>
      </TouchableOpacity>
      <View style = {styles.fields}>
        <TextInput
          style={styles.input}
          placeholder={'Name: ' + userData?.name}
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={'Username: @' + userData?.username}
          value={username}
          onChangeText={setUserName}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={'Email: ' + userData?.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={'Description: ' + userData?.description}
          value={description}
          onChangeText={setDescription}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={'Skills Offered: ' + userData?.skillsOffered}
          value={skillsoffered}
          onChangeText={setSkillsOff}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={'Skills Required: ' + userData?.skillsRequired}
          value={skillsrequired}
          onChangeText={setSkillsReq}
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity style={[styles.button, {width: '20%',}]} onPress={save}>
          <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, {marginTop: 20,}]} onPress={resetPassword}>
          <Text style={styles.buttonText}>Reset password</Text>
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
        padding: 20,
        //margin: 10,
        backgroundColor: 'white',
    },
    content:{
        flex: 0.8,
        justifyContent: 'center',
        alignContent: 'center',
        //alignItems: 'center',
        textAlign: 'left',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        //color: 'white',
        marginBottom: 5,
      },
    fields: {
        //flex: 0.8,
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
    button: {
        //width: '32%',
        minWidth: '25%',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#007BFF',
        margin: 10,
        //backgroundColor: 'black',
      },
    buttonText: {
        color: '#f5f5f5',
        fontWeight: 'bold',
      },
    logo: {
        width: 225,
        height: 225,
        //marginBottom: 0,
      },
    input: { 
        width: '100%', 
        height: 40, 
        padding: 10, 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 8, 
        marginBottom: 10, 
      },
})