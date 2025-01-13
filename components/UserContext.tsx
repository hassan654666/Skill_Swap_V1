import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface UserContextType {
  session: any;
  thisUser: any;
  usersData: any[];
  userData: any;
  fetchSessionAndUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionRef = useRef<any>(null);
  const thisUserRef = useRef<any>(null);
  const usersDataRef = useRef<any[]>([]);
  const userDataRef = useRef<any>(null);
  const [updateFlag, setUpdateFlag] = useState(false); // State to trigger re-renders

  useEffect(() => {
   const checkAsyncStorage = async () => {
    const asyncSession = await AsyncStorage.getItem('session');
    const asyncUser = await AsyncStorage.getItem('user');
    const asyncUsers = await AsyncStorage.getItem('users');
    const asyncProfile = await AsyncStorage.getItem('profile');

    if (asyncSession) {
      sessionRef.current = JSON.parse(asyncSession);
      thisUserRef.current = asyncUser ? JSON.parse(asyncUser) : null;
      usersDataRef.current = asyncUsers ? JSON.parse(asyncUsers) : [];
      userDataRef.current = asyncProfile ? JSON.parse(asyncProfile) : null;

      setUpdateFlag(prev => !prev);
    }
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
          .select('id, authid, name, username, email, description, skillsOffered, skillsRequired, avatar_url')
          .eq('authid', user.id)
          .single();

        if (!profileError) {
          AsyncStorage.setItem('profile', JSON.stringify(profile));
          userDataRef.current = profile;
        }

        // Trigger re-render by changing the state
        setUpdateFlag(prev => !prev); // Toggle the update flag
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    }
  }, []);

  const clearUserData = useCallback(() => {
    AsyncStorage.removeItem('session');
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('users');
    AsyncStorage.removeItem('profile');
    sessionRef.current = null;
    thisUserRef.current = null;
    usersDataRef.current = [];
    userDataRef.current = null;

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
  }, [fetchSessionAndUserData, clearUserData]);

  return (
    <UserContext.Provider value={{
      session: sessionRef.current,
      thisUser: thisUserRef.current,
      usersData: usersDataRef.current,
      userData: userDataRef.current,
      fetchSessionAndUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
