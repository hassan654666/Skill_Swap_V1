import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '@/components/useColorScheme';
import { useState, useEffect } from 'react';
import { UserProvider } from '@/components/UserContext';
//import { useUserContext } from '@/components/UserContext';
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
import Profile from './Profile';
import EditProfile from './EditProfile';
import FontAwesome from '@expo/vector-icons/FontAwesome';
//import React from 'react';
import { color } from '@rneui/themed/dist/config';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function TabLayout() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] = useState<string>('LoginPage');
  //const { session } = useUserContext();
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

    //setInitialRoute(session ? 'HomePage' : 'LoginPage');

    // const checkSession = async () => {
    //   const { data: { session } } = await supabase.auth.getSession();
    //     setInitialRoute(session ? 'HomePage' : 'LoginPage');
    // };

    checkFirstLaunch();
    //checkSession();
  }, []);
  
  if (initialRoute === null) {
    return null; // Render nothing until initial route is determined
  }

  // if (isFirstLaunch === null) {
  //   return null; // Wait for AsyncStorage and session check
  // }

  // if (isFirstLaunch) {
  //   return <SplashScreen onFinish={() => setIsFirstLaunch(false)} />;
  // }

  function HomeStack() {
    return (
      <Stack.Navigator
      initialRouteName='Home'
      screenOptions={{
        headerShown: false,
        //statusBarHidden: true,
        statusBarBackgroundColor: 'black',
        }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Edit Profile" component={EditProfile} />
        <Stack.Screen name="Reset Password" component={ResetPassword} />
        <Stack.Screen name="Skill Swap" component={SkillSwap} />
        <Stack.Screen name="Schedule" component={Schedule} />
      </Stack.Navigator>
    );
  }

  function LoginStack() {
    return (
      <Stack.Navigator
      initialRouteName='Login'
      screenOptions={{
        headerTransparent: true,
        headerShown: false,
        statusBarBackgroundColor: 'black',
        }}>
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Forgot Password" component={ForgotPassword} />
        {/* <Stack.Screen name="Reset Password" component={ResetPassword} /> */}
      </Stack.Navigator>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UserProvider>
        <Tab.Navigator
          initialRouteName= 'HomePage' // Set default tab screen
          screenOptions={{
            tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
            tabBarStyle: {
              //backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
              display: 'none',
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
              //flexDirection: 'row',
              justifyContent: 'space-around', // Evenly distribute icons  
              alignItems: 'stretch',
              alignContent: 'space-evenly',
              // margin: 5,
              //height: '6%',
              position: 'absolute',
              bottom: 0,

            },
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="HomePage"
            component={HomeStack}
            options={{
              tabBarIcon: ({ color }) => <FontAwesome name="home" size={30} color={color} />,
            }}
          />
          <Tab.Screen
            name="LoginPage"
            component={LoginStack}
            options={{
              //tabBarStyle: { display: 'none' }, // Hides tab bar on this screen
              //tabBarButton: () => null, // Completely hides the tab bar icon
              tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
              //tabBarIcon: () => null,
            }
          }
          />
        </Tab.Navigator>
      </UserProvider>
    </ThemeProvider>
  );
}
