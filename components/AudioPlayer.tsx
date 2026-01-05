import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import Slider from "@react-native-community/slider";
import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");

// Global currently playing tracker to ensure only one audio plays at a time
// let currentlyPlayingSound: {
//   sound: Audio.Sound;
//   resetUI: () => void;
// } | null = null;

// Global currently playing tracker
let currentlyPlayingSound: {
  sound: Audio.Sound;
  pauseUI: () => void; // Changed from resetUI to pauseUI
} | null = null;

export default function AudioPlayer({
  url,
  DarkMode,
  Disabled,
}: {
  url: string;
  DarkMode: boolean;
  Disabled?: boolean;
}) {
  const sound = useRef(new Audio.Sound());
  const isSeekingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showPlayedDuration, setShowPlayedDuration] = useState(false);

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

  // Helper: Format milliseconds to mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Caching Logic: Downloads once and saves locally
  const getAudioSource = async (remoteUrl: string) => {
    try {
      const filename = remoteUrl.split("/").pop();
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      if (fileInfo.exists) {
        return localUri;
      } else {
        const download = await FileSystem.downloadAsync(remoteUrl, localUri);
        return download.uri;
      }
    } catch (e) {
      console.log("Caching error:", e);
      return remoteUrl; // Fallback to remote if cache fails
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    // Fix: Only update if not seeking and use Math.floor to prevent time jumping/flickering
    if (!isSeekingRef.current) {
      const roundedPosition = Math.floor(status.positionMillis / 1000) * 1000;
      setPosition(roundedPosition);
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setShowPlayedDuration(false);
      setPosition(0);
      sound.current.setPositionAsync(0);
      sound.current.pauseAsync();
    }
  };

  const playAudio = async () => {
    try {
      // Stop and reset any other audio currently playing
      if (currentlyPlayingSound && currentlyPlayingSound.sound !== sound.current) {
        // await currentlyPlayingSound.sound.stopAsync();
        // currentlyPlayingSound.resetUI();

        await currentlyPlayingSound.sound.pauseAsync();
        currentlyPlayingSound.pauseUI();
      }

      // currentlyPlayingSound = { 
      //   sound: sound.current, 
      //   resetUI: () => {
      //       setIsPlaying(false);
      //       setPosition(0);
      //       setShowPlayedDuration(false);
      //   } 
      // };

      currentlyPlayingSound = {
        sound: sound.current,
        pauseUI: () => {
          setIsPlaying(false);
          // We do NOT reset position or showPlayedDuration here
        },
      };

      const status = await sound.current.getStatusAsync();
      if (status.isLoaded) {
        await sound.current.playAsync();
        setIsPlaying(true);
        setShowPlayedDuration(true);
      }
    } catch (e) {
      console.log("Playback error:", e);
    }
  };

  const pauseAudio = async () => {
    await sound.current.pauseAsync();
    setIsPlaying(false);
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadAudio = async () => {
      try {
        const sourceUri = await getAudioSource(url);
        if (!isMounted) return;
        
        await sound.current.loadAsync(
          { uri: sourceUri }, 
          { 
            shouldPlay: false,
            // Fix: Force the engine to only report updates every 1 second
            progressUpdateIntervalMillis: 1000 
          }
        );

        sound.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        
        const status = await sound.current.getStatusAsync();
        if (status.isLoaded && isMounted) {
          setDuration(status.durationMillis || 0);
        }
      } catch (e) {
        console.log("Audio load error:", e);
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      // CRITICAL: If the sound being destroyed is the "currently playing" one,
      // we must clear the global reference so it doesn't crash on remount.
      if (currentlyPlayingSound?.sound === sound.current) {
        currentlyPlayingSound = null;
      }
      sound.current.unloadAsync();
    };
  }, [url]);

  return (
    <View style={{ padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center" }}>
      {/* Play/Pause Toggle */}
      <TouchableOpacity
        onPress={() => {
          if (Disabled) return;
          isPlaying ? pauseAudio() : playAudio();
        }}
      >
        <FontAwesome name={isPlaying ? "pause" : "play"} size={28} color={textColor} />
      </TouchableOpacity>

      <View style={{ flex: 1, marginHorizontal: 10 }}>
        {/* <Slider
          style={{ width: "100%", height: 40 }}
          value={position}
          minimumValue={0}
          maximumValue={duration}
          step={1000} // Fix: Thumb snaps to 1-second increments
          minimumTrackTintColor={textColor}
          maximumTrackTintColor={DarkMode ? "#444" : "#ccc"}
          thumbTintColor={textColor}
          onValueChange={(val) => {
            setIsSeeking(true);
            setPosition(val);
          }}
          onSlidingComplete={async (value) => {
            await sound.current.setPositionAsync(value);
            setIsSeeking(false);
            if (isPlaying) {
              await sound.current.playAsync();
            }
            setShowPlayedDuration(true);
          }}
        /> */}

        <Slider
          style={{ width: "100%", height: 40 }}
          value={position}
          minimumValue={0}
          maximumValue={duration}
          step={1000}
          minimumTrackTintColor={textColor}
          maximumTrackTintColor={textColor}
          thumbTintColor={textColor}
          // 1. When the user touches the slider
          onSlidingStart={() => {
            isSeekingRef.current = true;
            setIsSeeking(true);
          }}
          // 2. While sliding
          // onValueChange={(val) => {
          //   setPosition(val);
          // }}
          // 3. When released
          onSlidingComplete={async (value) => {
            try {
              // Set the position in the audio engine
              await sound.current.setPositionAsync(value);
              
              // Only after the engine confirms the move, we allow updates
              isSeekingRef.current = false;
              setIsSeeking(false);
              
              if (isPlaying) {
                await sound.current.playAsync();
              }
              setShowPlayedDuration(true);
            } catch (e) {
              console.log("Seek error:", e);
              isSeekingRef.current = false;
              setIsSeeking(false);
            }
          }}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: -10 }}>
          {/* Played duration only visible when active */}
          <Text style={{ color: textColor, fontSize: 12, opacity: showPlayedDuration ? 1 : 0 }}>
            {formatTime(position)}
          </Text>
          {/* Total Duration always visible */}
          <Text style={{ color: textColor, fontSize: 12 }}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}