import React, { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, useColorScheme, BackHandler } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const Login: React.FC = () => {
  const { userData, session, fetchSessionAndUserData, clearUserData, DarkMode } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  //const [user, setUser] = useState<{ id: string; email: any } | null>(null);
  const navigation = useNavigation<any>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  // const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';

  const checkSession = async () => {
    if(isFocused){
      try {
        if (session) {
          router.replace('/(tabs)/Home')
          //navigation.navigate('Home');
        }
      } catch (error) {
        console.error('Navigation Error:', error);
      }
    }
  };

  useFocusEffect(
      useCallback(() => {
        checkSession();
      }, [session])
    );

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      //setUser({ id: data.user.id, email: data.user.email });
      //Alert.alert('Success', 'You have logged in!');
      //fetchSessionAndUserData();
      //await savePushToken(user?.id, expoPushToken);
      //navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
      clearUserData();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: {
        redirectTo: 'skillswap://Home', // Custom URL scheme for deep linking
      },
     });
      if (error) throw error;
      //Alert.alert('Success', 'You are logged in!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  //savePushToken(user?.id);

  const backAction = () => {
      return true; 
    };
  
    useFocusEffect(
      useCallback(() => {    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
      }, [])
    );

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
        <TextInput
          style={[styles.input, {backgroundColor: inputColor}]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={handleLogin}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Login</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={[styles.button, {flexDirection: 'row', backgroundColor: buttonColor, width: 'auto', alignItems: 'center'}]} onPress={handleGoogleLogin}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}> Continue with Google </Text>
          <FontAwesome name="google" size={24} color={buttonTextColor} style={{ marginLeft: 8 }} />
        </TouchableOpacity> */}

        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Sign Up</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>Don't have an account? Signup</Text>
        </TouchableOpacity> */}

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
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
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
    color: 'blue',
    textAlign: 'center',
    marginTop: 20,
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
});

export default Login;
