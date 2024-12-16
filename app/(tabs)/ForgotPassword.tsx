import React, { useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'skillswap://ResetPassword',
      });
      if (error) throw error;
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Image source={require('../logo.png')} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Send Reset Email</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Reuse styles from LoginPage or customize as needed
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#FFFFFF' 
  },
  title: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    marginBottom: 50 
  },
  input: { 
    width: '100%', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 30 
  },
  button: { 
    width: '50%', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    backgroundColor: '#007BFF' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  linkText: { 
    color: '#007BFF', 
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
