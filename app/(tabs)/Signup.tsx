import React, { useState, useEffect } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
        setUser(userdata.user);
        try {
          const { data: insertData, error: insertError } = await supabase.from('profiles').upsert({
            authid: userdata.user?.id,
            name: name,
            username: username,
            email: email,
            skillsOffered: skillsoffered,
            skillsRequired: skillsrequired,
          });
          if (insertError) throw insertError;
          console.log('User data saved:', insertData);
          navigation.navigate('Home', {screen: 'Home'})      
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
      navigation.navigate('Login'); // Navigate to a specific screen
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <Image source={require('../logo.png')} style={styles.logo} />
      <View style = {styles.fields}>
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Username *"
        value={username}
        onChangeText={setUserName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Skills Offered"
        value={skillsoffered}
        onChangeText={setSkillsOff}
        //secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Skills Required"
        value={skillsrequired}
        onChangeText={setSkillsReq}
        //secureTextEntry
      />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('LoginPage', {screen: 'Login'})}>
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
    backgroundColor: '#FFFFFF' 
  },
  title: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  fields: {
    //flex: 0.8,
    width: '100%',
    //padding: 10,
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
    backgroundColor: '#007BFF',
    marginTop: 10, 
  },
  buttonText: { 
    color: '#fff', 
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
