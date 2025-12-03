import { Text, View, Image, StyleSheet, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { supabase } from '@/lib/supabase';
import { useIsFocused } from '@react-navigation/native';

export default function Banned() {

    const { session, userData, DarkMode, clearUserData } = useUserContext();
    const [sessionChecked, setSessionChecked] = useState(false);
    const navigation = useNavigation<any>();
    const router = useRouter();
    const isFocused = useIsFocused();
    const colorScheme = useColorScheme();
    // const DarkMode = colorScheme === 'dark';
    const textColor = DarkMode ? "#fff" : "#000";
    const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
    const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
    const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
    const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
    const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
    const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
    const buttonTextColor = "#fff";

    const checkSession = async () => {
      if(isFocused){
        try {
          if (!session) {
            router.replace('/Login');
            //navigation.navigate('Login');
          } else if(session && !userData.banned){
            router.replace('/(tabs)/Home');
          //   return;
          } else {
            return;
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

    const handleLogout = async () => {
      try {
        clearUserData();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    };

    return (
      <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
        <Image source={require('./logo.png')} style={styles.logo} />
        <Text style= {[styles.title, {color: textColor}]}>You have been banned from the app</Text>
        {/* <View style = {styles.navbar}>
          <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('SkillSwap')}>
            <Text style={styles.buttonText}>Skill Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.buttonText}>Schedule</Text>
          </TouchableOpacity>
        </View> */}
        <TouchableOpacity style={[styles.button, {backgroundColor: redButton,}]} onPress={handleLogout}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: buttonTextColor }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: 500,
      height: 500,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    navbar: {
      position: 'absolute', 
      bottom: 0, 
      flex: 0.08,
      flexDirection: 'row',
      width: '100%',
      gap: 10,
      backgroundColor: 'black',
    },
    button: {
      width: '30%',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
  })