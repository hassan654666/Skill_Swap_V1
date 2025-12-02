import React, { useEffect, useState, useRef, useCallback} from 'react';
import { View, Text, TextInput, Button, Modal, FlatList, StyleSheet, useColorScheme, TouchableOpacity, Image, BackHandler, ActivityIndicator, Dimensions, Alert, SafeAreaView, KeyboardAvoidingView, ScrollView, Pressable, Touchable } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useNavigation, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useUserContext } from '@/components/UserContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, ResizeMode, Video } from 'expo-av';
import * as FileSystem from "expo-file-system";
import { decode } from 'base64-arraybuffer';
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker"
import * as Clipboard from "expo-clipboard";
// import mime, { contentType } from "react-native-mime-types";
//import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from "expo-web-browser";
import './Avatar.png';
import '../assets/images/Avatar.png'
import { fi, he } from 'date-fns/locale';
import AudioPlayer from '@/components/AudioPlayer';
// import { TouchableWithoutFeedback } from 'react-native';

let notifee: any = null;
let AndroidImportance: any = null;
try {
  const notifeeModule = require("@notifee/react-native");
  notifee = notifeeModule.default;
  AndroidImportance = notifeeModule.AndroidImportance;
} catch (e) {
  console.log("Notifee not available in this environment");
}

const { width, height } = Dimensions.get("window");

