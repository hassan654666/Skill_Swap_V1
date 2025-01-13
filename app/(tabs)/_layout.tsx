import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '@/components/useColorScheme';
import { useState, useEffect } from 'react';
import { UserProvider } from '@/components/UserContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme, ThemeProvider, useFocusEffect } from '@react-navigation/native';
import SplashScreen from '@/components/SplashScreen';
import Home from './Home';
import LoginPage from './LoginPage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import SkillSwap from './SkillSwap'
import Schedule from './Schedule';
import Profile from './Profile';
import EditProfile from './EditProfile';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { color } from '@rneui/themed/dist/config';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function TabLayout() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true); 
  const [initialRoute, setInitialRoute] = useState<string>('LoginPage');
  const colorScheme = useColorScheme();

  const checkFirstLaunch = async () => {
    const hasLaunched = await AsyncStorage.getItem('hasLaunched');
    if (hasLaunched === null) {
      setIsFirstLaunch(true);
      await AsyncStorage.setItem('hasLaunched', 'true');
    } else {
      setIsFirstLaunch(false);
    }
    setLoading(false);
  };

  const checkSession = async () => {
    const asyncSession = await AsyncStorage.getItem('session');
    try {
      if (asyncSession) {
        setInitialRoute('HomePage');
      } else {
        setInitialRoute('LoginPage');
      }
    } catch (error) {
      console.error('Navigation Error:', error);
    }
    };
    useEffect(() => {
      checkFirstLaunch();
      checkSession();
    }, []);

  if (loading) {
    return null;
  }
  
  if (initialRoute === null) {
    return null;
  }

  if (isFirstLaunch === null) {
    return null;
  }

  if (isFirstLaunch) {
    return <SplashScreen onFinish={() => [setIsFirstLaunch(false), checkSession()]} />;
  }

  function HomeStack() {
    return (
      <Stack.Navigator
      initialRouteName='Home'
      screenOptions={{
        headerShown: false,
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
        headerShown: false,
        statusBarBackgroundColor: 'black',
        }}>
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Forgot Password" component={ForgotPassword} />
      </Stack.Navigator>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    <UserProvider>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen
          name="HomePage"
          component={HomeStack}
        />
        <Stack.Screen 
        name="LoginPage" 
        component={LoginStack} 
        />
      </Stack.Navigator>
    </UserProvider>
  </ThemeProvider>
  );
}
