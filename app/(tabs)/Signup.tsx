import React, { useState, useEffect } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';

const SignupPage: React.FC = () => {
  const [user, setUser] = useState<any>();
  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillsoffered, setSkillsOff] = useState('');
  const [skillsrequired, setSkillsReq] = useState('');
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

  const handleSignup = async () => {
    if(name === '' || username === '' || email === '' || password === ''){
      Alert.alert('Error', 'Fill all the required fields')
    } else{
      try {
        const { data: userdata, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              username: username,
            },
            emailRedirectTo: 'skillswap://Home',
          },
        });  
        if (signUpError) throw signUpError;  
        Alert.alert('Success', 'Account created! Please check your email for confirmation.');
        setUser(userdata?.user);
        try {
          const { data: insertData, error: insertError } = await supabase.from('profiles').upsert({
            authid: userdata?.user?.id,
            name: name,
            username: username,
            email: email,
            skillsOffered: skillsoffered,
            skillsRequired: skillsrequired,
          });
          if (insertError) throw insertError;
          console.log('User data saved:', insertData);
          navigation.navigate('Login');    
        } catch (insertError: any) {
          Alert.alert('Error', insertError.message);
        }
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } 
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

  console.log('Signup rendered');

  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <Text style={[styles.title, {color: textColor}]}>Sign Up</Text>
      <Image source={require('../logo.png')} style={styles.logo} />
      <View style = {styles.fields}>
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Full Name *"
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Username *"
        value={username}
        onChangeText={setUserName}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Skills Offered"
        value={skillsoffered}
        onChangeText={setSkillsOff}
      />
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Skills Required"
        value={skillsrequired}
        onChangeText={setSkillsReq}
      />
      </View>
      <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={handleSignup}>
        <Text style={[styles.buttonText, {color: buttonTextColor}]}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
    marginBottom: 10 
  },
  fields: {
    width: '100%',
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { 
    width: '80%', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 10 
  },
  button: { 
    width: '25%', 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
  },
  buttonText: { 
    fontWeight: 'bold' 
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 0,
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
export default SignupPage;
