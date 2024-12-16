import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from '@/components/useColorScheme';
import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import Home from './Home';  // Import all your screens for tabs
import LoginPage from './LoginPage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        initialRouteName="Home" // Set default tab screen
        screenOptions={{
          tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
            display: 'none',
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="LoginPage"
          component={LoginPage}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
          }}
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
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />
      </Tab.Navigator>
    </ThemeProvider>
  );
}
