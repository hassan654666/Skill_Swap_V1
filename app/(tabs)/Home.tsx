import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
//import { Picker } from '@react-native-picker/picker';
//import CheckBox from 'expo-checkbox';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

export default function Home() {

  const [data] = useState([
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Cherry' },
    { id: '4', name: 'Date' },
    { id: '5', name: 'Elderberry' },
    { id: '6', name: 'apple' },
    { id: '7', name: 'Apple' },
    { id: '8', name: 'Banana' },
    { id: '9', name: 'Cherry' },
    { id: '10', name: 'Date' },
    { id: '11', name: 'Elderberry' },
    { id: '12', name: 'apple' },
    { id: '13', name: 'Apple' },
    { id: '14', name: 'Banana' },
    { id: '15', name: 'Cherry' },
    { id: '16', name: 'Date' },
    { id: '17', name: 'Elderberry' },
    { id: '18', name: 'apple' },
    { id: '19', name: 'Cherry' },
    { id: '20', name: 'Date' },
    { id: '21', name: 'Elderberry' },
    { id: '22', name: 'apple' },
    { id: '23', name: 'Apple' },
    { id: '24', name: 'Banana' },
    { id: '25', name: 'Cherry' },
    { id: '26', name: 'Date' },
    { id: '27', name: 'Elderberry' },
    { id: '28', name: 'apple' },
  ]);

  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Alert.alert('Success', 'You have been logged out.');
        navigation.navigate('LoginPage');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      navigation.navigate(session ? 'Home' : 'LoginPage');
      console.log('session at home: ')
      console.log(session)
    };

    checkSession();
  }, [searchText]);

  const searchData = data.filter(data =>
    data.name.toLowerCase().includes(searchText.toLowerCase())
  );

    return (
      <View style={styles.container}>
        <TextInput
        style={styles.input}
        placeholder='Search'
        value = {searchText}
        onChangeText={setSearchText}
        />
        <View style={styles.content}>
          <FlatList
            style={{width: 445, backgroundColor: 'lightgrey'}}
            data={searchData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
            <Text style={styles.linkText}>{item.name}</Text>
            )}
            ListEmptyComponent={
            <Text style={styles.linkText}>No items found</Text>
            }
            //horizontal= {false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
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
    content:{
      flex: 0.85,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: 300,
      height: 300,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    input: {
      //flex: 0.01,
      // position: 'absolute', // Make the navbar absolute
      // //bottom: 0, // Stick it to the bottom
      // top: 20,
      width: '80%',
      height: 40,
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 15,
      //marginTop: 20,
      marginBottom: 20,
      backgroundColor: '#fff',
    },
    navbar: {
      position: 'absolute',
      bottom: 0,
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
      backgroundColor: '#007BFF',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
    linkText: {
      width: '40%',
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
    columnWrapper: {
      justifyContent: 'space-around', // Add spacing between columns
    },
  });