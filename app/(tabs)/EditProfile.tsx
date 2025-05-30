import React, { SetStateAction, useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { color } from '@rneui/themed/dist/config';

export default function EditProfile(){

  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [skillsoffered, setSkillsOff] = useState('');
  const [skillsrequired, setSkillsReq] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>();
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#929292' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';

  const { session, thisUser, userData, fetchSessionAndUserData } = useUserContext();
    
  function resetPassword() {
    navigation.navigate('ResetPassword');
  };

  const save = async () => {
    const profileUpdates: {
      name?: string;
      username?: string;
      email?: string;
      description?: string;
      skillsOffered?: string;
      skillsRequired?: string;
    } = {};
  
    const authUpdates: {
      email?: string;
      data?: {
        full_name?: string;
        username?: string;
      };
    } = { data: {} };
  
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
  
    if (Object.keys(profileUpdates).length === 0 && Object.keys(authUpdates.data!).length === 0 && selectedImage === undefined) {
      Alert.alert('Error', 'No fields to update!');
      navigation.navigate('Profile'); 
      return;
    }
  
    try {
 
      if (authUpdates.email || Object.keys(authUpdates.data!).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }
  
      const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('authid', thisUser.id);
      if (profileError) throw profileError;

      if(selectedImage){
        await uploadImage(selectedImage);
      }
  
      Alert.alert('Success', 'Profile updated successfully!');
      fetchSessionAndUserData();
      navigation.navigate('Profile'); 
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

      console.log('Public URL:', publicUrl);

      await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq("authid", thisUser?.id);

    } catch (error: any) {
      console.error('Upload failed:', error.message);
      Alert.alert('Image upload failed.');
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Profile'); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup
  }, [navigation]);
  
  console.log('Edit Profile rendered');

  return(
    <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
      <Image source= {selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('../Avatar.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
      <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={changePic}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Change picture</Text>
      </TouchableOpacity>
      <View style = {[styles.fields, {backgroundColor: backgroundColor}]}>
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder={'Name: ' + userData?.name}
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder={'Username: @' + userData?.username}
          value={username}
          onChangeText={setUserName}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder={'Email: ' + userData?.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder={'Description: ' + userData?.description}
          value={description}
          onChangeText={setDescription}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder={'Skills Offered: ' + userData?.skillsOffered}
          value={skillsoffered}
          onChangeText={setSkillsOff}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder={'Skills Required: ' + userData?.skillsRequired}
          value={skillsrequired}
          onChangeText={setSkillsReq}
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor,}]} onPress={save}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor,}]} onPress={() => navigation.navigate('Profile')}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, {marginTop: 20, backgroundColor: buttonColor}]} onPress={resetPassword}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Reset password</Text>
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
        padding: 20,
    },
    content:{
        flex: 0.8,
        justifyContent: 'center',
        alignContent: 'center',
        textAlign: 'left',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
      },
    fields: {
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
    button: {
        minWidth: '25%',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        margin: 10,
      },
    buttonText: {
        fontWeight: 'bold',
      },
    logo: {
        width: 225,
        height: 225,
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