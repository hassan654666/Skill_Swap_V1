import { useEffect } from "react";
//import { usePushNotifications } from "@/hooks/usePushNotification"; 
import { supabase } from "@/lib/supabase";

// Custom hook that saves the push token whenever it changes
export async function removeFcmToken(userId: string | undefined) {
  //const { expoPushToken } = usePushNotifications();
 console.log("Removing Fcm token for user:", userId);
//  alert("Removing push token for user:" + userId);
  //useEffect(() => {
    //alert("Push token: " + expoPushToken?.data);
    //console.log("Push token: ", expoPushToken?.data);

    if (!userId) return;

    const { data: profile } = await supabase.from('profiles').select('fcm_token').eq('id', userId).single();
    if (profile?.fcm_token === null) return; // nothing to do

    //async function removeToken() {
      const { error } = await supabase
        .from("profiles")
        .update({ fcm_token: null })
        .eq("id", userId);

      if (error) console.error("Error removing token:", error);
      //else console.log("Removed push token:", expoPushToken?.data);
    //}

  //   removeToken();
  // }, [userId]);
}
