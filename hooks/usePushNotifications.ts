import { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform, AppState, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router, usePathname, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
// import { useUserContext } from "@/components/UserContext";

export interface PushNotificationState {
  notification?: Notifications.Notification;
  fcmNotification?: any;
}

// ✅ Safely require Firebase Messaging and Notifee at runtime
let messaging: any = null;
let notifee: any = null;
let AndroidImportance: any = null;

try {
  const messagingModule = require("@react-native-firebase/messaging");
  messaging = messagingModule.default;
} catch (e) {
  console.log("Firebase Messaging not available in this environment");
}

try {
  const notifeeModule = require("@notifee/react-native");
  notifee = notifeeModule.default;
  AndroidImportance = notifeeModule.AndroidImportance;
} catch (e) {
  console.log("Notifee not available in this environment");
}

export const usePushNotifications = (): PushNotificationState => {
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [fcmNotification, setFcmNotification] = useState<any>(undefined);

  // const { userData } = useUserContext();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const fcmMessageListener = useRef<any>();
  const fcmNotificationOpenedListener = useRef<any>();
  const appState = useRef(AppState.currentState);
  const pathname = usePathname();
  const searchParams = useLocalSearchParams<{ chatId?: string; receiverId?: string }>();
  //const route = useRoute<any>();
  const isRedirecting = useRef(false);
  const redirectingChat = useRef<string | null>(null);
  const navigation = useNavigation<any>();

  const pathnameRef = useRef(pathname);
  const paramsRef = useRef(searchParams);

  useEffect(() => {
    pathnameRef.current = pathname;
    paramsRef.current = searchParams;
  }, [pathname, searchParams]);

  // Configure notification handling
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Register + permissions
  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.log("Must be using a physical device for push notifications");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push notification permissions");
      return;
    }

    // Android channel
    if (Platform.OS === "android" && notifee && AndroidImportance) {
      await notifee.createChannel({
        id: "default",
        name: "Default Channel",
        importance: AndroidImportance.HIGH,
      });
    }

    // Request FCM permissions if available
    if (messaging) {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
        if (enabled) {
          console.log('FCM Authorization status:', authStatus);
        }
      } catch (error) {
        console.log("FCM permission error:", error);
      }
    }
  }

  // Clear all notifications
  async function clearAllNotifications() {
    if (notifee) {
      await notifee.cancelAllNotifications();
    }
    await Notifications.dismissAllNotificationsAsync();
  }

  // Dismiss all previous notifications for a chat
  async function dismissChatNotifications(Id: string) {
    if (!Id) return;

    if (Notifications) {
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const n of presented) {
        if (n.request.content.data?.chat_Id === Id || n.request.identifier === Id) {
          await Notifications.dismissNotificationAsync(n.request.identifier);
        }
      }
      
    } else if (notifee.cancelNotification) {
      await notifee.cancelNotification(Id);
      await notifee.cancelDisplayedNotifications({ tag: Id });
    }
  }

  // Mark messages as read in Supabase
  async function markMessagesAsRead(chatId: string, receiverId: string) {
    if (!chatId || !receiverId) return;
    await supabase
      .from("Messages")
      .update({ read: true })
      .eq("chat_Id", chatId)
      .eq("receiver_id", receiverId)
      .eq("read", false);
  }

  // Display a notification using available methods
  const displayNotification = async (
    id: string, 
    title: string, 
    body: string, 
    data: any
  ): Promise<void> => {
    try {
      if (Notifications) {
        // Using Expo Notifications
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title,
            body,
            data: {
              ...data,
              local: true, // 👈 mark local
            },
            sound: true,
            badge: 1,
          },
          trigger: null,
        });
        
      } else if (notifee?.displayNotification) {
        // Fallback to Notifee Notifications
        await notifee.displayNotification({
          id: id,
          title,
          body,
          data: {
            ...data,
            local: true, // 👈 mark local
          },
          android: {
            channelId: "default",
            smallIcon: "ic_launcher",
            tag: data.chat_Id || id,
            pressAction: { id: "default" },
          },
          ios: {
            sound: "default",
            badge: 1,
          },
        });
        
      }
    } catch (error) {
      console.error("Error displaying notification:", error);
    }
  };

  // Listen for navigation transitions finishing
  useEffect(() => {
    // const unsubscribe = navigation.addListener("transitionEnd", () => {
    //   isRedirecting.current = false;
    // });

    const unsubscribe = navigation.addListener("transitionEnd", () => {
      redirectingChat.current = null;
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync();

    // Handle notification redirect/navigation
    async function redirect(notificationData: any) {
      //if (!notificationData || isRedirecting.current) return;
      //if (!notificationData) return;
      const notifChatId = notificationData?.chat_Id;
      //if (!notifChatId || redirectingChat.current === notifChatId) return;

      //isRedirecting.current = true;
      redirectingChat.current = notifChatId;

      //const screen = notificationData?.screen;
      const url = notificationData?.url;
      const chatId = notificationData?.chat_Id;
      const receiverId = notificationData?.receiver_id;
      const senderId = notificationData?.sender_id;
      const meetingId = notificationData?.meeting_id;

      console.log("Redirecting with data:", notificationData);

      try {
        if (url) {
          const currentChatId = paramsRef.current?.chatId ?? null;
          const currentReceiverId = paramsRef.current?.receiverId ?? null;

        // 🚫 Suppress notification if we’re already in this exact chat
        //const activePath = pathname;
          if (pathnameRef.current === "/Chat" || pathnameRef.current.toLowerCase() === "/chat") {
            if((currentChatId && currentChatId !== chatId) || (currentReceiverId && currentReceiverId !== senderId)) {
              router.replace(url); // overwrite existing chat
            }
          } else {
            router.push(url);    // normal navigation
          }
        }

        if (chatId && receiverId) {
          markMessagesAsRead(chatId, receiverId);
          dismissChatNotifications(chatId);
          //await clearAllNotifications();
        }

        // if (meetingId !== '' && meetingId != null) {
        //   const { data: schedule, error: scheduleError } = await supabase
        //   .from("schedules")
        //   .select("*")
        //   .eq("meeting_id", meetingId)
        //   .single()
        //   if(scheduleError) console.error('Error fetching schedule: ', scheduleError);

        //   const updatedjoined = Array.isArray(schedule?.joined)
        //     ? [...new Set([...schedule.joined, userData?.id])]
        //     : [userData?.id];

        //   const { data: sched, error: schedError } = await supabase
        //   .from("schedules")
        //   .update({ joined:  updatedjoined})
        //   .eq("meeting_id", schedule.meeting_id)
        //   .single()
        //   if(schedError) console.error('Error marking meeting joined: ', schedError);
        // }
        
      } catch (redirectingError) {
        // Reset redirecting flag
        //setTimeout(() => {
          //isRedirecting.current = false;
          redirectingChat.current = null;
        //}, 300);
      // } finally {
      //   redirectingChat.current = null;
      }
    };

    // Listen to app state changes
    const appStateSubscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground
        // Check for any pending notifications
        if (messaging) {
          messaging().getInitialNotification().then((remoteMessage: any) => {
            if (remoteMessage && isMounted) {
              console.log('App opened from quit state by FCM notification:', remoteMessage);
              setTimeout(() => {
                const data = remoteMessage.data || {};
                redirect(data);
              }, 500);
            }
          });
        }
      }
      appState.current = nextAppState;
    });

    // Handle Expo notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (n) => {
        if (!isMounted) return;
        
        setNotification(n);
        const data = n.request.content.data || {};
        const chatId = data.chat_Id as string;
        const title = n.request.content.title || "New message";
        const body = n.request.content.body || "";
        const receiverId = data.receiver_id as string;
        const senderId = data.sender_id as string;

        // 🚫 Suppress if already viewing this chat
        const currentChatId = paramsRef.current?.chatId ?? null; 
        const currentReceiverId = paramsRef.current?.receiverId ?? null;

        // 🚫 Suppress notification if we’re already in this exact chat
        if (pathnameRef.current === "/Chat" || pathnameRef.current.toLowerCase() === "/chat") {
          if ((currentChatId && currentChatId === chatId) || (currentReceiverId && currentReceiverId === senderId)) {
            return;
          }
        }

        // Already handled locally
        if (data.local) {
          return; 
        }

        // Clear previous before showing new
        if (chatId) {
          dismissChatNotifications(chatId);
        }

        // Display the notification
        await displayNotification(chatId, title, body, {
          ...data,
          playSound: true,
          badge: 1
        });
      });

    // Handle Expo notification responses (background/foreground taps)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (!isMounted) return;
        setTimeout(() => {
          const data = response.notification.request.content.data || {};
          redirect(data);
        }, 500);
      });

    // Handle FCM messages if Firebase Messaging is available
    if (messaging) {
      // FCM: Handle messages in foreground
      fcmMessageListener.current = messaging().onMessage(async (remoteMessage: any) => {
        if (!isMounted) return;
        
        setFcmNotification(remoteMessage);
        console.log('FCM Message in foreground:', remoteMessage);
        
        const data = remoteMessage.data || {};
        const notification = remoteMessage.notification || {};
        const chatId = data.chat_Id;
        const title = notification.title || "New message";
        const body = notification.body || "";
        const receiverId = data.receiver_id;
        const senderId = data.sender_id;
        
        // 🚫 Suppress if already viewing this chat
        const currentChatId = paramsRef.current?.chatId ?? null; 
        const currentReceiverId = paramsRef.current?.receiverId ?? null;

        // 🚫 Suppress notification if we’re already in this exact chat
        if (pathnameRef.current === "/Chat" || pathnameRef.current.toLowerCase() === "/chat") {
          if ((currentChatId && currentChatId === chatId) || (currentReceiverId && currentReceiverId === senderId)) {
            return;
          }
        }

        // Already handled locally
        if (data.local) {
          return; 
        }

        // Clear previous before showing new
        if (chatId) {
          dismissChatNotifications(chatId);
        }

        // Display the notification
        await displayNotification(chatId, title, body, {
          ...data,
          playSound: true,
          badge: 1
        });
      });

      // FCM: Handle notification opens from background state
      fcmNotificationOpenedListener.current = messaging().onNotificationOpenedApp(
        (remoteMessage: any) => {
          if (!isMounted || !remoteMessage) return;
          console.log('App opened from background by FCM notification:', remoteMessage);
          setTimeout(() => {
            const data = remoteMessage.data || {};
            redirect(data);
          }, 500);
        }
      );

      // FCM: Check if app was opened from quit state by a notification
      messaging().getInitialNotification().then((remoteMessage: any) => {
        if (!isMounted || !remoteMessage) return;
        console.log('App opened from quit state by FCM notification:', remoteMessage);
        setTimeout(() => {
          const data = remoteMessage.data || {};
          redirect(data);
        }, 300);
      });
    }

    // Handle notifications that opened the app from quit state (Expo)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) return;
      
      setTimeout(() => {
        const data = response.notification.request.content.data || {};
        redirect(data);
      }, 500);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      appStateSubscription.remove();
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      
      if (fcmMessageListener.current) {
        fcmMessageListener.current();
      }
      
      if (fcmNotificationOpenedListener.current) {
        fcmNotificationOpenedListener.current();
      }
    };
  }, []);

  return { notification, fcmNotification };
};