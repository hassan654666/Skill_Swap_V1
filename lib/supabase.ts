import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants';

const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig?.extra || {};
// const supabaseUrl = 'https://saxuhvcppykdazdfosae.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheHVodmNwcHlrZGF6ZGZvc2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzM1ODksImV4cCI6MjA0ODc0OTU4OX0.EHyhsLl7ehchRsPi61kejdGidDDDF1yRiDyBphq7ZfY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Adjust based on your needs
    },
  },
})