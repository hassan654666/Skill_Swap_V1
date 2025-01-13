import { useState, useEffect } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';

export default function ResetPassword() {
  const [email, setEmail] = useState<any>();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const { session, thisUser, userData } = useUserContext();
    
  useEffect(() => {
    try {
      if (!session) {
        navigation.navigate('LoginPage', { screen: 'Login' });
      }
    } catch (error) {
      console.error('Navigation Error:', error);
    }
    setEmail(thisUser?.email);
  }, [session]);
  

  useEffect(() => {
      const backAction = () => {
        navigation.navigate('Edit Profile');
        return true;
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
      return () => backHandler.remove();
    }, [navigation]);

  const changePassword = async () => {
    if(newPassword != ''){
      if(newPassword === confirmPassword){
        try {
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) throw updateError;
          Alert.alert('Success', 'Password has been reset!');
          try {
            setPassword(newPassword);
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
            navigation.navigate('Home', {screen: 'Home'});
          } catch (signInError: any) {
            Alert.alert('Error', signInError.message);
          }
        } catch (updateError: any) {
          Alert.alert('Error', updateError.message);
        } finally {
          
        }
      } else{
        Alert.alert('Error', 'Password was not confirmed!');
      }
    } else {
      Alert.alert('Error', 'No password entered!');
    }
  };

  console.log('Reset Password rendered');

  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <Text style={[styles.title, {color: textColor}]}>Reset Password</Text>
      <Image source={userData?.avatar_url? {uri: userData?.avatar_url } : require('../Avatar.png')} style={styles.logo} />
      <View style = {styles.content}>
        <Text style= {styles.name}>{userData?.name}</Text>
        <Text style= {styles.userName}>@{userData?.username}</Text>
      </View>
      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Enter new Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={changePassword}>
        <Text style={[styles.buttonText, {color: buttonTextColor}]}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={() => navigation.navigate('Edit Profile')}>
        <Text style={[styles.buttonText, {color: buttonTextColor}]}>Cancel</Text>
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
  logo: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  content:{
    flex: 0.3,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    width: '25%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
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
