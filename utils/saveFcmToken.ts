import { useEffect } from "react";
//import { usePushNotifications } from "@/hooks/usePushNotification"; 
import { supabase } from "@/lib/supabase";

// Custom hook that saves the push token whenever it changes
export async function saveFcmToken(userId: string | undefined, token: any | undefined) {
  //const { expoPushToken } = usePushNotifications();

  // useEffect(() => {
    //alert("Push token: " + expoPushToken?.data);
    console.log("Saving push token for user:", userId);
    console.log("Push token: ", token);
    // alert("UserId: " + userId + " Push token: " + token?.data);

    if (!userId || !token) return;

    const { data: profile } = await supabase.from('profiles').select('fcm_token').eq('id', userId).single();
    if (profile?.fcm_token === token) return; // nothing to do

    // async function saveToken() {
      const { error } = await supabase
        .from("profiles")
        .update({ fcm_token: token })
        .eq("id", userId);

      if (error) console.error("Error saving token:", error);
      else console.log("Saved fcm push token:", token);
    }
  //   saveToken();
  // }, [userId, token]);

// }
