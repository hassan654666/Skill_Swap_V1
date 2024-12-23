import React, { useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    // try {
    //   const { data, error: signUpError } = await supabase.auth.signUp({
    //     email,
    //     password,
    //     options: {
    //       data: {
    //         full_name: name,
    //         username: username,
    //       },
    //       emailRedirectTo: 'skillswap://Home',
    //     },
    //   });  
    //   if (signUpError) throw signUpError;  
    //   Alert.alert('Success', 'Account created! Please check your email for confirmation.');
      try {
        const { data: insertData, error: insertError } = await supabase.from('Test').upsert({
          name: name,
          username: username,
          email: email,
        });
        if (insertError) throw insertError;
        console.log('User data saved:', insertData);        
      } catch (insertError: any) {
        Alert.alert('Error', insertError.message);
      }
    // } catch (error: any) {
    //   Alert.alert('Error', error.message);
    // }
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <Image source={require('../logo.png')} style={styles.logo} />

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUserName}
        autoCapitalize="none"
      />
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
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 40 
  },
  input: { 
    width: '100%', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 10 
  },
  button: { 
    width: '50%', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    backgroundColor: '#007BFF',
    marginTop: 30, 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 50,
  },
});
export default SignupPage;
