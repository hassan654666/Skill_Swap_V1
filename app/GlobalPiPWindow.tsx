// GlobalPiPWindow.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dimensions, TouchableOpacity, Text, StyleSheet, BackHandler, AppState, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { WebView } from "react-native-webview";
import { useUserContext } from "@/components/UserContext";
import { useNavigation, useRouter, useFocusEffect, usePathname } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
// import PipHandler from "react-native-pip-android";
import { FontAwesome } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export const GlobalPiPWindow = ({ url, partnerId }: { url: string | null, partnerId: string | null }) => {
  const { setPipVisible } = useUserContext();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const pathname = usePathname();
  const [isMini, setIsMini] = useState(false);
  const [screenDims, setScreenDims] = useState(Dimensions.get("window"));
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDims(window);
    });
    return () => sub.remove();
  }, []);

  // useEffect(() => {
  //   const subscription = AppState.addEventListener("change", (nextState) => {
  //     if (nextState === "background") {
  //       // PipHandler.enterPipMode();
  //       console.log("App backgrounded, pip enabled");
  //     }
  //   });
  //   return () => subscription.remove();
  // }, []);

  useEffect(() => {
    ScreenOrientation.unlockAsync();

    const orientationSub = ScreenOrientation.addOrientationChangeListener(() => {
      if (!isMini) setIsMini(false);
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "background") setIsMini(true);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListeners();
      appStateSub.remove();
    };
  }, [isMini]);

  const style = useAnimatedStyle(() => ({
    width: withTiming(isMini ? screenDims.width * 0.45 : screenDims.width),
    height: withTiming(isMini ? screenDims.height * 0.16 : screenDims.height),
    position: "absolute",
    right: withTiming(isMini ? 10 : 0),
    bottom: withTiming(isMini ? 50 : 0),
    zIndex: 100,
    borderRadius: withTiming(isMini ? 12 : 0),
    overflow: "hidden",
    backgroundColor: "#000",
  }));

  const pipToggle = () => {
    if (!isMini) {
      setIsMini(true);
      if (pathname === "/Meeting") backAction();
    } else {
      setIsMini(false);
    }
    // return true;
  };

  const backAction = () => {
    setIsMini(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/Home");
    }
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => backHandler.remove();
    }, [])
  );

  // ✅ New close handler
  const handleCloseMeeting = () => {
    try {
      // Tell the WebView meeting to end/leave
      webViewRef.current?.postMessage(JSON.stringify({ action: "leaveMeeting" }));
    } catch (err) {
      console.warn("Failed to post leaveMeeting:", err);
    }
    // Exit PiP visually
    setIsMini(false);
    setPipVisible(false);

    // Optionally also leave Zoom meeting if native PiP was active
    // PipHandler.exitPipMode?.();

    // Return to Home or any fallback screen
    // router.replace("/(tabs)/Home");
  };

  if (!url) return null;

  return (
    <Animated.View style={[style, styles.shadow]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        source={{ uri: url }}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.join === "joinFailed") {
            setIsMini(false);
            setPipVisible(false);
          }
          if (data.action === "meetingEnded") {
            setIsMini(false);
            setPipVisible(false);
            router.push({ pathname: '/ReviewUser', params: { userId: partnerId } });
          }
          // if (data.pip === "entered") {
          //   PipHandler.enterPipMode();
          // }
        }}
      />

      {/* ✅ Buttons Overlay */}
      <View style={[styles.buttonContainer, {gap: screenDims.height * 0.09}]}>
        {isMini && (<TouchableOpacity style={[styles.btn, styles.closeBtn]} onPress={handleCloseMeeting}>
          <FontAwesome style={styles.btnText} name="close" size={40}></FontAwesome>
        </TouchableOpacity>)}
        <TouchableOpacity style={[styles.btn, styles.minBtn]} onPress={pipToggle}>
          {isMini ? (<FontAwesome style={styles.btnText} name= "expand" size={40}></FontAwesome>) : 
          (<FontAwesome style={styles.btnText} name= "compress" size={40}></FontAwesome>)}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    // top: height * 0,
    right: 0,
    // left: 0,
    flexDirection: "column",
    // gap: height * 0.1,
    justifyContent: 'space-between',
    padding: 10
  },
  btn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center'
  },
  minBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  closeBtn: {
    backgroundColor: "rgba(255,0,0,0.7)",
  },
  btnText: { color: "#fff", 
    fontSize: 12 
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
