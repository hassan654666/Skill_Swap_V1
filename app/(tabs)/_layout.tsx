import { Tabs, usePathname } from "expo-router";
import * as Linking from "expo-linking";
import { useColorScheme } from "@/components/useColorScheme";
import { useState, useEffect } from "react";
import { UserProvider, useUserContext } from "@/components/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DefaultTheme,
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { View, Text } from "react-native";
import Loading from "../Loading";
import SplashScreen from "@/components/SplashScreen";
import { Tab } from "@rneui/base";
import ResetPassword from "../ResetPassword";

export default function TabLayout() {
  console.log("tabs layout rendered");
  const { userData, unreadCount, isRecovery } = useUserContext();
  const pathname = usePathname();

  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  //const [initialRoute, setInitialRoute] = useState<string>("Home");
  //const colorScheme = useColorScheme();

  // 🔹 Check if app is first launch
  const checkFirstLaunch = async () => {
    const hasLaunched = await AsyncStorage.getItem("hasLaunched");
    if (hasLaunched === null) {
      setIsFirstLaunch(true);
      await AsyncStorage.setItem("hasLaunched", "true");
    } else {
      setIsFirstLaunch(false);
    }
    setLoading(false);
  };

  // 🔹 Check if a user session exists
  // const checkSession = async () => {
  //   const asyncSession = await AsyncStorage.getItem("session");
  //   try {
  //     setInitialRoute(asyncSession ? "Home" : "Login");
  //   } catch (error) {
  //     console.error("Navigation Error:", error);
  //   }
  // };

  useEffect(() => {
    const initializeApp = async () => {
      await checkFirstLaunch();
      //await checkSession();
    };
    initializeApp();
  }, []);

  if (loading || isFirstLaunch === null) {
    return null;
  }

  if (isFirstLaunch) {
    return (
      <SplashScreen
        onFinish={() => {
          setIsFirstLaunch(false);
          //checkSession();
        }}
      />
    );
  }

  if (isRecovery) {
    return <ResetPassword />
  }

  if (!userData) {
    return <Loading /> // or null
  }

  if(userData?.is_admin){
    console.log("Admin has logged in");
  }

  return (
    <Tabs initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: "rgba(0, 0, 0, 1)",
        tabBarInactiveBackgroundColor: "rgba(0, 0, 0, 1)",
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="suitcase" size={size} color={color} />
          ),
          //tabBarButton: userData?.is_admin ? undefined : () => null,
          href: null,
        }}
      />
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <View>
              <FontAwesome name="comments" size={size} color={color} />
              {unreadCount > 0 && pathname !== "/Inbox" && (
                <View
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -3,
                    backgroundColor: "red",
                    borderRadius: 12,
                    minWidth: 20,
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Courses"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="SkillSwap"
        options={{
          title: "Skill Swap",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="exchange" size={size} color={color} />
          ),
          href: null, tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="Notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bell" size={size} color={color} />
          ),
        }}
      />

      {/* 🚫 Hidden from Tab Bar */}
      <Tabs.Screen name="index" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      <Tabs.Screen name="two" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      {/* <Tabs.Screen name="Login" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      <Tabs.Screen name="Signup" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      <Tabs.Screen name="ForgotPassword" options={{ href: null, tabBarStyle: { display: "none" }, }} /> */}
      {/* <Tabs.Screen name="ResetPassword" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      <Tabs.Screen name="EditProfile" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      <Tabs.Screen name="Chat" options={{ href: null, tabBarStyle: { display: "none" }, }} />
      <Tabs.Screen name="UserProfile" options={{ href: null, tabBarStyle: { display: "none" }, }} /> */}
    </Tabs>
  );
}
