import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, BackHandler, useColorScheme, TextInput, Keyboard, Dimensions } from 'react-native';
import {format, parseISO, set } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserContext } from '@/components/UserContext';
//import { useMessageNotification } from '@/hooks/useMessageNotification';
import iconSet from '@expo/vector-icons/build/Fontisto';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

export default function Inbox() {

  const { userData, usersData, unreadCount, setUnreadCount, DarkMode } = useUserContext();

  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [unread, setUnread] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  const navigation = useNavigation<any>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  // const DarkMode = colorScheme === 'dark';
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

  const CACHE_KEY = `chat_inbox_${userData.id}`;

  const getChatPartner = (item: any) => {
    return item.sender_Id === userData?.id ? item.receiver_Id : item.sender_Id;
  };

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

  // 🔹 Fetch unread counts for all chats in ONE query
  const fetchUnreadCounts = useCallback(async () => {
    if (!userData?.id) return;
    const { data, error } = await supabase
      .from("Messages")
      .select("chat_Id")
      .eq("receiver_id", userData.id)
      .eq("read", false);

    if (error) {
      console.error("Unread count error:", error);
      return;
    }

    // Group counts by chat_Id
    const counts: { [chatId: string]: number } = {};
    data.forEach((msg: any) => {
      counts[msg.chat_Id] = (counts[msg.chat_Id] ?? 0) + 1;
    });

    setUnread(counts);
    setUnreadCount(Object.values(counts).reduce((a, b) => a + b, 0));
  }, [userData?.id]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);


  useEffect(() => {
    if (!userData?.id) return;

    loadInbox();

    const chatChannel = supabase
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
          if(!payload.new) return;
          const updated : any = payload.new;
          loadInbox();
          console.log('Chat payload (sender):', updated.sender_Id);
        }
      ).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat',
          filter: `receiver_Id=eq.${userData?.id}`,
        },
        (payload) => {
          if(!payload.new) return;
          const updated : any = payload.new;
          loadInbox();
          console.log('Chat payload (sender):', updated.sender_Id);
        }
      )
      
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [userData?.id]);

  useEffect(() => {
    if (!userData?.id) return;

    const unreadChannel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*", // insert/update/delete
          schema: "public",
          table: "Messages",
          filter: `receiver_id=eq.${userData.id}`,
        },
        () => {
          // Re-fetch all counts whenever something changes
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unreadChannel);
    };
  }, [userData?.id, fetchUnreadCounts]);

  const toggleSearch = () => {
    if (showSearch) {
      Keyboard.dismiss();
      setSearchText('');
    }
    setShowSearch(!showSearch);
  };

  const searchData = (inboxItems || []).filter((chat: any) =>{
    if (!searchText) return true;
    const partnerId = getChatPartner(chat);
    const partner = usersData?.find(user => user?.id === partnerId);
    return (
      partner?.name?.toLowerCase().includes(searchText?.toLowerCase())
    );
  });

  const renderItem = ({ item } : any) => {
    const partnerId = getChatPartner(item);
    //console.log('Partner Id:', partnerId);
    const partner = usersData?.find(user => user?.id === partnerId);
    //console.log('Partner:', partner);
    const lastSender = item.last_sender === userData?.id ? 'You: ' : '';

    return (
      <TouchableOpacity
        style={[styles.chatCard, { borderColor: textColor }]}
        // onPress={() => navigation.navigate('Chat', {
        //   chatId: item.id,
        //   receiverId: partner?.id
        // })}
        onPress={() => router.push( {
          pathname: "/Chat",
          params: {
            chatId: item.id,
            receiverId: partner.id,
          },
        })}
      >
        <Image source={partner?.avatar_url ? { uri: partner?.avatar_url } : require('../../assets/images/Avatar.png')} style={styles.avatar} />
        <View style={{ flex: 1 }}>  
          <Text style={[styles.name, { color: textColor }]}>{partner?.name || 'User'}</Text>
          {unread[item.id] > 0 && ( <Text style={styles.unread}>{unread[item.id]}</Text> )}
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
              {/* {format(parseISO(item.updated_at, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date()), 'dd-MM-yy - h:mm a')} */}
              {format(parseISO(item.updated_at), 'dd-MM-yy - h:mm a')}

            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // useEffect(() => {
  //     const backAction = () => {
  //       //router.back();
  //       router.replace('/(tabs)/Home');
  //       //router.push('/Home');
  //       //navigation.navigate('Home'); 
  //       return true; 
  //     };
  
  //     const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
  //     return () => backHandler.remove(); 
  //   // }, [navigation]);
  // }, [router]);

   useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        //router.back();
        //router.replace('/(tabs)/Home');
        //router.push('/Home');
        navigation.navigate('Home'); 
        return true; 
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
        <TouchableOpacity style= { {margin: 10, marginLeft: 15,} }>
          {/* <FontAwesome name="arrow-left" size={20} color={textColor} /> */}
          <Text style={{fontSize: 20}}>     </Text>
        </TouchableOpacity>
        {!showSearch && (<Text style={[styles.title, {color: textColor, backgroundColor: SecondaryBackgroundColor}]}>Inbox</Text>)}
        {showSearch && (
          <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder='Search...'
            value = {searchText}
            onChangeText={setSearchText}
          />
        )}

        {/* Right Section */}
        <TouchableOpacity style={{ margin: 10, marginLeft: 10, paddingHorizontal: 10 }} onPress={toggleSearch}>
          <FontAwesome name={showSearch ? 'close' : 'search'} size={20} color={textColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            style={[styles.flatlist, {backgroundColor: backgroundColor}]}
            data={searchData}
            keyExtractor={item => item?.id}
            renderItem={renderItem}
            ListEmptyComponent={
            <Text style={[styles.noUser, {color: textColor}]}>No conversations yet.</Text>}
          />
        )}
      </View>
      {/* <View style = {styles.navbar}>
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
        </TouchableOpacity> }
      </View> */}
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
    //flex: 0.08,
    // position: 'absolute',
    // top: 0,
    flexDirection: 'row',
    width: '100%',
    height: height * 0.06,
    //height: 60,
    //marginBottom: '10%',
    //height: '6.6%',
    //padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between', 
    // justifyContent: 'flex-end',
    verticalAlign: 'top',
    //gap: width * 0.34
    //flexGrow: 1,
    //flexShrink: 0,
  },
  input: {
    width: '50%',
    height: height * 0.04,
    //height: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    //padding: 10,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 90,
    
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content:{
    flex: 0.94,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    //padding: 10,
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
    padding: 10,
  },
  name: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  unread: { 
    width: 20, 
    height: 20, 
    textAlign: 'center', 
    textAlignVertical: 'center',
    borderRadius: 10,
    fontSize: 12, 
    fontWeight: '400', 
    color: 'white', 
    position: 'absolute', 
    right: 0, 
    top: 0,
    backgroundColor: 'red'
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