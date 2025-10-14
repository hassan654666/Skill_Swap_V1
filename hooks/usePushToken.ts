// hooks/usePushNotifications.ts (simplified)
import { useState, useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
}

export const usePushToken = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();

  async function registerForPushNotificationsAsync() {
    let token;
    
    if (Device.isDevice) {

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });
      
    } else {
      console.log("Must be using a physical device for saving Push tokens");
      alert("Must be using a physical device for saving Push tokens");
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });
  }, []);

  return {
    expoPushToken,
  };
};