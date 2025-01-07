import React, { useState, useEffect } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
//import { useIsFocused } from '@react-navigation/native';
//import * as webBrowser from 'expo-web-browser'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<any>(); // Correct usage of useNavigation
  //const isfocused = useIsFocused();

  //const { session, thisUser, usersData, userData, fetchSessionAndUserData } = useUserContext();
  const { session } = useUserContext();
    
  useEffect(() => {
    if (session) {
      if (navigation.getState().routes[0]?.name !== 'HomePage') {
        navigation.navigate('HomePage', { screen: 'Home' });
      }
    }
  }, [session]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      Alert.alert('Success', 'You are logged in!');
      navigation.navigate('HomePage', {screen: 'Home'});
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // const handleGoogleLogin = async () => {
  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({ 
  //       provider: 'google', 
  //       options: {
  //       redirectTo: 'skillswap://Home', // Custom URL scheme for deep linking
  //     },
  //    });
  //     if (error) throw error;
  //     //Alert.alert('Success', 'You are logged in!');
  //   } catch (error: any) {
  //     Alert.alert('Error', error.message);
  //   }
  // };

  // const handleFacebookLogin = async () => {
  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
  //     if (error) throw error;
  //   } catch (error: any) {
  //     Alert.alert('Error', error.message);
  //   }
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Image source={require('../logo.png')} style={styles.logo} />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Forgot Password')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Sign In with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.facebookButton]} onPress={handleFacebookLogin}>
        <Text style={styles.buttonText}>Sign In with Facebook</Text>
      </TouchableOpacity> */}

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
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
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: {
    width: '25%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#007BFF',
  },
  googleButton: {
    marginTop: 40,
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    marginTop: 20,
    backgroundColor: '#4267B2',
    //marginBottom: 20,
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

export default LoginPage;
