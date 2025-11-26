import React, { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
//import { usePushToken } from '@/hooks/usePushToken';
//import { savePushToken } from '@/utils/savePushToken';
import { useNavigation, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession(); // REQUIRED FOR EXPO AUTH FLOW

const Login: React.FC = () => {

  const { userData, session, fetchSessionAndUserData, clearUserData, DarkMode } = useUserContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<{ id: string; email: any } | null>(null);
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

  //const { expoPushToken } = usePushToken();
  //const { savePushToken } = savePushToken();

  const checkSession = async () => {
    if(isFocused){
      try {
        if (session) {
          router.replace('/(tabs)/Home');
          //navigation.navigate('Home');
        }
      } catch (error) {
        console.error('Navigation Error:', error);
      }
    }
  };

  /*const checkSession = useCallback(() => {
    console.log('Session at login:', session);
    if (session && isFocused) {
      console.log('Navigating to Home');
      navigation.navigate('Home');
    }
  }, [session]);*/
  
  //hassan654666@gmail.com
  //dsaqw_1761

  // useEffect(() => {
  //   checkSession();
  // }, [session]);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     checkSession();
  //   }, [session])
  // );

  /*useEffect(() => {
    checkSession();
  }, []);*/

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      //setUser({ id: data.user.id, email: data.user.email });
      //Alert.alert('Success', 'You have logged in!');
      //fetchSessionAndUserData();
      //await savePushToken(user?.id, expoPushToken);
      //router.replace('/(tabs)/Home');
      //navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
      clearUserData();
    }
  };

  const handleGoogleLogin = async () => {
    
    try {
      
      const redirectUrl = Linking.createURL('/callback');

      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: {
        redirectTo: redirectUrl, // Custom URL scheme for deep linking
      },
     });
      if (error) throw error;
      console.log('Google login tapped!');
      //Alert.alert('Success', 'You are logged in!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  //savePushToken(user?.id);

  console.log('Login rendered');

  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: textColor}]}>Login</Text>
        <Image source={require('./logo.png')} style={styles.logo} />
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={{ width: '100%', alignItems: 'center', position: 'relative' }}>
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setShowPassword(!showPassword)}
      >
        <Ionicons
          name={showPassword ? 'eye' : 'eye-off'}
          size={24}
          color="#414141ff"
        />
      </TouchableOpacity>
      </View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={[styles.linkText, {color: linkTextColor}]}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={handleLogin}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Login</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={[styles.button, {flexDirection: 'row', backgroundColor: buttonColor, width: 'auto', alignItems: 'center'}]} onPress={handleGoogleLogin}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}> Continue with Google </Text>
          <FontAwesome name="google" size={24} color={buttonTextColor} style={{ marginLeft: 8 }} />
        </TouchableOpacity> */}

        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor, marginBottom: 30}]} onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Sign Up</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>Don't have an account? Signup</Text>
        </TouchableOpacity> */}

        <GoogleSignInButton />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '75%',
    height: 'auto',
    aspectRatio: 1,
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '80%',
    height: 40,
    // padding: 10,
    paddingRight: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  eyeButton: {
    position: 'absolute',
    right: 50,
    top: 10,
  },
  button: {
    width: '25%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  googleButton: {
    marginTop: 40,
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    marginTop: 20,
    backgroundColor: '#4267B2',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 16,
    //color: 'blue',
    textAlign: 'center',
    marginTop: 20,
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
});

export default Login;
