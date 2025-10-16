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