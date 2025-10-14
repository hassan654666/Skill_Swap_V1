import React, { useEffect, useState, useCallback } from 'react'; 
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { BackHandler } from 'react-native';
import { color } from '@rneui/themed/dist/config';
import { Avatar } from '@rneui/themed';
import { FontAwesome } from '@expo/vector-icons';
//import DateTimePicker from '@react-native-community/datetimepicker'; // ✅ Added
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width, height } = Dimensions.get("window");

export default function Profile(){

    const { session, usersData, fetchSessionAndUserData, clearUserData, DarkMode } = useUserContext();

    const navigation = useNavigation<any>();
    const router = useRouter();
    const isFocused = useIsFocused();
    const colorScheme = useColorScheme();
    const textColor = DarkMode ? '#fff' : '#000';
    const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
    const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
    const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
    const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
    const buttonColor = DarkMode ? '#333' : '#007BFF';
    const buttonTextColor = DarkMode ? '#fff' : '#fff';
    
    const { userId } = useLocalSearchParams<{ userId?: string }>();

    const checkSession = async () => {
      if(isFocused){
        try {
          if (!session) {
            navigation.navigate('Login');
          }
        } catch (error) {
          console.error('Navigation Error:', error);
        }
      }
    };

    useFocusEffect(
      useCallback(() => {
        checkSession();
      }, [checkSession])
    )
    
    const userData = usersData?.find((users: any) =>
      users?.id === userId
    );

    function MessageUser() {
      router.push({
        pathname: '/Chat',
        params: {
          receiverId: userId
        }
      });
    }

    const backAction = () => {
      if(router.canGoBack()){
        router.back();
      } else {
        router.replace('/(tabs)/Home');
      }
      return true; 
    };

    useFocusEffect(
      useCallback(() => {    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
      }, [])
    );

    // -----------------------------------------------------------
    // 🧩 MEETING REQUEST LOGIC ADDED BELOW
    // -----------------------------------------------------------

    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [message, setMessage] = useState('');
    const showDatePicker = () => setShowPicker(true);
    const hideDatePicker = () => setShowPicker(false);

    const handleDateChange = (date?: Date) => {
      hideDatePicker();
      if (date) {
        setSelectedDate(date);
      }
    };

    async function requestMeeting() {
      if (!selectedDate) {
        Alert.alert('Select a Date & Time', 'Please choose a date and time first.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('meeting_requests')
          .insert([
            {
              requester_id: userData?.id,
              receiver_id: userId,
              proposed_datetime: selectedDate.toISOString(),
              status: 'pending',
              message: message || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        Alert.alert('Success', 'Meeting request sent successfully!');
        setSelectedDate(null);
        setMessage('');
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', err.message || 'Failed to send meeting request');
      }
    }

    // -----------------------------------------------------------
    // 🧩 END MEETING REQUEST LOGIC
    // -----------------------------------------------------------

    return(
      <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
        <View style= {[styles.topbar, {backgroundColor: backgroundColor}]}>
          <TouchableOpacity style= { {margin: 10, marginLeft: 15} } onPress={backAction}>
            <FontAwesome name="arrow-left" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
        <View style = {styles.content}>
          <Image source= {userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png')} style= {[styles.avatar, {marginTop: 10,}]}></Image>
          <View style = {styles.userInfo}>
            <Text style= {[styles.title, {color: textColor}]}>Name: {userData?.name}</Text>
            <Text style= {[styles.title, {color: textColor}]}>Username: @{userData?.username}</Text>
            <Text style= {[styles.title, {color: textColor}]}>Description: {userData?.description}</Text>
            <Text style= {[styles.title, {color: textColor}]}>Skills Offered: {userData?.skillsOffered}</Text>
            <Text style= {[styles.title, {color: textColor}]}>Skills Required: {userData?.skillsRequired}</Text>
          </View>

          {/* Existing Buttons */}
          <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={MessageUser}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Message</Text>
          </TouchableOpacity>

          {/* -----------------------------------------------------------
               🧭 Meeting Request UI
          ----------------------------------------------------------- */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={[styles.title, {color: textColor}]}>Schedule a Skill Swap Meeting</Text>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: buttonColor, width: '60%'}]}
              onPress={showDatePicker}
            >
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>
                {selectedDate
                  ? selectedDate.toLocaleString()
                  : 'Select Date & Time'}
              </Text>
            </TouchableOpacity>

            {/* {showPicker && ( */}
              <DateTimePickerModal
                isVisible={showPicker}
                mode="datetime"
                display='spinner'
                onConfirm={handleDateChange}
                onCancel={hideDatePicker}
                minimumDate={new Date()}
              />
            {/* )} */}

            {/* {selectedDate && (
              <Text style={[styles.title, { color: textColor }]}>
                Selected: {selectedDate.toLocaleString()}
              </Text>
            )} */}

            {/* <TextInput
              placeholder="Add a message (optional)"
              placeholderTextColor={DarkMode ? '#ccc' : '#555'}
              style={{
                width: '80%',
                backgroundColor: inputColor,
                color: textColor,
                marginTop: 10,
                borderRadius: 8,
                padding: 10,
              }}
              value={message}
              onChangeText={setMessage}
            /> */}

            <TouchableOpacity
              style={[styles.button, {backgroundColor: buttonColor, width: '60%'}]}
              onPress={requestMeeting}
            >
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        alignContent: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
     topbar: {
      position: 'absolute',
      top: 0,
      flexDirection: 'row',
      width: '100%',
      height: 60,
      alignItems: 'center',
      verticalAlign: 'top',
    },
    userhead: {
      flexDirection: 'row',
      width: '80%',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
     username: { 
      width: '75%', 
      fontSize: 16, 
      fontWeight: 'bold',
      textAlign: 'left',
      justifyContent: 'flex-start',
    },
    content:{
        flex: 0.9,
        width: '100%',
        paddingTop: 20,
        paddingBottom: 20,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
    },
    userInfo:{
        marginLeft: 10,
        marginRight: 10,
        paddingLeft: 10,
        paddingRight: 10,
        justifyContent: 'center',
        alignContent: 'center',
        textAlign: 'left',
        padding: 5,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
        padding: 5,
    },
    button: {
      width: '25%',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
      margin: 10,
    },
    buttonText: {
      fontWeight: 'bold',
    },
    avatar: {
      width: 300,
      height: 300,
      marginBottom: 20,
    },
});
