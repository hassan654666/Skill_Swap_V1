import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { Image, TouchableOpacity, Alert } from 'react-native';
import { expo } from '@/app.json';
import { Text } from '@react-navigation/elements';
import * as WebBrowser from "expo-web-browser";
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton() {
  const clientId = Constants.expoConfig?.extra?.googleAuthWebClientId;

  function extractParamsFromUrl(url: string) {
    const parsedUrl = new URL(url);
    const hash = parsedUrl.hash.substring(1); // Remove the leading '#'
    const params = new URLSearchParams(hash);

    return {
      access_token: params.get("access_token"),
      expires_in: parseInt(params.get("expires_in") || "0"),
      refresh_token: params.get("refresh_token"),
      token_type: params.get("token_type"),
      provider_token: params.get("provider_token"),
      code: params.get("code"),
    };
  };

  async function onSignInButtonPress() {
    try {
      // 1. Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Ensure this URL is added to your Supabase Dashboard -> Auth -> URL Configuration -> Redirect URLs
          redirectTo: `${expo.scheme}://Home`, 
          queryParams: { 
            access_type: 'offline',
            prompt: 'consent',
            // client_id is usually handled by Supabase config, but keeping it if your setup requires it
            client_id: clientId 
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const googleOAuthUrl = data?.url;
      if (!googleOAuthUrl) return;

      // 2. Open the browser
      const result = await WebBrowser.openAuthSessionAsync(
        googleOAuthUrl,
        `${expo.scheme}://Home`, // Must match the redirectTo above
        { 
          showInRecents: true,
        }
      );

      // 3. Handle the result
      if (result.type === "success" && result.url) {
        
        // Parse the URL to get the 'code' or 'tokens'
        const urlObj = new URL(result.url);
        const params = new URLSearchParams(urlObj.search);
        const code = params.get('code');

        if (code) {
          // SCENARIO A: PKCE Flow (Standard for Supabase v2)
          // We swap the code for a session
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
             console.error("Exchange Code Error:", sessionError);
             Alert.alert("Auth Error", sessionError.message);
             return;
          }
          WebBrowser.dismissAuthSession();
          console.log("Successfully signed in via PKCE!");
          
        } else {
          // SCENARIO B: Implicit Flow (Legacy or URL Fragment)
          // Fallback: Check hash if code wasn't in search params
          const hash = urlObj.hash.substring(1); 
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            WebBrowser.dismissAuthSession();
          } else {
            console.debug('onSignInButtonPress - openAuthSessionAsync - success');
            const params = extractParamsFromUrl(result.url);
            console.debug('onSignInButtonPress - openAuthSessionAsync - success', { params });

            if (params.access_token && params.refresh_token) {
              console.debug('onSignInButtonPress - setSession');
              const { data, error } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });
              WebBrowser.dismissAuthSession();
            }
          } 
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // Also dismiss if the user manually cancelled or dismissed the window
        WebBrowser.dismissAuthSession();
        console.log("Sign-in session cancelled or dismissed by user.");
      }
    } catch (err) {
      console.error("Google Sign In Error:", err);
    }
  }

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <TouchableOpacity
      onPress={onSignInButtonPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#dbdbdb',
        borderRadius: 4,
        paddingVertical: 10,
        paddingHorizontal: 15,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
        style={{ width: 24, height: 24, marginRight: 10 }}
      />
      <Text style={{ fontSize: 16, color: '#757575', fontWeight: '500' }}>
        Sign in with Google
      </Text>
    </TouchableOpacity>
  );
}