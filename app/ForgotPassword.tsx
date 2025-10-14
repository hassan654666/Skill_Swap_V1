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
  // const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';

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
      <Text style={styles.title}>Forgot Password</Text>
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
