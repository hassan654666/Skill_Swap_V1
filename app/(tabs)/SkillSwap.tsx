import { Text, View, Image, StyleSheet, TouchableOpacity, useColorScheme, BackHandler } from 'react-native';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { supabase } from '@/lib/supabase';
import { useIsFocused } from '@react-navigation/native';

export default function SkillSwap() {
    const { DarkMode } = useUserContext();
    const [sessionChecked, setSessionChecked] = useState(false);
    const navigation = useNavigation<any>();
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
      
    console.log('Skill Swap rendered');

    const backAction = () => {
      navigation.navigate('Home'); 
      return true; 
    };
  
    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove(); 
    }, [navigation]);

    return (
      <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
        <Image source={require('../logo.png')} style={styles.logo} />
        <Text style= {styles.title}>Skill Swap</Text>
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
      width: '32%',
      padding: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
  })