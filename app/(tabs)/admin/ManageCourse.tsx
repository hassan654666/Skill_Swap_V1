import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Modal,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { WebView } from 'react-native-webview';
import * as WebBrowser from "expo-web-browser";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/components/UserContext";
import { Video, ResizeMode } from "expo-av";

const { width, height } = Dimensions.get("window");

export default function ManageCourse() {
  const { courseId } = useLocalSearchParams();
  const { userData, DarkMode, courses, allUsers, purchases } = useUserContext();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>();
  const [fileUrl, setFileUrl] = useState<string>('');
  const [docViewerVisible, setDocViewerVisible] = useState(false);

  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [mediaPreviewUri, setMediaPreviewUri] = useState<string | null>(null);
  const [mediaPreviewType, setMediaPreviewType] = useState<"image" | "video" | null>(null);
  
  const router = useRouter();

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

  function fectchAsyncCourse() {
    const openedCourse = courses.find((course: any) => (course?.id === courseId));
    setCourse(openedCourse);
    const courseOwner = allUsers.find((user: any) => user?.id === openedCourse?.owner_id);
    setOwner(courseOwner);
    // setPurchased(Boolean(purchases.find((purchase: any) => purchase?.course_id === courseId && purchase?.user_id === userData?.id) || (courseOwner?.id === userData?.id) || false));
    setLoading(false);
  }

  useEffect(() => {
    fectchAsyncCourse();
  }, [courseId]);

  // Fetch course + purchase status
  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error) {
      Alert.alert("Error", "Could not load course.");
    } else {
      setCourse(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const isPending = course?.status === "pending";
  const isApproved = course?.status === "approved";
  const isRejected = course?.status === "rejected";

  // -------------------------
    // APPROVE COURSE
    // -------------------------
    const approveCourse = async (id: string) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from("courses")
          .update({ status: "approved" })
          .eq("id", id);
  
        if (error) throw error;
  
        Alert.alert("Approved", "Course has been approved.");
        fetchCourse();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };
  
    // -------------------------
    // REJECT COURSE
    // -------------------------
    const rejectCourse = async (id: string) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from("courses")
          .update({ status: "rejected" })
          .eq("id", id);
  
        if (error) throw error;
  
        Alert.alert("Rejected", "Course has been rejected.");
        fetchCourse();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

  const getFileTypeFromUrl = (url: string) => {
    if (!url) return "";

    const path = url.split("?")[0]; // remove query parameters
    const cleanUrl = url.split("/").pop() || "";
    const ext = path.split(".").pop()?.toLowerCase();

    return ext || "";
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return "file-o";
    
    if (mimeType.includes('jpg') || mimeType.includes('png')) return 'file-image-o';
    if (mimeType.includes('mp4')) return 'file-video-o';
    if (mimeType.includes('m4a')) return 'file-audio-o';
    if (mimeType.includes('pdf')) return 'file-pdf-o';
    if (mimeType.includes('doc') || mimeType.includes('docx')) return 'file-word-o';
    if (mimeType.includes('xml') || mimeType.includes('xml')) return 'file-excel-o';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'file-archive-o';
    
    return 'file-o';
  };

  const openFile = async (url: string) => {
    const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    try{
    await WebBrowser.openBrowserAsync(googleViewerUrl);
    } catch {
    setFileUrl(googleViewerUrl);
    setDocViewerVisible(true);
    }
  };

  if (loading || !course) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: backgroundColor }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>
          <FontAwesome
              name="arrow-left"
              size={22}
              color={textColor}
              style={{ paddingHorizontal: 15 }}
              onPress={() => router.back()}
          />
          <Text style={[styles.title, { color: textColor }]}>Manage Course</Text>
          <View style={{ width: width * 0.08 }} ></View>
        </View>
    <ScrollView style={{ width: '100%', flex: 1, backgroundColor: backgroundColor }}>
      {/* Thumbnail */}
        <Image
          // source={{ uri: course.thumbnail_url  }}
          source={course?.thumbnail_url ? { uri: course?.thumbnail_url } : require('@/assets/images/icon.png')}
          style={{
            width: "100%",
            height: 220,
            resizeMode: "cover",
          }}
        />

      <View style={{ padding: 16 }}>
        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: "bold", color: textColor }}>
          {course.title}
        </Text>
        <Text style={{ color: textColor }}>
          By: {owner?.name}
        </Text>

        {/* Description */}
        <Text style={{ fontSize: 16, marginVertical: 12, color: textColor }}>
          {course.description}
        </Text>

        {/* Price */}
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 16, color: textColor }}>
          Price: {course.price > 0 ? `$${course.price}` : "Free"}
        </Text>

        {/* STATUS */}
        <Text
            style={{
            marginTop: 6,
            marginBottom: 10,
            color:
                isApproved
                ? "#00c851"
                : isRejected
                ? "#ff4444"
                : "#ffbb33",
            fontWeight: "bold",
            }}
        >
            Status: {course.status.toUpperCase()}
        </Text>

        {/* BUTTONS */}
        {isPending && (<View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
            disabled={!isPending}
            onPress={() => approveCourse(course.id)}
            style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            opacity: isPending ? 1 : 0.4,
            backgroundColor: buttonColor,
            alignItems: "center",
            }}
        >
            <Text style={{ color: buttonTextColor, fontWeight: "700" }}>
            Approve
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            disabled={!isPending}
            onPress={() => rejectCourse(course.id)}
            style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            opacity: isPending ? 1 : 0.4,
            backgroundColor: redButton,
            alignItems: "center",
            }}
        >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
            Reject
            </Text>
        </TouchableOpacity>
        </View>)}

        {/* Files */}
        <Text style={{ fontSize: 20, fontWeight: "600", color: textColor, marginBottom: 20 }}>
          Course Files
        </Text>

        {course.file_url?.map((url: string, i: number) => {
          const fileName = course.file_name?.[i] || `File ${i + 1}`;
          const fileType = getFileTypeFromUrl(url);
          return (
            <View key={i}>
              {(fileType === "mp4" || fileType === "mov" || fileType === "webm") ? (

                <TouchableOpacity onPress={() => {
                  {setMediaPreviewUri(url);
                  setMediaPreviewType("video");
                  setMediaPreviewVisible(true);}
                }}>
                  <View style={{ width: '100%', height: 150, position: "relative", justifyContent: "center", alignItems: "center" }}>
                    <Video source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: 8}} resizeMode={ResizeMode.COVER} />
                    <View
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: [{ translateX: -15 }, { translateY: -15 }],
                        backgroundColor: "rgba(0,0,0,0.5)",
                        padding: 15,
                        borderRadius: 25,
                      }}
                    >
                      <FontAwesome name="play" size={20} color="#fff" />
                    </View>
                  </View>
                  <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: DarkMode ? "#2e2e2e" : "#eee",
                  padding: 12,
                  borderRadius: 8,
                  marginVertical: 6,
                  }}>
                    <Text
                      style={{
                          marginLeft: 12,
                          color: textColor,
                          flex: 1,
                      }}
                    >
                    {fileName}
                    </Text>
                    
                  </View>
                </TouchableOpacity>
              ) : (
              <TouchableOpacity
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: DarkMode ? "#2e2e2e" : "#eee",
                  padding: 12,
                  borderRadius: 8,
                  marginVertical: 6,

                }}
                onPress={() =>
                  openFile(url)
                }
              >
                <FontAwesome name={getFileIcon(fileType)} size={20} color={textColor} />
                <Text
                  style={{
                    marginLeft: 12,
                    color: textColor,
                    flex: 1,
                  }}
                >
                  {fileName}
                </Text>
                
              </TouchableOpacity> )}
            </View>
          );
        })}

        {/* Media preview modal (images & videos) */}
        <Modal
          visible={mediaPreviewVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMediaPreviewVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              style={{ position: "absolute", top: 36, left: 18, zIndex: 30 }}
              onPress={() => setMediaPreviewVisible(false)}
            >
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
  
            {mediaPreviewType === "image" && mediaPreviewUri && (
              <Image source={{ uri: mediaPreviewUri }} style={{ width: "95%", height: "85%" }} resizeMode="contain" />
            )}
  
            {mediaPreviewType === "video" && mediaPreviewUri && (
              <Video
                source={{ uri: mediaPreviewUri }}
                useNativeControls
                shouldPlay
                resizeMode={ResizeMode.CONTAIN}
                style={{ width: '95%' , height: "95%" }}
              />
            )}
          </View>
        </Modal>

        <Modal visible={docViewerVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setDocViewerVisible(false)}
            style={{ padding: 10, backgroundColor: "#575757ff" }}
          >
            <Text style={{ color: "#fff" }}>Close</Text>
          </TouchableOpacity>

          <WebView 
            source={{ uri: fileUrl }} 
            style={{ flex: 1 }} 
             originWhitelist={['*']}
             javaScriptEnabled
             domStorageEnabled
          />
        </SafeAreaView>
      </Modal>
      
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: "center" },
  topbar: {
    width: "100%",
    height: height * 0.06,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700" 
},
})
