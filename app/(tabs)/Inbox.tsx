import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, BackHandler, useColorScheme } from 'react-native';
import {format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserContext } from '@/components/UserContext';
import iconSet from '@expo/vector-icons/build/Fontisto';
import { FontAwesome } from '@expo/vector-icons';

export default function Inbox() {
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const { userData, usersData } = useUserContext();

  const getChatPartner = (item) => {
    return item.sender_Id === userData?.id ? item.receiver_Id : item.sender_Id;
  };
  
  const CACHE_KEY = `chat_inbox_${userData?.id}`;

  useEffect(() => {
    const loadCachedInbox = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setInboxItems(parsedData);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load cached inbox:', error);
        setLoading(false);
      }
    };
    loadCachedInbox();
  }, [userData?.id]);

  const upsertInboxItem = (newItem) => {
    setInboxItems((prev) => {
      const others = prev.filter(
        (item) =>
          !(
            (item?.sender_Id === newItem?.sender_Id && item?.receiver_Id === newItem?.receiver_Id) ||
            (item?.sender_Id === newItem?.receiver_Id && item?.receiver_Id === newItem?.sender_Id)
          )
      );
      const updated =  [newItem, ...others].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );
      
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const loadInbox = async () => {
  
      const { data, error } = await supabase
        .from('chat')
        .select('*')
        .or(`sender_Id.eq.${userData?.id},receiver_Id.eq.${userData?.id}`)
        .order('updated_at', { ascending: false });
  
      if (!error && data && data.length > 0) {
        setInboxItems(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } else {
        console.error('Failed to load inbox:', error);
      }
  
    setLoading(false);
  };

  useEffect(() => {
    if (!userData?.id) return;

    loadInbox();

    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat',
          filter: `sender_Id=eq.${userData?.id}`,
        },
        (payload) => {
          const updated = payload.new;
          upsertInboxItem(updated);
          //saveToLocal([updated, ...inboxItems]);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify([updated, ...inboxItems]));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat',
          filter: `receiver_Id=eq.${userData?.id}`,
        },
        (payload) => {
          const updated = payload.new;
          upsertInboxItem(updated);
          //saveToLocal([updated, ...inboxItems]);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify([updated, ...inboxItems]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  const renderItem = ({ item }) => {
    const partnerId = getChatPartner(item);
    //console.log('Partner Id:', partnerId);
    const partner = usersData?.find(user => user?.id === partnerId);
    //console.log('Partner:', partner);
    const lastSender = item.last_sender === userData?.id ? 'You: ' : '';
    return (
      <TouchableOpacity
        style={[styles.chatCard, { borderColor: textColor }]}
        onPress={() => navigation.navigate('ChatScreen', {
          chatId: item.id,
          receiverId: partner?.id
        })}
      >
        <Image source={partner?.avatar_url ? { uri: partner?.avatar_url } : require('../Avatar.png')} style={styles.avatar} />
        <View style={{ flex: 1 }}>  
          <Text style={[styles.name, { color: textColor }]}>{partner?.name || 'User'}</Text>
          <View style={styles.preview}>
          <View style={styles.textContainer}>
        <Text 
          style={[styles.textmsg, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lastSender} {item.last_text}
        </Text>
      </View>
            <Text style={[styles.timestamp, { color: textColor }]}>
              {format(parseISO(item.updated_at, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date()), 'dd-MM-yy - h:mm a')} {/* → "2:30 PM" */}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
      const backAction = () => {
        navigation.navigate('Home'); 
        return true; 
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
      return () => backHandler.remove(); 
    }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
        <TouchableOpacity style= { {margin: 10, marginRight: 20,} } onPress={() => navigation.navigate('Home')}>
          <FontAwesome name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, {color: textColor, backgroundColor: SecondaryBackgroundColor}]}>Inbox</Text>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            style={[styles.flatlist, {backgroundColor: backgroundColor}]}
            data={inboxItems}
            keyExtractor={item => item?.id}
            renderItem={renderItem}
            ListEmptyComponent={
            <Text style={[styles.noUser, {color: textColor}]}>No conversations yet.</Text>}
          />
        )}
      </View>
      <View style = {styles.navbar}>
        <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Home')}>
          <FontAwesome name="home" size={24} color={buttonTextColor} />
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style ={styles.navButton} onPress={() => navigation.navigate('Inbox')}>
          <FontAwesome name="comments" size={24} color={buttonTextColor} />
          <Text style={styles.buttonText}>Inbox</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Schedule')}>
          <Text style={styles.buttonText}>Schedule</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /*container: { 
    flex: 1, 
    padding: 20 
  },*/
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topbar: {
    //flex: 0.082,
    flexDirection: 'row',
    width: '100%',
    height: 100,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    //flexGrow: 0.1,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 90,
    
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  content:{
    flex: 0.94,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    flexGrow: 1,
  },
  chatCard: {
    flexDirection: 'row',
    width: '100%',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  flatlist: {
    width: '100%',  
    padding: 20,
  },
  name: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  preview: { 
    flexDirection: 'row',
    width: '100%',
    alignContent: 'space-between',
    fontSize: 14, 
    marginTop: 4 
  },
  textContainer: {
    flex: 1,  // Takes available space
    marginRight: 8,  // Spacing between text and timestamp
  },
  textmsg: {
    fontSize: 14, 
    alignSelf: 'flex-start',
    marginTop: 4 
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  noUser: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    padding: 30,
    borderRadius: 15,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    flex: 0.08,
    flexDirection: 'row',
    width: '100%',
    gap: 0,
    alignContent: 'center',
    justifyContent: 'space-around',
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
  navButton: {
    width: '50%',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
});