import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from '@/components/useColorScheme';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme, ThemeProvider, useFocusEffect } from '@react-navigation/native';
//import SplashScreen from './SplashScreen';
import Home from './Home';  // Import all your screens for tabs
import LoginPage from './LoginPage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import SkillSwap from './SkillSwap'
import Schedule from './Schedule';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] = useState<string>('LoginPage');
  const colorScheme = useColorScheme();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        setIsFirstLaunch(false);
      }
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
        setInitialRoute(session ? 'Home' : 'LoginPage');
    };

    checkFirstLaunch();
    checkSession();
  }, [initialRoute]);
  
  // useFocusEffect(
  //   React.useCallback(() => {
  //     // Code to run when the screen is focused
  //     const checkSession = async () => {
  //       const { data: { session } } = await supabase.auth.getSession();
  //         setInitialRoute(session ? 'Home' : 'LoginPage');
  //     };
  //     checkSession();
  //     // Cleanup function (optional)
  //   }, [])
  // );

  // if (isFirstLaunch === null) {
  //   return null; // Wait for AsyncStorage and session check
  // }

  // if (isFirstLaunch) {
  //   return <SplashScreen onFinish={() => setIsFirstLaunch(false)} />;
  // }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        initialRouteName={initialRoute} // Set default tab screen
        screenOptions={{
          tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
            display: 'none',
            //backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
            flexDirection: 'row',
            justifyContent: 'space-around', // Evenly distribute icons  
            alignItems: 'stretch',          
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="LoginPage"
          component={LoginPage}
          options={{
            //tabBarStyle: { display: 'none' }, // Hides tab bar on this screen
            //tabBarButton: () => null, // Completely hides the tab bar icon
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
          }
        }
        />
        <Tab.Screen
          name="Signup"
          component={Signup}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="plus" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="lock" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="ResetPassword"
          component={ResetPassword}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="key" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="SkillSwap"
          component={SkillSwap}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="plus" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Schedule"
          component={Schedule}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="map" size={24} color={color} />,
          }}
        />
      </Tab.Navigator>
    </ThemeProvider>
  );
}
