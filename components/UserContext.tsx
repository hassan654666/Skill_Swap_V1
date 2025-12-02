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
import { GlobalPiPWindow } from '@/app/GlobalPiPWindow';
import { useRouter } from 'expo-router';

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
  isRecovery: any;
  setIsRecovery: any;
  pipVisible: boolean,
  setPipVisible: any,
  pipUrl: string | null,
  setPipUrl: any,
  partnerId: string | null,
  setPartnerId: any,
  skills: any,
  setSkills: any,
  courses: any, 
  setCourses: any,
  reports: any, 
  setReports: any,
  allUsers: any,
  setAllUsers: any,
  purchases: any,
  setPurchases: any,
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
  const [isRecovery, setIsRecovery] = useState(false);
  const [pipVisible, setPipVisible] = useState(false);
  const [pipUrl, setPipUrl] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
   const checkAsyncStorage = async () => {
    const asyncSession = await AsyncStorage.getItem('session');
    const asyncUser = await AsyncStorage.getItem('user');
    const asyncUsers = await AsyncStorage.getItem('users');
    const asyncProfile = await AsyncStorage.getItem('profile');
    const asyncDarkMode = await AsyncStorage.getItem('darkMode');
    const asyncSkills = await AsyncStorage.getItem('skills');
    const asyncCourses = await AsyncStorage.getItem('courses');
    const asyncReports = await AsyncStorage.getItem('reports');
    const asyncProfiles = await AsyncStorage.getItem('profiles');
    const asyncPurchases = await AsyncStorage.getItem('purchases');

    if(asyncDarkMode){
      setDarkMode(asyncDarkMode === 'true');
    }

    if (asyncSession) {
      thisUserRef.current = asyncUser ? JSON.parse(asyncUser) : null;
      usersDataRef.current = asyncUsers ? JSON.parse(asyncUsers) : [];
      userDataRef.current = asyncProfile ? JSON.parse(asyncProfile) : null;
      sessionRef.current = JSON.parse(asyncSession);
      setUserId(userDataRef.current?.id ?? null);
      setSkills(asyncSkills ? JSON.parse(asyncSkills) : [])
      setCourses(asyncCourses ? JSON.parse(asyncCourses) : [])
      setReports(asyncReports ? JSON.parse(asyncReports) : [])
      setAllUsers(asyncProfiles ? JSON.parse(asyncProfiles) : [])
      setPurchases(asyncPurchases ? JSON.parse(asyncPurchases) : [])

      setUpdateFlag(prev => !prev);
    }
    setLoading(false);
   };
   checkAsyncStorage();
  }, []);

  const fetchSessionAndUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session: newSession } } = await supabase.auth.getSession();

      // if (!newSession) {
      //   clearUserData();
      //   return;
      // }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        AsyncStorage.setItem('user', JSON.stringify(user));
        thisUserRef.current = user;
        //savePushToken(user.id);

        // Fetch other users' data
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url, header_url, rating, reviews')
          .neq('authid', user.id);

        // if (!error) {
        //   AsyncStorage.setItem('users', JSON.stringify(users));
        //   usersDataRef.current = users;
        // }

        // Fetch the current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url, header_url, expo_token, fcm_token, is_admin, rating, reviews, banned')
          .eq('authid', user.id)
          .single();

           // Fetch all skills
        const { data: skillsData, error: sError } = await supabase
          .from("skills")
          .select("id, name, type, description");
  
        if (sError) {
          console.log("skills error:", sError);
          return;
        }
        AsyncStorage.setItem('skills', JSON.stringify(skillsData));
        setSkills(skillsData);
  
        // Fetch profile_skills with join
        const { data: profileSkills, error: psError } = await supabase
          .from("profile_skills")
          .select("profile_id, category, skills(id, name, type)");
  
        if (psError) {
          console.log("profile_skills error:", psError);
          return;
        }

        const { data: profiles, error: prError } = await supabase
          .from('profiles')
          .select('*');

           // Merge skills into profiles
        const allUsers : any = profiles?.map((user) => {
          const offered = profileSkills
            .filter(ps => ps.profile_id === user?.id && ps.category === "offered")
            .map(ps => ps.skills);
  
          const required = profileSkills
            .filter(ps => ps.profile_id === user?.id && ps.category === "required")
            .map(ps => ps.skills);
  
          return {
            ...user,
            skillsOffered: offered,
            skillsRequired: required
          };
        });
  
        if (!prError) {
          AsyncStorage.setItem('profiles', JSON.stringify(allUsers));
          setAllUsers(allUsers);
        }
  
        // Merge skills into profiles
        const finalUsers : any = users?.map((user) => {
          const offered = profileSkills
            .filter(ps => ps.profile_id === user?.id && ps.category === "offered")
            .map(ps => ps.skills);
  
          const required = profileSkills
            .filter(ps => ps.profile_id === user?.id && ps.category === "required")
            .map(ps => ps.skills);
  
          return {
            ...user,
            skillsOffered: offered,
            skillsRequired: required
          };
        });
  
        if (!psError) {
          AsyncStorage.setItem('users', JSON.stringify(finalUsers));
          usersDataRef.current = finalUsers;
        }

        AsyncStorage.setItem('session', JSON.stringify(newSession));
        sessionRef.current = newSession;

        if (!profileError) {
          setUserId(profile.id);
          console.log("userId from profiles table:", profile.id);

          // Merge skills into the profile
          const offered = profileSkills
            .filter(ps => ps.profile_id === profile.id && ps.category === "offered")
            .map(ps => ps.skills);

          const required = profileSkills
            .filter(ps => ps.profile_id === profile.id && ps.category === "required")
            .map(ps => ps.skills);

          const finalUser = {
            ...profile,
            skillsOffered: offered,
            skillsRequired: required,
          };

          await AsyncStorage.setItem("profile", JSON.stringify(finalUser));
          userDataRef.current = finalUser;
        }

        const { data: coursesData, error: cError } = await supabase
            .from("courses")
            .select("*")
            .or(`status.eq.approved,owner_id.eq.${profile?.id ?? "null"}`)
            .order("created_at", { ascending: false });
  
        if (cError) {
          console.log("courses error:", cError);
          return;
        }
        AsyncStorage.setItem('courses', JSON.stringify(coursesData));
        setCourses(coursesData);

        const { data: reportsData, error: rError } = await supabase
          .from("reports")
          .select("*");
  
        if (rError) {
          console.log("reports error:", cError);
          return;
        }
        AsyncStorage.setItem('reports', JSON.stringify(reportsData));
        setReports(coursesData);

        const { data: purchaseData, error: prchError } = await supabase
          .from("purchases")
          .select("*");
  
        if (prchError) {
          console.log("purchases error:", prchError);
          return;
        }
        AsyncStorage.setItem('purchases', JSON.stringify(purchaseData));
        setPurchases(purchaseData);

        // Trigger re-render by changing the state
        setUpdateFlag(prev => !prev); // Toggle the update flag

      //   if(!profile){
      //     router.replace('/CompleteProfile');
      //   } else if(profile?.banned){
      //     router.replace('/Banned')
      //   } else {
      //     router.replace('/(tabs)/Home');
      //   }
        
      // } else {
      //   router.replace('/Login')
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false)
    }
  }, []); // depends on expoPushToken to ensure token check runs if that changes during fetch


  const clearUserData = useCallback(() => {
    removePushToken(userDataRef.current?.id);
    removeFcmToken(userDataRef.current?.id);
    AsyncStorage.removeItem('session');
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('users');
    AsyncStorage.removeItem('profile');
    AsyncStorage.removeItem('skills');
    AsyncStorage.removeItem('courses');
    AsyncStorage.removeItem('reports');
    AsyncStorage.removeItem('profiles');
    AsyncStorage.removeItem('purchases');
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
  }, [expoPushToken, userDataRef.current]); // runs whenever token changes */

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

  useEffect(() => {
    if(!userId) return;

    const profilesChannel = supabase
      .channel("profiles-update")
      .on(
        "postgres_changes",
        {
          event: "*", // insert/update/delete
          schema: "public",
          table: "profiles",
        },
        () => {
          // Re-fetch all counts whenever something changes
          fetchSessionAndUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [userId, fetchSessionAndUserData]);

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
      isRecovery,
      setIsRecovery,
      setIsDark,
      pipVisible,
      setPipVisible,
      pipUrl,
      setPipUrl,
      partnerId,
      setPartnerId,
      skills,
      setSkills,
      courses, 
      setCourses,
      reports, 
      setReports,
      allUsers,
      setAllUsers,
      purchases,
      setPurchases,
      fetchSessionAndUserData,
      clearUserData
    }}>
      {children}
      {pipVisible && <GlobalPiPWindow url={pipUrl} partnerId={partnerId}/>}
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
