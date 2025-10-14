import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { usePushToken } from '@/hooks/usePushToken';
import { savePushToken } from '@/utils/savePushToken';
import { removePushToken } from '@/utils/removePushToken';
import { useFCMToken } from '@/hooks/useFCMToken';
import { saveFcmToken } from '@/utils/saveFcmToken';
import { removeFcmToken } from '@/utils/removeFcmToken';
import { useColorScheme } from 'react-native';
import { Audio } from 'expo-av';

interface UserContextType {
  session: any;
  thisUser: any;
  usersData: any[];
  userData: any;
  loading: boolean;
  unreadCount: number;
  recording: Audio.Recording | null;
  setRecording: (recording: Audio.Recording | null) => void;
  setUnreadCount: (count: number) => void;
  DarkMode: boolean;
  setIsDark: (isDark: boolean) => void;
  fetchSessionAndUserData: () => Promise<void>;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { expoPushToken } = usePushToken();
  const { fcmToken } = useFCMToken();
  const sessionRef = useRef<any>(null);
  const thisUserRef = useRef<any>(null);
  const usersDataRef = useRef<any[]>([]);
  const userDataRef = useRef<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [updateFlag, setUpdateFlag] = useState(false); // State to trigger re-renders
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<any>();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [DarkMode, setDarkMode] = useState(dark);

  useEffect(() => {
   const checkAsyncStorage = async () => {
    const asyncSession = await AsyncStorage.getItem('session');
    const asyncUser = await AsyncStorage.getItem('user');
    const asyncUsers = await AsyncStorage.getItem('users');
    const asyncProfile = await AsyncStorage.getItem('profile');
    const asyncDarkMode = await AsyncStorage.getItem('darkMode');

    if(asyncDarkMode){
      setDarkMode(asyncDarkMode === 'true');
    }

    if (asyncSession) {
      sessionRef.current = JSON.parse(asyncSession);
      thisUserRef.current = asyncUser ? JSON.parse(asyncUser) : null;
      usersDataRef.current = asyncUsers ? JSON.parse(asyncUsers) : [];
      userDataRef.current = asyncProfile ? JSON.parse(asyncProfile) : null;
      setUserId(userDataRef.current.id);

      setUpdateFlag(prev => !prev);
    }
    setLoading(false);
   };
   checkAsyncStorage();
  }, []);

  const fetchSessionAndUserData = useCallback(async () => {
    try {
      const { data: { session: newSession } } = await supabase.auth.getSession();

      // if (!newSession) {
      //   clearUserData();
      //   return;
      // }
      AsyncStorage.setItem('session', JSON.stringify(newSession));
      sessionRef.current = newSession;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        AsyncStorage.setItem('user', JSON.stringify(user));
        thisUserRef.current = user;
        //savePushToken(user.id);

        // Fetch other users' data
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url')
          .neq('authid', user.id);

        if (!error) {
          AsyncStorage.setItem('users', JSON.stringify(users));
          usersDataRef.current = users;
        }

        // Fetch the current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url, expo_token, fcm_token')
          .eq('authid', user.id)
          .single();

        if (!profileError) {
          AsyncStorage.setItem('profile', JSON.stringify(profile));
          userDataRef.current = profile;
          setUserId(profile.id);
          // --- IMPORTANT: immediate save if token already exists in hook and differs from profile
          // const tokenString = expoPushToken?.data ?? (typeof expoPushToken === 'string' ? expoPushToken : null);
          // console.log("Profile Id fetched:", profile.id);
          // console.log("Expo Push Token from hook during fetchSessionAndUserData:", expoPushToken);
          // //console.log("Checking token during fetchSessionAndUserData:", tokenString);
          // console.log("Profile token during fetchSessionAndUserData:", profile.expo_token);
          // if (tokenString && profile.expo_token !== tokenString) {
          //   try {
          //     await savePushToken(profile.id, expoPushToken);
          //     // update local profile copy to reflect saved token
          //     userDataRef.current = { ...userDataRef.current, expo_token: expoPushToken?.data };
          //     AsyncStorage.setItem('profile', JSON.stringify(userDataRef.current));
          //   } catch (err) {
          //     console.error('Failed to save token during fetchSessionAndUserData:', err);
          //   }
          // }
        }

        // Trigger re-render by changing the state
        setUpdateFlag(prev => !prev); // Toggle the update flag
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    }
  }, []); // depends on expoPushToken to ensure token check runs if that changes during fetch


