import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, useColorScheme, TouchableOpacity, Image, BackHandler, ActivityIndicator } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { useUserContext } from '@/components/UserContext';
//import { useMessageNotification } from '@/hooks/useMessageNotification';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

export default function ChatScreen() {
  const [inboxItems, setInboxItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';
  const bubbleOneColor = DarkMode ? '#183B4E' : '#3D90D7';
  const bubbleTwoColor = DarkMode ? '#015551' : '#1DCD9F';
  const flatListRef = useRef();

  const { usersData, userData } = useUserContext();
  const senderId = userData?.id;
  //const { receiverId } = useLocalSearchParams<{ receiverId: string }>();
  const route = useRoute();
  const { receiverId, chatId } = route.params;
  let chat_Id;
  const CACHE_KEY = `chat_messages_${userData?.id},${receiverId}`;
  
  useEffect(() => {
    const loadMessagesFromCache = async () => {
      try {
        const cachedMessages = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedMessages) {
          setMessages(JSON.parse(cachedMessages));
          setLoading(false);
        } else {
          setLoading(true);
        }
      } catch (error) {
        console.error('Failed to load messages from cache', error);
        setLoading(true);
      }
    };
    loadMessagesFromCache();
  }, [CACHE_KEY]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('Messages')
      .select('*')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      setMessages(data || []);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data || []));
    } else {
      console.error('Failed to fetch messages:', error);
    }
    setLoading(false);
  };
  

  const fetchChat = async () => {
    const { data, error } = await supabase
      .from('chat')
      .select('*')
      .or(
        `and(sender_Id.eq.${senderId},receiver_Id.eq.${receiverId}),and(sender_Id.eq.${receiverId},receiver_Id.eq.${senderId})`
      )
      .order('updated_at', { ascending: true });
  
    if (error) console.error('fetchChat error:', error.message);
    setInboxItems(data || []);
  };
  

  const Receiver = usersData.filter((users: any) =>
    users?.id?.includes(receiverId)
  );


  const sendMessage = async () => {
    chat_Id = chatId;
    if (!chat_Id && inboxItems.length > 0) {
      chat_Id = inboxItems[0]?.id;
    }
  
    if (!chatId && inboxItems.length === 0) {
      const { data: newChat, error: chatInsertError } = await supabase
        .from('chat')
        .insert([{ sender_Id: senderId, receiver_Id: receiverId, last_text: content, last_sender: senderId, updated_at: new Date() }])
        .select()
        .single();
  
      if (chatInsertError) {
        console.error('Failed to create chat:', chatInsertError.message);
        return;
      }
  
      chat_Id = newChat?.id;
    } else {
      const { error: chatUpdateError } = await supabase
        .from('chat')
        .upsert([{ id: chat_Id, last_text: content, last_sender: senderId, updated_at: new Date() }]);
      
      if (chatUpdateError) {
        console.error('Failed to update chat:', chatUpdateError.message);
        return;
      }
    }
    const { error: messageInsertError } = await supabase
      .from('Messages')
      .insert([{ chat_Id: chat_Id, sender_id: senderId, receiver_id: receiverId, text: content }]);
  
    if (messageInsertError) {
      console.error('Failed to insert message:', messageInsertError.message);
      return;
    }

    setContent('');
  };
  

  useEffect(() => {
    fetchMessages();
    fetchChat();
  }, []);

  useEffect(() => {
    if (!senderId || !receiverId) return;
  
    const channel = supabase.channel('MessageChannel');
  
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Messages',
        filter: `sender_id=eq.${senderId}`,
      },
      (payload) => {
        console.log('New message sender ➜ receiver:', payload.new);
        //setMessages((prev) => [...prev, payload.new]);
        fetchMessages();
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Messages',
        filter: `sender_id=eq.${receiverId}`,
      },
      (payload) => {
        console.log('New message receiver ➜ sender:', payload.new);
        //setMessages((prev) => [...prev, payload.new]);
        fetchMessages();
      }
    );

    channel.subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [senderId, receiverId]);

  //useMessageNotification();

  useEffect(() => {
      const backAction = () => {
        navigation.navigate('Inbox'); 
        return true; 
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
      return () => backHandler.remove(); // Cleanup
    }, [navigation]);

  return (
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
        <TouchableOpacity style= { {margin: 10,} } onPress={() => navigation.navigate('Inbox')}>
          <FontAwesome name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <View style= {styles.userhead}>
          <View style= { [styles.avatar, {margin: 25, marginTop: 25,}] }>
            <Image source= {Receiver[0]?.avatar_url ? { uri: Receiver[0]?.avatar_url } : require('../Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
          </View>
          <View>
            <Text style= {[styles.username, {color: textColor}]}>{Receiver[0]?.name ? Receiver[0]?.name : 'Guest'}</Text>
          </View>
        </View>
      </View>
      <View style= {[styles.content, {backgroundColor: backgroundColor}]}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
      <FlatList
        style={[styles.flatlist, {backgroundColor: backgroundColor}]}
        contentContainerStyle={{ paddingBottom: 40 }}
        ref={flatListRef}
        inverted={true}
        data={messages}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => (
          <View style={[item?.sender_id === senderId ? [styles.userBubble, {backgroundColor: bubbleOneColor}] : [styles.receiverBubble, {backgroundColor: bubbleTwoColor}]]}>
            {/* <Image source={item.sender_id === senderId ? (userData ? { uri: userData?.avatar_url } : require('../Avatar.png')) : (Receiver.length > 0 ? { uri: Receiver[0]?.avatar_url } : require('../Avatar.png'))} style={styles.senderAvatar} resizeMode='cover'></Image> */}
            <View style={ styles.msg}>
              <Text style={[styles.textmsg, { color: textColor }]}>
                {item?.text}
              </Text>
              <Text style={[styles.timestamp, { color: textColor }]}>
                {format(parseISO(item?.created_at, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date()), 'dd-MM-yy - h:mm a')} {/* → "2:30 PM" */}
              </Text>
            </View>
          </View>
        )}
        initialNumToRender={15}
        maxToRenderPerBatch={5}
        windowSize={21}
        removeClippedSubviews
        onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
        ListEmptyComponent={
          <Text style={[styles.noUser, {color: textColor}]}>No messages yet</Text>
        }
      />
      )}
      </View>
      <View style = {styles.inputArea}>
        <TextInput 
          value={content} 
          onChangeText={setContent} 
          placeholder="Type a message" 
          style={[styles.input, {backgroundColor: inputColor}]} 
          multiline={true}
          numberOfLines={10}
        />
        <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={sendMessage}>
          <FontAwesome name="send" size={24} color={buttonTextColor} />
          {/* <Text style={{ color: buttonTextColor }}>Send</Text> */}
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
  },
  content:{
    flex: 0.6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  topbar: {
    //flex: 0.1,
    flexDirection: 'row',
    width: '100%',
    height: 100,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start', 
    //flexGrow: 0.12,
  },
  inputArea: {
    flex: 0.1,
    flexDirection: 'row',
    height: 40,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    verticalAlign: 'top',
    padding: 20,
    flexGrow: 0.15,
  },
  input: {
    maxWidth: '70%',
    minWidth: '50%',
    width: 'auto',
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 30,
    padding: 10,
    textAlignVertical: 'center',
    flexGrow: 1,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 90,
    
  },
  userhead: {
    //flex: 1,
    flexDirection: 'row',
    width: '80%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    
  },
  username: { 
    width: '75%', 
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'left',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  linkText: {
    color: '#007BFF',
    textAlign: 'center',
    marginTop: 20,
    marginVertical: 10,
    textDecorationLine: 'underline',
    padding: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  flatlist: {
    flex: 0.6,
    width: '100%',  
    padding: 20,
  },
  userBubble: {
    //flex: 1,
    flexDirection: 'row-reverse',
    padding: 5,
    margin: 5,
    borderRadius: 20,
    maxWidth: '70%',
    alignSelf: 'flex-end',
    alignItems: 'center',
    
  },
  receiverBubble: {
    //flex: 1,
    flexDirection: 'row',
    padding: 5,
    margin: 5,
    borderRadius: 20,
    maxWidth: '70%',
    alignSelf: 'flex-start',
    alignItems: 'center',
    
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 90,
    marginLeft: 5,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    alignSelf: 'flex-start',
  },
  msg: {
    width: 'auto',
    minWidth: '50%',
    maxWidth: '70%',
    alignItems: 'flex-start',
  },
  textmsg: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    width: '70%',
    textAlign: 'left',
  },
  timestamp: {
    fontSize: 10,
    textAlign: 'left',
    alignSelf: 'flex-end',
    marginHorizontal: 10,
  },
  users: {
    flexDirection: 'row', 
    gap: 25, 
    alignContent: 'center',
  },
  usersName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  usersEmail: {
    fontSize: 14,
  },
  usersSkills: {
    width: '75%',
    padding: 10,
    fontSize: 16,
  },
  noUser: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    padding: 30,
    borderRadius: 15,
  },
  columnWrapper: {
    justifyContent: 'space-around',
  },
  button: {
    minWidth: '20%',
    //minHeight: 45,
    height: 45,
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    margin: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  }
});