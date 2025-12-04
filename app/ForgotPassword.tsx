import React, { useState, useEffect } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import { useUserContext } from '@/components/UserContext';

const ForgotPassword: React.FC = () => {
  const { DarkMode } = useUserContext();
  const [email, setEmail] = useState('');
  const navigation = useNavigation<any>();
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

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `skillswap://ResetPassword`,
      });
      if (error) throw error;
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Login'); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); 
  }, [navigation]);

  console.log('Forgot Password rendered');

  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <Text style={[styles.title, {color: textColor}]}>Forgot Password</Text>
      <Image source={require('./logo.png')} style={styles.logo} />
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={handleResetPassword}>
        <Text style={[styles.buttonText, {color: buttonTextColor}]}>Send Reset Email</Text>
      </TouchableOpacity>

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
  },
  title: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    marginBottom: 50 
  },
  input: { 
    width: '80%', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 30 
  },
  button: { 
    width: '35%', 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
  },
  buttonText: { 
    fontWeight: 'bold' 
  },
  linkText: { 
    color: 'blue', 
    textAlign: 'center', 
    marginTop: 40, 
    marginVertical: 10, 
    textDecorationLine: 'underline', 
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 50,
  },
});
export default ForgotPassword;
