import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Animated, Easing } from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { te } from "date-fns/locale";

let currentlyPlayingSound: Audio.Sound | null = null; // prevent multiple audio playing

export default function AudioPlayer({ url, DarkMode, Disabled }: { url: string; DarkMode: boolean; Disabled?: boolean }) {
  const sound = useRef(new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // 🔥 Progress animation — left ➝ right
  const animateProgress = () => {
    progressAnim.setValue(-100); // start from left side OFF-screen
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const resumeProgress = (positionMs: number, durationMs: number) => {
    const progress = positionMs / durationMs;
    progressAnim.setValue(-100 + progress * 100);

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: durationMs - positionMs,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const playAudio = async () => {
    try {
      // 🔥 Ensure no other audio plays simultaneously
      if (currentlyPlayingSound && currentlyPlayingSound !== sound.current) {
        await currentlyPlayingSound.stopAsync();
        await currentlyPlayingSound.unloadAsync();
      }

      currentlyPlayingSound = sound.current;

      const status: any = await sound.current.getStatusAsync();

      if (status.isLoaded) {
        if (status.positionMillis >= status.durationMillis) {
          // If audio had finished → restart from beginning
          await sound.current.setPositionAsync(0);
        }
        // Otherwise → resume from current position
        await sound.current.playAsync();

        resumeProgress(status.positionMillis, status.durationMillis);

        setIsPlaying(true);
        return;
      }


      await sound.current.loadAsync(
        { uri: url },
        { shouldPlay: true, isLooping: false }
      );

      const newStatus : any = await sound.current.getStatusAsync();
      setDuration(newStatus.durationMillis);

      animateProgress();
      setIsPlaying(true);

      sound.current.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis);

        // 🔥 STOP when finished (no looping)
        if (status.didJustFinish) {
          setIsPlaying(false);
          progressAnim.stopAnimation();
        }
      });
    } catch (e) {
      console.log("Audio error:", e);
    }
  };

  const stopAudio = async () => {
    await sound.current.pauseAsync();
    setIsPlaying(false);
    progressAnim.stopAnimation();
  };

  useEffect(() => {
    return () => {
      sound.current.unloadAsync();
    };
  }, []);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Play / Pause button */}
      <TouchableOpacity onPress={() => { if (Disabled) return; isPlaying ? stopAudio() : playAudio(); }}>
        <FontAwesome
          name={isPlaying ? "pause" : "play"}
          size={28}
          color={textColor}
        />
      </TouchableOpacity>

      {/* Slider */}
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Slider
          value={position}
          minimumValue={0}
          maximumValue={duration}
          minimumTrackTintColor={textColor}
          maximumTrackTintColor={textColor}
          thumbTintColor={textColor}
          onSlidingComplete={async (value) => {
            await sound.current.setPositionAsync(value);
          }}
        />
      </View>

      {/* Progress animation bar */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          width: "100%",
          // backgroundColor: buttonColor,
          transform: [
            {
              translateX: progressAnim.interpolate({
                inputRange: [-100, 0],
                outputRange: [-200, 0], // smooth left → right
              }),
            },
          ],
        }}
      />
    </View>
  );
}