  const clearUserData = useCallback(() => {
    removePushToken(userDataRef.current?.id);
    removeFcmToken(userDataRef.current?.id);
    AsyncStorage.removeItem('session');
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('users');
    AsyncStorage.removeItem('profile');
    sessionRef.current = null;
    thisUserRef.current = null;
    usersDataRef.current = [];
    userDataRef.current = null;
    setUserId(null);
    setUnreadCount(0);

    // Trigger re-render after clearing the data
    setUpdateFlag(prev => !prev); // Toggle the update flag
  }, []);

  useEffect(() => {
    // Listen for authentication state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        //sessionRef.current = session;
        fetchSessionAndUserData();
      } else if (event === 'SIGNED_OUT') {
        clearUserData();
      }
    });

    return () => {
      subscription.subscription?.unsubscribe();
    };
  //}, [fetchSessionAndUserData, clearUserData]);
  }, []);

   useEffect(() => {
    console.log("useEffect triggered by expoPushToken change:", expoPushToken);
    (async () => {
      try {
        const profileId = userDataRef.current?.id;
        const currentProfileToken = userDataRef.current?.expo_token ?? null;
        const tokenString = expoPushToken?.data ?? (typeof expoPushToken === 'string' ? expoPushToken : null);
        console.log("Profile ID:", profileId);
        console.log("Current Profile Token:", currentProfileToken);
        console.log("New Token from Hook:", expoPushToken);

         if (profileId && tokenString && tokenString !== currentProfileToken) {
          await savePushToken(profileId, expoPushToken);
          // update local copy
          userDataRef.current = { ...userDataRef.current, expo_token: expoPushToken?.data };
          AsyncStorage.setItem('profile', JSON.stringify(userDataRef.current));
          setUpdateFlag(prev => !prev);
         }
      } catch (err) {
        console.error('Error saving push token from useEffect:', err);
      }
    })();
  }, [expoPushToken, userDataRef.current]); // runs whenever token changes

  useEffect(() => {
    console.log("useEffect triggered by expoPushToken change:", fcmToken);
    (async () => {
      try {
        const profileId = userDataRef.current?.id;
        const currentProfilefcmToken = userDataRef.current?.fcm_token ?? null;
        const tokenString = fcmToken ?? (typeof fcmToken === 'string' ? fcmToken : null);
        console.log("Profile ID:", profileId);
        console.log("Current Profile Token:", currentProfilefcmToken);
        console.log("New Token from Hook:", fcmToken);

         if (profileId && tokenString && tokenString !== currentProfilefcmToken) {
          await saveFcmToken(profileId, fcmToken);
          // update local copy
          userDataRef.current = { ...userDataRef.current, fcm_token: fcmToken };
          AsyncStorage.setItem('profile', JSON.stringify(userDataRef.current));
          setUpdateFlag(prev => !prev);
         }
      } catch (err) {
        console.error('Error saving push token from useEffect:', err);
      }
    })();
  }, [expoPushToken, userDataRef.current]); // runs whenever token changes

  // 🔹 Fetch unread counts for all chats in ONE query
  const fetchUnreadCounts = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("Messages")
      .select("chat_Id")
      .eq("receiver_id", userId)
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

    setUnreadCount(Object.values(counts).reduce((a, b) => a + b, 0));

    // // Trigger re-render after clearing the data
    // setUpdateFlag(prev => !prev); // Toggle the update flag
  }, [userId]);
  
  useEffect(() => {
    if(!userId) return;
    
    fetchUnreadCounts();

    const unreadChannel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*", // insert/update/delete
          schema: "public",
          table: "Messages",
          filter: `receiver_id=eq.${userId}`,
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
  }, [userId, fetchUnreadCounts]);

  const setIsDark = useCallback(async (value : boolean) => {
    setDarkMode(value);
    AsyncStorage.setItem('darkMode', value ? 'true' : 'false');
  }, []);

  return (
    <UserContext.Provider value={{
      session: sessionRef.current,
      thisUser: thisUserRef.current,
      usersData: usersDataRef.current,
      userData: userDataRef.current,
      unreadCount, 
      recording,
      setRecording,
      loading,
      setUnreadCount,
      DarkMode,
      setIsDark,
      fetchSessionAndUserData,
      clearUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  //const { expoPushToken } = usePushToken();
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  //savePushToken(context.userData?.id, expoPushToken);
  return context;
};
