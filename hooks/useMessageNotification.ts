// hooks/useMessageNotification.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserContext } from '@/components/UserContext';
import * as Notifications from 'expo-notifications';

// Utility to send push notifications using Expo
const sendPushNotification = async (expoToken: string, message: string) => {
  const payload = {
    to: expoToken,
    sound: 'default',
    title: 'New Message',
    body: message,
    data: { message },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Push notification error:', error);
  }
};

export const useMessageNotification = () => {
  const { userData } = useUserContext();

  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('messages_realtime_notification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Messages',
        },
        async (payload) => {
          const newMessage = payload.new;

          // Check if the current user is the receiver
          if (newMessage.receiver_id === userData.id) {
            // Fetch receiver's expo token
            const { data: receiverProfile, error } = await supabase
              .from('profiles')
              .select('expo_token')
              .eq('id', newMessage.receiver_id)
              .single();

            if (receiverProfile?.expo_token) {
              await sendPushNotification(receiverProfile.expo_token, newMessage.text);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);
};