export default function Chat() {

  const { usersData, userData, recording, setRecording, DarkMode } = useUserContext();

  const [inboxItems, setInboxItems] = useState<any>([]);
  const [messages, setMessages] = useState<any>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  //const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetMine, setDeleteTargetMine] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
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
  const linkTextColor = DarkMode ? "#007bffff" : "#000dffff";
  const buttonTextColor = "#fff";
  const bubbleOneColor = DarkMode ? '#183B4E' : '#3D90D7';
  const bubbleTwoColor = DarkMode ? '#015551' : '#1DCD9F';
  const flatListRef = useRef<any>();
  const isFocused = useIsFocused();

  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [mediaPreviewUri, setMediaPreviewUri] = useState<string | null>(null);
  const [mediaPreviewType, setMediaPreviewType] = useState<"image" | "video" | null>(null);

  const [docViewerVisible, setDocViewerVisible] = useState(false);
  const [docUrl, setDocUrl] = useState("");

  const senderId = userData?.id;
  //const route = useRoute<any>();
  const pathname = usePathname();
  const { receiverId, chatId } = useLocalSearchParams<{ chatId?: string; receiverId?: string }>();
  //const { receiverId, chatId } = route.params;
  const [thisChat_Id, setThisChat_Id] = useState(chatId || null);

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
    const { data: chatData, error: chatError } = await supabase
      .from('chat')
      .select('*')
      .or(
        `and(sender_Id.eq.${senderId},receiver_Id.eq.${receiverId}),and(sender_Id.eq.${receiverId},receiver_Id.eq.${senderId})`
      )
      .maybeSingle();

    if (chatError) console.error('fetchChat error:', chatError.message);
    setInboxItems(chatData || []);
    if (!thisChat_Id) {
      setThisChat_Id(chatData?.id);
    }
  };
  

  const Receiver = usersData?.filter((users: any) =>
    users?.id?.includes(receiverId)
  );

  const markMessagesAsRead = async (chat_id: any, receiver_id: any) => {
    if (!chat_id || !receiver_id) {
      console.warn("markMessagesAsRead called without chat_id or receiver_id");
      return;
    }

    console.log(`Marking messages as read for chat ${chat_id} and receiver ${receiver_id}`);

    const { error } = await supabase
      .from("Messages")
      .update({ read: true })
      .eq("chat_Id", chat_id)
      .eq("receiver_id", receiver_id)
      .eq("read", false); // only mark unread

    if (error) {
      console.error("Error marking messages as read:", error);
    } else {
      console.log(`Marked messages as read for chat ${chat_id}`);
    }
  };

  const sendMessage = async (text = content, fileUrl: string | null = null, fileName: string | null = null, fileType: string | null = null) => {
    if (!content.trim() && !fileUrl && !fileType) return; // Prevent sending empty messages

    let activeChatId = thisChat_Id;
    
    if (!activeChatId && inboxItems.length > 0) {
      activeChatId = inboxItems[0]?.id;
      setThisChat_Id(inboxItems[0]?.id);
    }

    // if (!messageInsertError) {

    if (!activeChatId && inboxItems.length === 0) {
      const { data: newChat, error: chatInsertError } = await supabase
        .from('chat')
        .insert([{ sender_Id: senderId, receiver_Id: receiverId, last_text: content !== '' ? content : fileName, last_sender: senderId, updated_at: new Date() }])
        .select()
        .single();
  
      if (chatInsertError) {
        console.error('Failed to create chat:', chatInsertError.message);
        return;
      }

      activeChatId = newChat?.id;
      setThisChat_Id(newChat?.id);
    } else {
      const { error: chatUpdateError } = await supabase
        .from('chat')
        .update({ last_text: content !== '' ? content : fileName, last_sender: senderId, updated_at: new Date() })
        .eq('id', activeChatId);
      
      if (chatUpdateError) {
        console.error('Failed to update chat:', chatUpdateError.message);
        return;
      }
    }

    const { error: messageInsertError } = await supabase
    .from('Messages')
    .insert([{
      chat_Id: activeChatId,
      sender_id: senderId,
      receiver_id: receiverId,
      text: text,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      reply_to: replyTo,
    }]);

    if (!messageInsertError) {
      console.log('Message sent successfully');
    } else {
      console.error('Failed to insert message:', messageInsertError.message);
    }

    setContent('');
  };

  // ✅ Pick files (multiple)
  const pickFiles = async () => {
    let result: any = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    console.log("File name (filename): ", result?.assets[previewIndex]?.name);
    console.log("File name from uri: ", getFileNameFromUri(result?.assets[previewIndex]?.uri));
    console.log("File: ", result.assets);
    if (!result.canceled) {
      setSelectedFiles(result.assets);
      //setPreviewUri(result.assets[0].uri);
      setPreviewIndex(0);
      setPreviewVisible(true);
    }
  };

  // Confirm & send files (fixed)
  const confirmSendFiles = async () => {
    try {
      for (const file of selectedFiles) {
        const fileName = `${Date.now()}_${file.name}`;
        const localPath = `${FileSystem.documentDirectory}app_files/${fileName}`;
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}app_files/`, { intermediates: true });
        await FileSystem.copyAsync({ from: file.uri, to: localPath });

        const uriToUpload = (await FileSystem.getInfoAsync(localPath)).exists
          ? localPath
          : file.uri;

        // Fetch + blob fallback
        let blob: Blob | null = null;
        try {
          const resp = await fetch(uriToUpload);
          blob = await resp.blob();
        } catch (e) {
          console.warn("fetch->blob failed, fallback to base64 only", e);
        }

        const base64 = await FileSystem.readAsStringAsync(uriToUpload, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Choose remote path
        const remotePath = `files/${fileName}`;

        // Try upload with decode(base64)
        const { data, error } = await supabase.storage
          .from("chat_files")
          .upload(remotePath, decode(base64), {
            contentType: file.mimeType || "application/octet-stream",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // If blob exists, optionally send again or double check — you can skip if base64 succeeded

        const fileUrl = supabase.storage.from("chat_files").getPublicUrl(data.path).data.publicUrl;
        await sendMessage(content, fileUrl, fileName, file.mimeType);
      }
    } catch (err: any) {
      console.error("confirmSendFiles error:", err);
      Alert.alert("Upload Failed", err.message);
    } finally {
      setSelectedFiles([]);
      setPreviewVisible(false);
      setPreviewIndex(0);
      setReplyTo(null); 
      setReplyingTo(null);
    }
  };

  // ✅ Record Audio
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error("recording error", err);
    }
  };

  // stopRecording fixed
  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const fileName = `${Date.now()}.m4a`;
      const localPath = `${FileSystem.documentDirectory}app_audio/${fileName}`;
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}app_audio/`, { intermediates: true });
      await FileSystem.copyAsync({ from: uri!, to: localPath });

      const uriToUpload = (await FileSystem.getInfoAsync(localPath)).exists
        ? localPath
        : uri!;

      // fetch + blob fallback
      let blob: Blob | null = null;
      try {
        const resp = await fetch(uriToUpload);
        blob = await resp.blob();
      } catch (e) {
        console.warn("fetch->blob failed for audio, fallback to base64", e);
      }

      const base64 = await FileSystem.readAsStringAsync(uriToUpload, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const remotePath = `voice/${fileName}`;

      const { data, error } = await supabase.storage
        .from("chat_files")
        .upload(remotePath, decode(base64), {
          contentType: "audio/m4a",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const fileUrl = supabase.storage.from("chat_files").getPublicUrl(data.path).data.publicUrl;
      await sendMessage("", fileUrl, fileName, "audio/m4a");
    } catch (err: any) {
      console.error("stopRecording upload error:", err);
      Alert.alert("Upload Failed", err.message);
    } finally {
      setRecording(null);
    }
  };

  // ✅ Open File
  const openFile = async (uri: string) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("Sharing not available");
    }
  };

  const openDocument = async (url: string) => {
    const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    try{
      await WebBrowser.openBrowserAsync(googleViewerUrl);
    } catch {
      setDocUrl(googleViewerUrl);
      setDocViewerVisible(true);
    }
  };

  // ✅ Name the Image
  const getFileNameFromUri = (uri: string) => {
    return uri.split("/").pop() || `image_${Date.now()}.jpg`;
  };

  // ✅ Pick Image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      console.log("File name (filename): ", result.assets[previewIndex]?.fileName);
      console.log("File name from uri: ", getFileNameFromUri(result.assets[previewIndex]?.uri));
      //console.log("File: ", result.assets);
      const fixedFiles = result.assets.map((asset) => ({
        ...asset,
        name: asset.fileName || getFileNameFromUri(asset.uri),
      }));
      console.log("Fixed File filename: ", fixedFiles[previewIndex].fileName);
      setSelectedFiles(fixedFiles);
      //setPreviewUri(fixedFiles[0].uri);
      setPreviewIndex(0);
      setPreviewVisible(true);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert("Permission required", "Camera access is needed to take pictures.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!result.canceled) {
      const fixedFiles = result.assets.map((asset) => ({
        ...asset,
        name: asset.fileName || getFileNameFromUri(asset.uri),
      }));
      setSelectedFiles(fixedFiles);
      //setPreviewUri(fixedFiles[0].uri);
      setPreviewIndex(0);
      setPreviewVisible(true);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setPreviewVisible(false);
        setPreviewIndex(0);
      } else {
        // adjust preview index safely
        setPreviewIndex(old => {
          if (index < old) return Math.max(0, old - 1);
          return Math.min(old, next.length - 1);
        });
      }
      return next;
    });
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return "file-o";
    
    if (mimeType.startsWith('image/')) return 'file-image-o';
    if (mimeType.startsWith('video/')) return 'file-video-o';
    if (mimeType.startsWith('audio/')) return 'file-audio-o';
    if (mimeType.includes('pdf')) return 'file-pdf-o';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-o';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel-o';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'file-archive-o';
    
    return 'file-o';
  };

  function goToProfile(item?: any){
    router.push({
      pathname: '/UserProfile',
      params:{
        userId: item?.id
      }
    })
  }
  
  useEffect(() => {
    fetchMessages();
    fetchChat();
    markMessagesAsRead(thisChat_Id, senderId);
  }, [thisChat_Id]);

  useFocusEffect(
    useCallback(() => {
      if (!senderId || !receiverId || !thisChat_Id) return;

      const messageChannel = supabase.channel("message_Channel");

      messageChannel.on(
        "postgres_changes",
        {
          event: "*", 
          schema: "public",
          table: "Messages",
          filter: `chat_Id=eq.${thisChat_Id}`, // 👈 only messages in this chat
        },
        async (payload: any) => {
          console.log("New message in this chat:", payload.new);

          // Update state or refetch
          fetchMessages();

          // Optionally mark as read + clear notifications
          if (payload.new.receiver_id === senderId) {
            await markMessagesAsRead(payload.new.chat_Id, payload.new.receiver_id);
          }
        }
      );

      messageChannel.subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }, [senderId, receiverId, thisChat_Id])
  );

  const toggleSelectMessage = (id: string) => {
    setSelectedMessages((prev) =>
      prev.includes(id)
        ? prev.filter((msgId) => msgId !== id)
        : [...prev, id]
    );
  };

  const exitSelection = () => setSelectedMessages([]);

  // ✅ Reply logic
  const handleReply = () => {
    if (selectedMessages.length !== 1) return;
    const message = messages.find((m: any) => m?.id === selectedMessages[0]);
    if (message) {
      // Show reply preview UI
      setReplyTo(message?.id);
      setReplyingTo(message);
      console.log("Replying to:", message?.text);
    }
    exitSelection();
  };

  // ✅ Copy logic
  const handleCopy = async () => {
    if (selectedMessages.length !== 1) return;
    const message = messages.find((m: any) => m?.id === selectedMessages[0]);
    if (message) {
      await Clipboard.setStringAsync(message?.text || "");
      // Alert.alert("Copied", "Message copied to clipboard");
    }
    exitSelection();
  };

  // ✅ Delete messages
  const deleteMsg = async () => {
    try {
    for (const id of selectedMessages) {
      const { data: msg, error: fetchErr } = await supabase
        .from('Messages')
        .select('deleted_for')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      const updatedDeletedFor = Array.isArray(msg?.deleted_for)
        ? [...new Set([...msg.deleted_for, userData?.id])]
        : [userData?.id];

      const { error } = await supabase
        .from('Messages')
        .update({ deleted_for: updatedDeletedFor })
        .eq('id', id)
        .eq('sender_id', receiverId);

      if (error) throw error;

      const { error: myMsgErr} = await supabase
        .from('Messages')
        .delete()
        .eq('id', id).eq('sender_id', senderId);

      if (myMsgErr) throw myMsgErr;
    }
      setDeleteModalVisible(false);
      exitSelection();
      fetchMessages();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const showDeleteAlert = () => {
    if (selectedMessages.length === 0) return;
    Alert.alert(
      "Delete Messages",
      "Delete selected messages?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: deleteMsg, style: "destructive" },
      ],
      { cancelable: true }
    );
  };

    const backAction = () => {
      if(router.canGoBack()){
      router.back();
      } else {
      router.replace('/(tabs)/Home');
      //router.push('/Home');
      }
      //navigation.navigate('Inbox'); 
      return true; 
    };

    useFocusEffect(
      useCallback(() => {    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
      }, [])
    );

    // ✅ Scroll to bottom when new messages come in
    useEffect(() => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    }, [messages]);

    const scrollToMessage = (replyToId: string) => {
      const index = messages.findIndex((m: any) => m?.id === replyToId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    };

    const currentChatId = chatId ?? null; 
    const currentReceiverId = receiverId ?? null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <View style={[styles.container, {backgroundColor: backgroundColor}]}>
      <View style= {[styles.topbar, {backgroundColor: SecondaryBackgroundColor}]}>
        <TouchableOpacity style= { {margin: 10, marginLeft: 5, paddingHorizontal: 10} } onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToProfile(Receiver[0])} style={styles.userhead}>
          <View style= { [styles.avatar, {margin: 25, marginTop: 25,}] }>
            <Image source= {Receiver[0]?.avatar_url ? { uri: Receiver[0]?.avatar_url } : require('../assets/images/Avatar.png')} style= { styles.avatar} resizeMode='cover'></Image>
          </View>
          <View>
            <Text style= {[styles.username, {color: textColor}]}>{Receiver[0]?.name ? Receiver[0]?.name : 'Guest'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ✅ Top Action Bar when selecting */}
      {selectedMessages.length > 0 && (
        <View style={[styles.SelectOptions, {backgroundColor: TertiaryBackgroundColor}]}>
          <TouchableOpacity onPress={exitSelection}>
            <FontAwesome name="close" size={26} style={{color: textColor}} />
          </TouchableOpacity>

          <Text style={[styles.SelectText, { color: textColor }]}>
            {selectedMessages.length} selected
          </Text>

          <View style={styles.actionsRight}>
            {selectedMessages.length === 1 && (
              <>
                <TouchableOpacity onPress={handleReply}>
                  <FontAwesome name="reply" size={24} style={{color: textColor}} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCopy}>
                  <FontAwesome name="copy" size={22} style={{color: textColor}} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={showDeleteAlert}>
              <FontAwesome name="trash" size={24} style={{color: textColor}} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style= {[styles.content, {backgroundColor: backgroundColor}]}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
        <FlatList
          style={[styles.flatlist, {backgroundColor: backgroundColor}]}
          contentContainerStyle={{ paddingBottom: 40 }}
          ref={flatListRef}
          inverted={true}
          data={messages.filter(
          (msg: any) => !msg.deleted_for?.includes(userData?.id)
          )}
          keyExtractor={(item) => item?.id}
          renderItem={({ item }) => {
            const isSelected = selectedMessages.includes(item?.id);
            const mine = item?.sender_id === userData?.id;
            const repliedMessage = item?.reply_to
            ? messages.find((m: any) => m?.id === item?.reply_to)
            : null;
            return (
              <Pressable onLongPress={() => toggleSelectMessage(item?.id)}
                onPress={() =>
                selectedMessages.length > 0 && toggleSelectMessage(item?.id)
                } style={{ width: '100%', backgroundColor: isSelected ? '#77857bff' : 'transparent', opacity: isSelected ? 0.6 : 1}}>
              <Pressable onLongPress={() => toggleSelectMessage(item?.id)}
                onPress={() =>
                selectedMessages.length > 0 && toggleSelectMessage(item?.id)
                }
              style={[item?.sender_id === senderId ? [styles.userBubble, {backgroundColor: bubbleOneColor, opacity: isSelected ? 1 : 1}] : [styles.receiverBubble, {backgroundColor: bubbleTwoColor, opacity: isSelected ? 1 : 1}]
              ]}>
              
              <View style={ styles.msg }>

              {/* Reply Preview */}
              {repliedMessage && (
                <TouchableOpacity
                  onPress={() => {
                    if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{
                      scrollToMessage(repliedMessage?.id)
                    }
                  }}
                  onLongPress={() => toggleSelectMessage(item?.id)}
                  activeOpacity={0.7}
                  style={[styles.replyPreview, {backgroundColor: TertiaryBackgroundColor, borderLeftColor: mine ? bubbleOneColor : bubbleTwoColor}]}
                >
                  <FontAwesome name="reply" size={16} style={{color: textColor, marginBottom: 4}} />
                  {repliedMessage?.file_type?.startsWith("image/") && (
                  <View style={{ width: 100, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}>
                    <Image source={{ uri: repliedMessage.file_url }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                    {/* <Text>{repliedMessage.file_name}</Text> */}
                  </View>
                  )}
                  {repliedMessage?.file_type?.startsWith("video/") && (
                  <View style={{ width: 100, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}>
                    <Video source={{ uri: repliedMessage.file_url }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                    {/* <Text>{repliedMessage.text}</Text> */}
                  </View>
                  )}
                  {repliedMessage?.file_type?.startsWith("audio/") && (
                    <View>
                      <AudioPlayer url={repliedMessage.file_url} DarkMode={DarkMode} Disabled={true}/>
                      {/* <Text style={{ textAlign: "center", color: textColor }}>{repliedMessage.file_name}</Text> */}
                    </View>
                  )}
                  {repliedMessage?.file_type && !repliedMessage.file_type.startsWith("image/") && !repliedMessage.file_type.startsWith("audio/") && !repliedMessage.file_type.startsWith("video/") && (
                    <View style={{ width: 100, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}>
                      <FontAwesome name={getFileIcon(repliedMessage?.file_type)} size={24} style={{color: textColor}} />
                      <Text style={{ textAlign: "center", color: textColor }}>{repliedMessage.file_name}</Text>
                    </View>
                  )}
                  {repliedMessage.text ? <Text style={[styles.textmsg, { color: textColor}]}>{repliedMessage.text}</Text> : null}
                </TouchableOpacity>
              )}

              {item.file_type?.startsWith("image/") && (
                <TouchableOpacity onPress={() => {
                    if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{
                      setMediaPreviewUri(item.file_url);
                      setMediaPreviewType("image");
                      setMediaPreviewVisible(true);
                    }
                  }}
                  onLongPress={() => toggleSelectMessage(item?.id)}>
                  <Image source={{ uri: item.file_url }} style={{ width: 150, height: 150, borderRadius: 8 }} />
                  {/* <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text> */}
                </TouchableOpacity>
              )}
              {item.file_type?.startsWith("video/") && (

                <TouchableOpacity onPress={() => {
                  if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{
                    setMediaPreviewUri(item.file_url);
                    setMediaPreviewType("video");
                    setMediaPreviewVisible(true);
                    }
                  }}
                  onLongPress={() => toggleSelectMessage(item?.id)}>
                  <View style={{ width: 150, height: 150, position: "relative", justifyContent: "center", alignItems: "center" }}>
                    <Video source={{ uri: item.file_url }} style={{ width: '100%', height: '100%', borderRadius: 8}} resizeMode={ResizeMode.COVER} />
                    <View
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: [{ translateX: -15 }, { translateY: -15 }],
                        backgroundColor: "rgba(0,0,0,0.5)",
                        padding: 15,
                        borderRadius: 25,
                      }}
                    >
                      <FontAwesome name="play" size={20} color="#fff" />
                    </View>
                  </View>
                  {/* <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text> */}
                </TouchableOpacity>
              )}
              {item.file_type?.startsWith("audio/") && (
                <View style={{ minWidth: 200, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}>
                  <AudioPlayer url={item.file_url} DarkMode={DarkMode}/>
                  {/* <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text> */}
                </View>
              )}
              {item.file_type === "application/msword" && (
                <TouchableOpacity onPress={() => {
                  if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{ 
                      openDocument(item.file_url) 
                    }
                  }}
                onLongPress={() => toggleSelectMessage(item?.id)}
                style={{ width: 100, height: 100, position: "relative", justifyContent: "center", alignItems: "center" }}>
                  <FontAwesome name={getFileIcon(item?.file_type)} size={24} style={{color: textColor}} />
                  <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text>
                </TouchableOpacity>
              )}
              {item.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && (
                <TouchableOpacity onPress={() => {
                  if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{ 
                      openDocument(item.file_url) 
                    }
                  }}
                onLongPress={() => toggleSelectMessage(item?.id)}
                style={{ width: 100, height: 100, position: "relative", justifyContent: "center", alignItems: "center" }}>
                  <FontAwesome name={getFileIcon(item?.file_type)} size={24} style={{color: textColor}} />
                  <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text>
                </TouchableOpacity>
              )}
              {item.file_type === "application/pdf" && (
                <TouchableOpacity onPress={() => { 
                  if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{
                      openDocument(item.file_url) 
                    }
                  }}
                onLongPress={() => toggleSelectMessage(item?.id)}
                style={{ width: 100, height: 100, position: "relative", justifyContent: "center", alignItems: "center" }}>
                  <FontAwesome name={getFileIcon(item?.file_type)} size={24} style={{color: textColor}} />
                  <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text>
                </TouchableOpacity>
              )}
              {item.file_type && !item.file_type.startsWith("image/") && !item.file_type.startsWith("audio/") && !item.file_type.startsWith("video/") && item.file_type !== "application/msword" && item.file_type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && item.file_type !== "application/pdf" && (
                <TouchableOpacity onPress={() => {if(selectedMessages.length > 0 ) {
                      toggleSelectMessage(item?.id)
                      return;
                    }else{
                      openDocument(item.file_url)
                    }
                  }}
                onLongPress={() => toggleSelectMessage(item?.id)}
                style={{ width: 100, height: 100, position: "relative", justifyContent: "center", alignItems: "center" }}>
                  <FontAwesome name={getFileIcon(item?.file_type)} size={24} style={{color: textColor}} />
                  <Text style={{ textAlign: "center", color: textColor }}>{item.file_name}</Text>
                </TouchableOpacity>
              )}
              {item.text ? <Text style={[styles.textmsg, { color: textColor}]}>{item.text}</Text> : null}

              <Text style={[styles.timestamp, { color: textColor }]}>
                {format(parseISO(item?.created_at), 'dd-MM-yy - h:mm a')}
              </Text>
              </View>
            </Pressable>
            </Pressable>
            )
          }}
          
          initialNumToRender={15}
          maxToRenderPerBatch={5}
          windowSize={21}
          removeClippedSubviews
          //onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
          ListEmptyComponent={
            <Text style={[styles.noUser, {color: textColor}]}>No messages yet</Text>
          }
        />
        )}
      </View>

      {selectedFiles.length > 0 && (
        <Modal visible={previewVisible} transparent={true} animationType="fade">
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: 'center', paddingTop: 40, paddingBottom: 20 }}>
            {/* Close modal (cancel all) */}
            {/* <TouchableOpacity
              style={{ position: "absolute", top: 40, right: 20, zIndex: 30, backgroundColor: "transparent", padding: 8 }}
              onPress={() => { setPreviewVisible(false); setSelectedFiles([]); setPreviewIndex(0); }}
            >
              <FontAwesome name="close" size={26} color="#fff" />
            </TouchableOpacity> */}

            {/* MAIN PREVIEW */}
            <View style={{ width: width * 1, height: height * 0.6, justifyContent: 'center', alignItems: 'center' }}>
              {selectedFiles[previewIndex]?.mimeType?.startsWith("image/") ? (
                <>
                  <Image
                    source={{ uri: selectedFiles[previewIndex].uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                  {/* Remove this file (main preview) */}
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 0, right: 8, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 20 }}
                    onPress={() => removeFile(previewIndex)}
                  >
                    <FontAwesome name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesome name={getFileIcon(selectedFiles[previewIndex]?.mimeType)} size={72} color="#fff" />
                    <Text style={{ color: "#fff", marginTop: 12, textAlign: 'center' }}>
                      {selectedFiles[previewIndex].name || getFileNameFromUri(selectedFiles[previewIndex].uri)}
                    </Text>
                    <TouchableOpacity
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 20 }}
                      onPress={() => removeFile(previewIndex)}
                    >
                      <FontAwesome name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* THUMBNAIL SCROLL (horizontal) */}
            {selectedFiles.length > 1 && (
            <View style={{ height: 110, marginTop: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 8 }}>
                {selectedFiles.map((file, idx) => (
                  <View key={idx} style={{ marginRight: 12, alignItems: 'center', width: 80 }}>
                    <TouchableOpacity onPress={() => setPreviewIndex(idx)}>
                      {file.mimeType?.startsWith("image/") ? (
                        <Image source={{ uri: file.uri }} style={{ width: 70, height: 70, borderRadius: 8 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                          <FontAwesome name={getFileIcon(file?.mimeType)} size={32} color="#fff" />
                          <Text numberOfLines={1} style={{ color: textColor, width: 70, textAlign: 'center', marginTop: 6 }}>
                            {file.name || getFileNameFromUri(file.uri)}
                          </Text>
                        </View>
                        
                      )}
                    </TouchableOpacity>

                    {/* per-thumbnail remove button (removes only that file) */}
                    <TouchableOpacity
                      style={{ position: 'absolute', top: -6, right: -6, zIndex: 30 }}
                      onPress={() => removeFile(idx)}
                    >
                      <FontAwesome name="times-circle" size={20} color="#fff" />
                    </TouchableOpacity>

                    
                  </View>
                ))}
              </ScrollView>
            </View>
            )}

            {/* Input + Send (still visible inside modal) */}
            <View style={styles.modalInput}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Type a message"
                style={[styles.input, { backgroundColor: inputColor, flex: 1, marginRight: 10 }]}
                multiline={true}
              />
              <TouchableOpacity style={styles.button} onPress={confirmSendFiles}>
                <FontAwesome name="send" size={24} color={buttonTextColor} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Media preview modal (images & videos) */}
      <Modal
        visible={mediaPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMediaPreviewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 36, left: 18, zIndex: 30 }}
            onPress={() => setMediaPreviewVisible(false)}
          >
            <FontAwesome name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          {mediaPreviewType === "image" && mediaPreviewUri && (
            <Image source={{ uri: mediaPreviewUri }} style={{ width: "95%", height: "85%" }} resizeMode="contain" />
          )}

          {mediaPreviewType === "video" && mediaPreviewUri && (
            <Video
              source={{ uri: mediaPreviewUri }}
              useNativeControls
              shouldPlay
              resizeMode={ResizeMode.CONTAIN}
              style={{ width: '95%' , height: "95%" }}
            />
          )}
        </View>
      </Modal>


      <Modal visible={docViewerVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setDocViewerVisible(false)}
            style={{ padding: 10, backgroundColor: "#575757ff" }}
          >
            <Text style={{ color: "#fff" }}>Close</Text>
          </TouchableOpacity>

          <WebView 
            source={{ uri: docUrl }} 
            style={{ flex: 1 }} 
             originWhitelist={['*']}
             javaScriptEnabled
             domStorageEnabled
          />
        </SafeAreaView>
      </Modal>

      {replyingTo && (
      
        <View
          style={[styles.replyingPreview, {backgroundColor: TertiaryBackgroundColor}]}
        >
          <View style={[{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8}]}>
            <FontAwesome name="reply" size={16} style={{color: textColor, marginBottom: 4}} />
            <FontAwesome name="close" size={20} style={{color: textColor, marginBottom: 4}} onPress={() => { setReplyTo(null); setReplyingTo(null); }}/>
          </View>
          {replyingTo?.file_type?.startsWith("image/") && (
          <View style={{ width: 100, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}>
            <Image source={{ uri: replyingTo.file_url }} style={{ width: 50, height: 50, borderRadius: 8 }} />
            {/* <Text>{repliedMessage.file_name}</Text> */}
          </View>
          )}
          {replyingTo?.file_type?.startsWith("video/") && (
          <View style={{ width: 100, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}> 
            <Video source={{ uri: replyingTo.file_url }} style={{ width: 50, height: 50, borderRadius: 8 }} />
            {/* <Text>{repliedMessage.text}</Text> */}
          </View>
          )}
          {replyingTo?.file_type?.startsWith("audio/") && (
            <View>
              <AudioPlayer url={replyingTo.file_url} DarkMode={DarkMode} Disabled={true}/>
              {/* <Text style={{ textAlign: "center", color: textColor }}>{replyingTo.file_name}</Text> */}
            </View>
          )}
          {replyingTo?.file_type && !replyingTo.file_type.startsWith("image/") && !replyingTo.file_type.startsWith("audio/") && !replyingTo.file_type.startsWith("video/") && (
            <View style={{ width: 100, height: 'auto', position: "relative", justifyContent: "center", alignItems: "center" }}>
              <FontAwesome name={getFileIcon(replyingTo?.file_type)} size={24} style={{color: textColor}} />
              <Text style={{ textAlign: "center", color: textColor }}>{replyingTo.file_name}</Text>
            </View>
          )}
          {replyingTo.text ? <Text style={[styles.textmsg, { color: textColor}]}>{replyingTo.text}</Text> : null}
        </View>  
      )}

      <View style={[styles.inputArea, {backgroundColor: backgroundColor}]}>
        <TouchableOpacity style={styles.button} onPress={pickFiles}>
          <FontAwesome name="paperclip" size={24} color={textColor} />
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.button} onPress={pickImage}>
          <FontAwesome name="image" size={24} color={buttonTextColor} />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <FontAwesome name="camera" size={24} color={textColor} />
        </TouchableOpacity>
      
        <TextInput 
          value={content} 
          onChangeText={setContent} 
          placeholder="Type a message" 
          style={[styles.input, {backgroundColor: inputColor}]} 
          multiline={true}
          numberOfLines={10}
        />

        <TouchableOpacity style={styles.button} onPress={recording ? () => {stopRecording(); setReplyTo(null); setReplyingTo(null);} : startRecording}>
          <FontAwesome name={recording ? "stop" : "microphone"} size={24} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {sendMessage(); setReplyTo(null); setReplyingTo(null);}}>
          <FontAwesome name="send" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
      
    </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    //height: height,
  },
  content:{
    flex: 0.9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    //flexGrow: 1,
    flexShrink: 1,
  },
  topbar: {
    //flex: 0.1,
    // position: 'absolute',
    // top: 0,
    flexDirection: 'row',
    width: '100%',
    //height: 60,
    //marginBottom: '10%',
    height: height * 0.06,
    //padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start', 
    verticalAlign: 'top',
    //flexGrow: 1,
    //flexShrink: 0,
  },
  inputArea: {
    // position: 'absolute',
    // bottom: 0,
    flex: 0.1,
    flexDirection: 'row',
    height: 60,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    verticalAlign: 'bottom',
    //padding: 20,
    //flexGrow: 0.15,
    //backgroundColor: 'rgba(0, 0, 0, 0)'
  },
  input: {
    maxWidth: '55%',
    minWidth: '50%',
    width: 'auto',
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 30,
    paddingLeft: 10,
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
    // width: 50,
    // height: 50,
    height: width * 0.1,
    width: width * 0.1,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    
  },
  username: { 
    width: '75%', 
    fontSize: 16, 
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
    flex: 1,
    width: '100%',  
    padding: width * 0.03,
    flexShrink: 1,
  },
  userBubble: {
    //flex: 1,
    flexDirection: 'row-reverse',
    padding: 5,
    margin: 5,
    borderRadius: 20,
    borderTopRightRadius: 0,
    maxWidth: '80%',
    alignSelf: 'flex-end',
    alignItems: 'center',
    
  },
  receiverBubble: {
    //flex: 1,
    flexDirection: 'row',
    padding: 5,
    margin: 5,
    borderRadius: 20,
    borderTopLeftRadius: 0,
    maxWidth: '80%',
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
    //minWidth: '50%',
    maxWidth: '100%',
    alignItems: 'flex-start',
    flexShrink: 1
  },
  textmsg: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    //width: '70%',
    textAlign: 'left',
    flexShrink: 1
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
    minWidth: '5%',
    //minHeight: 45,
    height: 45,
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    //margin: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  previewBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#444", 
    padding: 5 
  },
  modalBg: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.9)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 10,
  },
  fullImage: { 
    width: "100%", 
    height: "100%" 
  },

  bubble: {
    maxWidth: "75%",
    marginVertical: 4,
    borderRadius: 10,
    padding: 10,
  },
  replyingPreview: {
    minWidth: 100,
    height: 'auto',
    opacity: 0.8,
    padding: 2,
    paddingLeft: 4,
    marginBottom: 4,
    borderRadius: 10,
  },
  replyPreview: {
    width: '100%',
    height: 'auto',
    opacity: 0.5,
    padding: 2,
    paddingLeft: 4,
    marginBottom: 4,
    //borderBottomWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  replyText: {
    fontSize: 12,
    color: "#ccc",
    marginBottom: 3,
  },
  SelectOptions: {
    //backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  SelectText: {
    //color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  actionsRight: {
    flexDirection: "row",
    gap: width * 0.07,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: 260,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  modalBtn: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
  },
  modalInput: {
    flexDirection: 'row', 
    alignItems: 'center', 
    position: 'absolute', 
    bottom: 20, width: width * 0.95, 
    justifyContent: 'center'
  },
  confirmBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});