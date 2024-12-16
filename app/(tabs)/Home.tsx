//import { Text, View } from '@/components/Themed';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import { Picker } from '@react-native-picker/picker';
//import CheckBox from 'expo-checkbox';
import { useFocusEffect } from '@react-navigation/native';

export default function Home() {

  const [data] = useState([
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Cherry' },
    { id: '4', name: 'Date' },
    { id: '5', name: 'Elderberry' },
    { id: '6', name: 'apple' },
  ]);

  const [searchText, setSearchText] = useState('');

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
            data={searchData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
            <Text style={styles.linkText}>{item.name}</Text>
            )}
            ListEmptyComponent={
            <Text style={styles.linkText}>No items found</Text>
            }
          />
        </View>
          <View style = {styles.navbar}>
            <TouchableOpacity style ={styles.button}>
              <Text style={styles.buttonText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style ={styles.button}>
              <Text style={styles.buttonText}>Skill Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity style ={styles.button}>
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
      flex: 0.90,
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
      flex: 0.03,
      width: '80%',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 15,
      marginTop: 20,
      backgroundColor: '#fff',
    },
    navbar: {
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
    linkText: {
      color: '#007BFF',
      textAlign: 'center',
      marginTop: 20,
      marginVertical: 10,
      textDecorationLine: 'underline',
    },
  });