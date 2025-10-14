import { useEffect } from "react";
//import { usePushNotifications } from "@/hooks/usePushNotification"; 
import { supabase } from "@/lib/supabase";

// Custom hook that saves the push token whenever it changes
export async function savePushToken(userId: string | undefined, token: any | undefined) {
  //const { expoPushToken } = usePushNotifications();

  // useEffect(() => {
    //alert("Push token: " + expoPushToken?.data);
    console.log("Saving push token for user:", userId);
    console.log("Push token: ", token?.data);
    // alert("UserId: " + userId + " Push token: " + token?.data);

    if (!userId || !token?.data) return;

    const { data: profile } = await supabase.from('profiles').select('expo_token').eq('id', userId).single();
    if (profile?.expo_token === token) return; // nothing to do

    // async function saveToken() {
      const { error } = await supabase
        .from("profiles")
        .update({ expo_token: token?.data })
        .eq("id", userId);

      if (error) console.error("Error saving token:", error);
      else console.log("Saved push token:", token?.data);
    }

//     saveToken();
//   }, [userId, token]);

// }
