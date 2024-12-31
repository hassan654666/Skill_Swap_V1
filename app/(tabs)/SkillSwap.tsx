import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useIsFocused } from '@react-navigation/native';

export default function SkillSwap() {
    const [userdata, setUserData] = useState<any>();
    const [thisuser, setThisUser] = useState<any>();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const checkSession = async () => {
      const {data: {session}} = await supabase.auth.getSession();
      console.log('session at SkillSwap: ')
      console.log(session)
      if(!session){
        navigation.navigate('LoginPage', {screen: 'Login'});
        return;
      }
      const { data: {user}} = await supabase.auth.getUser();
      if(user){
        setThisUser(user);
        fetchUserProfile(user.id);
      }
    };

    const fetchUserProfile = async (userId: any) => {
      try {
        if (userId) {
            
        const { data, error } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, skillsOffered, skillsRequired, avatar_url, description')
          .eq('authid', userId)
          .single();
    
        if (error) throw error;
        setUserData(data);
        return data;
      } else {
          console.log('No user session found');
      }
      } catch (error: any) {
        console.error('Error fetching profile:', error.message);
        return null;
      }
    };
    
    useEffect(() => {  
      if(isFocused){  
        checkSession();
      }
    }, [isFocused]);

    return (
      <View style= {styles.container}>
        <Text style= {styles.title}>Skill Swap</Text>
        <View style = {styles.navbar}>
          <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('SkillSwap')}>
            <Text style={styles.buttonText}>Skill Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.buttonText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      //padding: 16,
      backgroundColor: '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    navbar: {
      position: 'absolute', // Make the navbar absolute
      bottom: 0, // Stick it to the bottom
      flex: 0.08,
      flexDirection: 'row',
      width: '100%',
      //alignItems: 'center',
      gap: 10,
      backgroundColor: 'black',
      // padding: 15,
      // marginBottom: 10,
      // marginTop: 10,
    },
    button: {
      width: '32%',
      padding: 20,
      borderRadius: 8,
      alignItems: 'center',
      //backgroundColor: '#007BFF',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
  })