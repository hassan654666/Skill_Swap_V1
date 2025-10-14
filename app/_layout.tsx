import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import * as Linking from 'expo-linking';
//import { Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
//import { useNavigation } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Profile from './Profile';
import Inbox from './(tabs)/Inbox';
//import { NotificationHandler } from '@/utils/notificationHandler';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { UserProvider } from '@/components/UserContext';
//import { useFCMPushNotifications } from '@/hooks/useFCMPushNotifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  usePushNotifications();
  console.log('Push Notifications Hook initialized');
  //useFCMPushNotifications();

  // useEffect(() => {
  //   NotificationHandler.init();
  // }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log('RootLayoutNav rendered');
  const colorScheme = useColorScheme();

  //const navigation = useNavigation();
  // const linking = {
  //   prefixes: [Linking.createURL('/'), 'skillswap://'],
  //   config: {
  //     screens: {
  //       '(tabs)': {
  //         path: '',
  //         screens: {
  //           Home: 'Home',
  //           LoginPage: 'LoginPage',
  //           Signup: 'Signup',
  //           ForgotPassword: 'ForgotPassword',
  //           ResetPassword: 'ResetPassword/:email',
  //           SkillSwap: 'SkillSwap',
  //           Schedule: 'Schedule',
  //           Profile: 'Profile',
  //           EditProfile: 'EditProfile',
  //           Inbox: 'Inbox',
  //           ChatScreen: 'ChatScreen/:receiverId/:chatId',
  //         },
  //       },
  //       modal: 'modal',
  //     },
  //   },
  // };

  return (
    
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> */}
      {/* <Stack linking={linking} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> */}
        <UserProvider>
          {/* <Stack initialRouteName={initialRoute}> */}
          <Stack initialRouteName='(tabs)'>

            <Stack.Screen name="Loading" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            
            <Stack.Screen name="Login" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="Signup" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="ForgotPassword" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            
            <Stack.Screen name='Profile' options={{ headerShown: false }} />
            <Stack.Screen name='UserProfile' options={{ headerShown: false }} />
            <Stack.Screen name='Chat' options={{ headerShown: false }} />
            <Stack.Screen name='EditProfile' options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            
            
          </Stack>
        </UserProvider>
      {/* </NavigationContainer> */}
    </ThemeProvider>
  );
}
