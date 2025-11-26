import React, { SetStateAction, useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList, Dimensions, Modal, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRouter} from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { color } from '@rneui/themed/dist/config';
import { FontAwesome } from '@expo/vector-icons';
import { he, th } from 'date-fns/locale';

const { width, height } = Dimensions.get("window");

export default function EditProfile(){

  const { session, thisUser, userData, fetchSessionAndUserData, DarkMode } = useUserContext();

  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [skillsoffered, setSkillsOff] = useState('');
  const [skillsrequired, setSkillsReq] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>();
  const [selectedHeaderImage, setSelectedHeaderImage] = useState<any>();

  const [EditName, setEditName] = useState(false);
  const [EditUsername, setEditUsername] = useState(false);
  const [EditEmail, setEditEmail] = useState(false);
  const [EditDescription, setEditDescription] = useState(false);

  const [visible, setVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');

  const navigation = useNavigation<any>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  // const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
  const buttonTextColor = "#fff";
    
  // function resetPassword() {
  //   // navigation.navigate('ResetPassword', {email: userData.email});
  //   router.push({
  //     pathname: '/ResetPassword',
  //     params: {
  //       email: userData.email
  //     }
  //   });
  // };

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
  
    if (Object.keys(profileUpdates).length === 0 && Object.keys(authUpdates.data!).length === 0 && selectedImage === undefined && selectedHeaderImage === undefined) {
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

      if(selectedHeaderImage){
        await uploadHeaderImage(selectedHeaderImage);
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

  const changeHeaderPic = async () => {
        await pickHeaderImage();
  }

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

  const pickHeaderImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 1],
      quality: 1,
      //base64: true,
    });

    if (!result.canceled) {
      //setSelectedImage(result.assets[0].uri);
      const image = result.assets[0].uri;
      //return image;
      setSelectedHeaderImage(image);
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

      const result = await fetch(theselectedImage);
      const blob = await result.blob();
      
      const file: any = {
        uri: theselectedImage,
        name: theselectedImage.split('/').pop(),
        type: typeof(theselectedImage),
      }

      const base64 = await FileSystem.readAsStringAsync(theselectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(imagePath, decode(base64), {
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

  const uploadHeaderImage = async (theselectedHeaderImage: any) => {
    if (!theselectedHeaderImage) {
      Alert.alert('Please select an image first.');
      return;
    }

    try {

      const imagePath = `${thisUser?.id}.png`;

      const result = await fetch(theselectedHeaderImage);
      const blob = await result.blob();
      
      const file: any = {
        uri: theselectedHeaderImage,
        name: theselectedHeaderImage.split('/').pop(),
        type: typeof(theselectedHeaderImage),
      }

      const base64 = await FileSystem.readAsStringAsync(theselectedHeaderImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.storage
        .from('headers')
        .upload(imagePath, decode(base64), {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const publicUrl = supabase.storage
        .from('headers')
        .getPublicUrl(imagePath).data.publicUrl;

      console.log('Public URL:', publicUrl);

      await supabase
      .from('profiles')
      .update({ header_url: publicUrl })
      .eq("authid", thisUser?.id);

    } catch (error: any) {
      console.error('Upload failed:', error.message);
      Alert.alert('Image upload failed.');
    }
  };

  const backAction = () => {
    if(router.canGoBack()){
    router.back();
    } else {
    router.replace('/(tabs)/Home');
    //router.push('/Home');
    }
    //navigation.navigate('Inbox'); 
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
  
      const channel = supabase.channel('EditProfileChannel');
  
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
  
  console.log('Edit Profile rendered');

  return(
    <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
      <View style= {[styles.topbar, {backgroundColor: backgroundColor}]}>
        <TouchableOpacity style= { {margin: 10, marginLeft: 15} } onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Header Image */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => {
          if(userData?.header_url) {
            setImageUri('header');
            setVisible(true);
          }
        }}>
          <Image
            source={selectedHeaderImage? {uri: selectedHeaderImage } : userData?.header_url? {uri: userData?.header_url } : require('./Header.png')}
            style={styles.headerImage}
          />
          <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 50, }}>
              <FontAwesome name="pencil" size={16} color="white" onPress={changeHeaderPic} />
          </View>
        </Pressable>
        <Pressable  onPress={() => {
          if(userData?.avatar_url) {
            setImageUri('avatar');
            setVisible(true);
          }
        }}>
          <Image
            source={selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png')}
            style={styles.avatar}
          />
          <View style={{ position: 'absolute', top: -5, left: 15, backgroundColor: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 50, }}>
              <FontAwesome name="pencil" size={16} color="white" onPress={changePic} />
          </View>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Close Modal by tapping anywhere */}
          <Pressable
            style={{
              position: "absolute",
              top: 20,
              left: 20,
            }}
            onPress={() => setVisible(false)}
          >
          <FontAwesome name="arrow-left" size={20} color="white" />
          </Pressable>

          {/* Image */}
          <Image
            source={imageUri === 'header' ? (selectedHeaderImage? {uri: selectedHeaderImage } : userData?.header_url? {uri: userData?.header_url } : require('./Header.png')) : (selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png'))}
            resizeMode="contain"
            style={{ width: "100%", height: "80%" }}
          />

          {/* Pencil Edit Button */}
          <Pressable
            onPress={imageUri === 'header' ? changeHeaderPic : changePic}
            style={{
              position: "absolute",
              bottom: 40,
              right: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: 12,
              borderRadius: 50,
            }}
          >
            <FontAwesome name="pencil" size={24} color="white" />
          </Pressable>
        </View>
      </Modal>
            
      <View style= {styles.content}>
        {/* <Image source= {selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png')} style= {[styles.avatar, {marginTop: 10,}]}></Image> */}
        
        
        <View style = {[styles.fields, {backgroundColor: backgroundColor}]}>

          <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
          {!EditName && (<Text style={[styles.title, {color: textColor, marginBottom: 10}]}>{'Name: ' + userData?.name}</Text>)}
          <FontAwesome name="pencil" size={16} color={textColor} style={{ position: 'absolute', right: 10, top: 5 }} onPress={() => {setEditName(!EditName)}} />
          {EditName && (<TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Name: ' + userData?.name}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />)}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
          {!EditUsername && (<Text style={[styles.title, {color: textColor, marginBottom: 10}]}>{'Username: @' + userData?.username}</Text>)}
          <FontAwesome name="pencil" size={16} color={textColor} style={{ position: 'absolute', right: 10, top: 5 }} onPress={() => {setEditUsername(!EditUsername)}} />
          {EditUsername && (<TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Username: @' + userData?.username}
            value={username}
            onChangeText={setUserName}
            autoCapitalize="none"
          />)}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
          {!EditEmail && (<Text style={[styles.title, {color: textColor, marginBottom: 10}]}>{'Email: ' + userData?.email}</Text>)}
          <FontAwesome name="pencil" size={16} color={textColor} style={{ position: 'absolute', right: 10, top: 5 }} onPress={() => {setEditEmail(!EditEmail)}} />
          {EditEmail && (<TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Email: ' + userData?.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />)}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
          {!EditDescription && (<Text style={[styles.title, {color: textColor, marginBottom: 10, width: '70%'}]}>{'Description: ' + userData?.description}</Text>)}
          <FontAwesome name="pencil" size={16} color={textColor} style={{ position: 'absolute', right: 10, top: 5 }} onPress={() => {setEditDescription(!EditDescription)}} />
          {EditDescription && (<TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Description: ' + userData?.description}
            value={description}
            onChangeText={setDescription}
            autoCapitalize="none"
          />)}
          </View>
          {/* <TextInput
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
          /> */}
        </View>
        <View style={{justifyContent: 'center'}}>
          {/* <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor, marginBottom: 25}]} onPress={resetPassword}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Reset password</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor,}]} onPress={save}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor,}]} onPress={() => navigation.navigate('Profile')}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Cancel</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </View>

  );

}

const styles = StyleSheet.create({
  container:{
      flex: 1,
      // alignContent: 'center',
      // justifyContent: 'center',
      // alignItems: 'center',
      //padding: 20,
  },
  topbar: {
    // flex: 0.1,
    // position: 'absolute',
    // top: 0,
    flexDirection: 'row',
    width: '100%',
    height: height * 0.06,
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
      flex: 1,
      // padding: 30,
      width: '100%',
      justifyContent: 'space-evenly',
      alignContent: 'center',
      alignItems: 'center',
      //textAlign: 'left',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fields: {
    width: '100%',
    //height: '45%',
    //paddingHorizontal: 20,
    marginTop: 10,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    minWidth: '30%',
    height: 40,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 5,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  headerContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  avatar: {
    position: 'absolute',
    bottom: -20,
    left: 15,
    width: 80,
    height: 80,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  input: { 
    width: '80%',
    height: 40, 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 10, 
  },
})