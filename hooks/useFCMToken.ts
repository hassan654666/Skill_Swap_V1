// hooks/useFCMToken.ts
import { useState, useEffect } from "react";
import messaging from "@react-native-firebase/messaging";

export interface FCMNotificationState {
  fcmToken?: string;
}

export const useFCMToken = (): FCMNotificationState => {
  const [fcmToken, setFcmToken] = useState<string | undefined>();

  async function registerForFCM() {
    try {
      // Get the FCM token
      const token = await messaging().getToken();
      console.log("FCM Token:", token);
      return token;
    } catch (err) {
      console.error("Error getting FCM token:", err);
    }
  }

  useEffect(() => {
    registerForFCM().then((token) => {
      if (token) setFcmToken(token);
    });

    // Refresh token listener
    const unsubscribe = messaging().onTokenRefresh((token) => {
      console.log("FCM token refreshed:", token);
      setFcmToken(token);
    });

    return unsubscribe;
  }, []);

  return {
    fcmToken,
  };
};
