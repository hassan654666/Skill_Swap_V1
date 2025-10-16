import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme, BackHandler } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useUserContext } from '@/components/UserContext';
import { useNavigation, useRouter } from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

const SignupPage: React.FC = () => {
  const { session, clearUserData, DarkMode } = useUserContext();
  const [user, setUser] = useState<any>();
  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillsoffered, setSkillsOff] = useState('');
  const [skillsrequired, setSkillsReq] = useState('');
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
        } catch (insertError: any) {
          Alert.alert('Error', insertError.message);
        }
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          //Alert.alert('Success', 'You have logged in!');
          //fetchSessionAndUserData();
          // // const token = await registerForPushNotificationsAsync();
          // // if (token) {
          // //   await supabase
          // //     .from('profiles')
          // //     .upsert({ expo_token: token })
          // //     .eq('authid', userdata?.user?.id);
          // // }
          //navigation.navigate('Home');
        } catch (error: any) {
          Alert.alert('Error', error.message);
          clearUserData();
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
      <View style={styles.content}>
      <Text style={[styles.title, {color: textColor}]}>Sign Up</Text>
      <Image source={require('./logo.png')} style={styles.logo} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    //padding: 10, 
  },
  content: { 
    flex: 0.8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 40, 
    fontWeight: 'bold', 
    //marginBottom: 10 
  },
  fields: {
    width: '100%',
    //height: '35%',
    //marginVertical: 20,
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
    height: 40,
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
  },
  buttonText: { 
    fontWeight: 'bold' 
  },
  logo: {
    width: '75%',
    height: 'auto',
    aspectRatio: 1,
    marginBottom: 0,
  },
  linkText: {
    fontSize: 16,
    color: 'blue',
    textAlign: 'center',
    //marginTop: 20,
    marginVertical: 15,
    textDecorationLine: 'underline',
  },
});
export default SignupPage;
