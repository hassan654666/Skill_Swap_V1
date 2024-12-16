import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';



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
  const colorScheme = useColorScheme();
  const navigation = useNavigation(); // Correct usage of useNavigation
  const linking = {
    prefixes: ['skillswap://'],
    config: {
      screens: {
        '(tabs)': {
          screens: {
            Home: 'Home',
            LoginPage: 'LoginPage',
            Signup: 'Signup',
            ForgotPassword: 'ForgotPassword',
            ResetPassword: 'ResetPassword',
          },
        },
        modal: 'modal',
      },
    },
  };

  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      const { url } = event;
      if (url?.startsWith('skillswap://Home')) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Failed to retrieve session:', error.message);
          return;
        }
        console.log('Session retrieved:', data.session);
        navigation.navigate('Home');// Redirect to your home screen logic here
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    return () => Linking.removeEventListener('url', handleDeepLink);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack linking={linking}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
