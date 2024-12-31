import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as webBrowser from 'expo-web-browser'

export default function ResetPassword() {
  const [userdata, setUserData] = useState<any>();
  const [thisuser, setThisUser] = useState<any>();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigation = useNavigation<any>(); 
  const isfocused = useIsFocused();

  const checkSession = async () => {
    const {data: {session}} = await supabase.auth.getSession();
    console.log('session at Edit Profile: ')
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

  useEffect(() => {
    if(isfocused){
      checkSession();
    }
  }, [isfocused]);

  const changePassword = async () => {
    if(newPassword != ''){
      if(newPassword === confirm){
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          Alert.alert('Success', 'Password has been reset!');
          navigation.navigate('Home', {screen: 'Home'});
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      } else{
        Alert.alert('Error', 'Password was not confirmed!');
      }
    } else {
      Alert.alert('Error', 'No password entered!');
    }
  };

  const fetchUserProfile = async (userId: any) => {
      try {
        if (userId) {
            
        const { data, error } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url')
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
        const backAction = () => {
          navigation.navigate('Edit Profile'); // Navigate to a specific screen
          return true; // Prevent default back action
        };
    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
        return () => backHandler.remove(); // Cleanup
      }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Image source={userdata?.avatar_url? {uri: userdata?.avatar_url } : require('../Avatar.png')} style={styles.logo} />
      <View style = {styles.content}>
        <Text style= {styles.name}>{userdata?.name}</Text>
        <Text style= {styles.userName}>@{userdata?.username}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter new Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={changePassword}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Edit Profile')}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    //margin: 10,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  content:{
    flex: 0.3,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    width: '25%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 16,
    color: '#007BFF',
    textAlign: 'center',
    marginTop: 20,
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
});
