import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, AppState, BackHandler, ActivityIndicator, Alert} from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import * as ScreenOrientation from "expo-screen-orientation";
import { useUserContext } from "@/components/UserContext";
import { useRouter, useNavigation, useLocalSearchParams, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import { isLoading } from "expo-font";

const { width, height } = Dimensions.get("window");

export default function Meeting() {
  const { userData, DarkMode, setPipVisible, setPipUrl, setPartnerId } = useUserContext();
  const { partnerId, meetingId, password, Link } =
    useLocalSearchParams<{ meetingId?: string; partnerId?: string; password: string; Link?: string }>();

  const { supabaseUrl, supabaseAnonKey, sdkKey } = Constants.expoConfig?.extra || {}; 
  const [isMini, setIsMini] = useState(false);
  const [signature, setSignature] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const webViewRef = useRef<any>(null);
  const navigation = useNavigation<any>();
  const router = useRouter();
  const [screenDims, setScreenDims] = useState(Dimensions.get("window"));

   // 🎨 Color palette
  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
  const linkTextColor = DarkMode ? "#007bffff" : "#0040ffff";
  const buttonTextColor = "#fff";
  const bubbleOneColor = DarkMode ? '#183B4E' : '#3D90D7';
  const bubbleTwoColor = DarkMode ? '#015551' : '#1DCD9F';
  
    // 🔹 Get signature from generate-zoom-signature
    const getSignature = async () => {
      if (!meetingId) {
        Alert.alert("Error", "Create a meeting first.");
        return;
      }
  
      setLoading(true);
      try {
        const res = await fetch("https://saxuhvcppykdazdfosae.supabase.co/functions/v1/generate-zoom-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
            },
          body: JSON.stringify({
            meetingNumber: meetingId,
            role: 0, // 0 = attendee, 1 = host
          }),
        });
  
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Signature generation failed");
  
        setSignature(data.signature);
        // Alert.alert("Success", "Signature generated successfully!");
        setLoading(false);
      } catch (err: any) {
        console.error("❌ Signature error:", err);
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
        
      }
    };

    const backAction = () => {
      if(router.canGoBack()){
        setIsMini(true);
        setPipVisible(true);
        router.back();
      } else {
        setIsMini(true);
        setPipVisible(true);
        router.replace('/(tabs)/Home');
        //router.push('/Home');
      }
      //navigation.navigate('Inbox'); 
      return true; 
    };
  
    useFocusEffect(
      useCallback(() => {    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
      }, [])
    );

  // const zoomUrl = `https://hassan654666.github.io/Zoom-web-sdk/?meetingNumber=${meetingId}&signature=${encodeURIComponent(signature)}&sdkKey=${sdkKey}&password=${password}&name=${encodeURIComponent(userData.name || "Guest")}`;

  useEffect(() => {
    getSignature();
  },[]);

  useEffect(() => {
    if(meetingId && sdkKey && signature && password && !loading){
      const zoomUrl = `https://hassan654666.github.io/Zoom-web-sdk/?meetingNumber=${meetingId}&signature=${encodeURIComponent(signature)}&sdkKey=${sdkKey}&password=${password}&name=${encodeURIComponent(userData.name || "Guest")}`;
      // try{
      //   WebBrowser.openBrowserAsync(zoomUrl);
      // } catch {
      setPipUrl(zoomUrl);
      setPipVisible(true);
      setPartnerId(partnerId);
      // }
    }
  }, [signature])

  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignContent: 'center' }}>
      
      {loading ? (
        <View style={{backgroundColor: backgroundColor}}>
          <Text style={[styles.title, {color: textColor}]}>Getting signature...</Text>
          <ActivityIndicator size={'large'}/>
          </View>) : (
        <View style={{backgroundColor: backgroundColor}}>
          <Text style={[styles.title, {color: textColor}]}>Joining meeting...</Text>
          <ActivityIndicator size={'large'}/>
        </View> )}
    </View>
  );
}

const styles = StyleSheet.create({
  pipButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 6,
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 40 
  },
});
