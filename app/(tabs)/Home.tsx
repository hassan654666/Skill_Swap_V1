import React, { useEffect, useState } from 'react';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
//import { Picker } from '@react-native-picker/picker';
//import CheckBox from 'expo-checkbox';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Avatar, Icon } from '@rneui/themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function Home() {

  const [usersData, setUsersData] = useState<any>([]);
  const [loggedUser, setLoggedUser] = useState<any>();
  const [userdata, setUserData] = useState<any>();
  const [searchText, setSearchText] = useState<string>('');
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  //var session;

  

    const checkSession = async () => {
      const {data: {session}} = await supabase.auth.getSession();
      console.log('session at Home: ')
      console.log(session)
      if(!session){
        navigation.navigate('LoginPage', {screen: 'Login'});
        return;
      }
      const { data: {user}} = await supabase.auth.getUser();
      if(user){
        setLoggedUser(user);
        fetchUserProfile(user.id);
            
        const {data, error} = await supabase
        .from('profiles')
        .select('id, name, email, skillsOffered, avatar_url')
        .neq('authid', user.id);

        if (error) {
          console.error('Error fetching users:', error.message);
        } else {
          setUsersData(data);
        }
      }
    };

      const fetchUserProfile = async (userId: any) => {
        try {
          if (userId) {
              
          const { data, error } = await supabase
            .from('profiles')
            .select('id, authid, name, username, email, skillsOffered, skillsRequired, avatar_url')
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
        //fetchUserProfile(loggedUser?.id);
      }
  }, [isFocused]);

 //const usersDataname = usersData?.name;

  const searchData = usersData.filter((users: any) =>
    users.name.toLowerCase().includes(searchText.toLowerCase()) || users.skillsOffered.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.usersItem}
      onPress={() =>
        navigation.navigate('Skill Swap', { userId: item.id, name: item.name })
      }
    >
      <View style= {styles.users}>
        <Image source= {item.avatar_url? { uri: item.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
        <View>
          <Text style={styles.usersName}>{item.name}</Text>
          <Text style={styles.usersEmail}>{item.email}</Text>
          <Text style={styles.usersSkills}>Skills Offered: {item.skillsOffered}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

    return (
      <View style={styles.container}>
        <View style= {styles.topbar}>
          <Image source= {require('../logo.png')} style= {[styles.logo, {marginTop: 10,}]}></Image>
          <TouchableOpacity style= { [styles.avatar, {margin: 25, marginTop: 25,}] } onPress={() => navigation.navigate('Profile')}>
            <Image source= {userdata?.avatar_url? { uri: userdata?.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
            <Text style= {styles.username}>{userdata?.name}</Text>
          </TouchableOpacity>
        </View>
        <View style= {styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder='Search...'
          value = {searchText}
          onChangeText={setSearchText}
        />
        </View>
        <View style={styles.content}>
          <FlatList
            style={{width: 445, backgroundColor: 'lightgrey', padding: 20,}}
            data={searchData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
            <Text style={styles.noUser}>No users found</Text>
            }
            //horizontal= {false}
            // numColumns={2}
            // columnWrapperStyle={styles.columnWrapper}
          />
        </View>
          {/* <View style = {styles.navbar}>
            <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.buttonText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Skill Swap')}>
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
      //padding: 16,
      backgroundColor: '#f5f5f5',
    },
    content:{
      flex: 0.91,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topbar: {
      flex: 0.06,
      //position: 'absolute',
      //top: 0,
      //height: 25,
      flexDirection: 'row',
      width: '100%',
      padding: 20,
      alignItems: 'center',
      justifyContent: 'space-between',
      //marginBottom: 20,
      backgroundColor: 'darkgrey',
    },
    inputArea: {
      flex: 0.03,
      height: 40,
      width: '100%',
      backgroundColor: 'darkgray',
      //margin: 10,
      justifyContent: 'center',
      //alignContent: 'center',
      alignItems: 'center',
      verticalAlign: 'top',
      padding: 20,
      //marginBottom: 20,
    },
    input: {
      width: '80%',
      height: 40,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 15,
      backgroundColor: '#fff',
      padding: 10,
    },
    logo: {
      width: 120,
      height: 120,
      //aspectRatio: 1,
      borderRadius: 90,
      //padding: 10,
      //margin: 10,
      
    },
    avatar: {
      width: 50,
      height: 50,
      //aspectRatio: 1,
      borderRadius: 90,
      //padding: 10,
      //margin: 10,
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      
    },
    username: {
      color: 'black', 
      width: 100, 
      fontSize: 11, 
      fontWeight: 'bold',
      textAlign: 'center',
      justifyContent: 'center',
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
      alignItems: 'stretch',
      alignContent: 'center',
      justifyContent: 'space-evenly',
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
      backgroundColor: 'black',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
    linkText: {
      //width: '100%',
      color: '#007BFF',
      textAlign: 'center',
      marginTop: 20,
      marginVertical: 10,
      textDecorationLine: 'underline',
      //margin: 10,
      padding: 30,
      borderRadius: 15,
      backgroundColor: '#f5f5f5',
    },
    users: {
      flexDirection: 'row', 
      gap: 25, 
      //justifyContent: 'space-evenly', 
      alignContent: 'center',
    },
    usersItem: {
      padding: 15,
      margin: 10,
      marginBottom: 10,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      justifyContent: 'center',
      resizeMode: 'contain',
    },
    usersName: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    usersEmail: {
      fontSize: 14,
      color: '#666',
    },
    usersSkills: {
      width: '75%',
      padding: 10,
      fontSize: 16,
      color: 'black',
    },
    noUser: {
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center',
      margin: 20,
      padding: 30,
      borderRadius: 15,
      color: 'darkgray',
      backgroundColor: '#f5f5f5',
    },
    columnWrapper: {
      justifyContent: 'space-around', // Add spacing between columns
    },
  });