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
import { supabase } from "../lib/supabase";
import { useUserContext } from "@/components/UserContext";
import { Video, ResizeMode } from "expo-av";
import Constants from "expo-constants";

const { width, height } = Dimensions.get("window");

export default function OpenCourse() {
  const { courseId } = useLocalSearchParams();
  const { userData, DarkMode, courses, allUsers, purchases, setPurchases } = useUserContext();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [owner, setOwner] = useState<any>();
  const [processing, setProcessing] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [docViewerVisible, setDocViewerVisible] = useState(false);

  // JazzCash
  const [paymentPayload, setPaymentPayload] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [html, setHtml] = useState<string>("");

  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [mediaPreviewUri, setMediaPreviewUri] = useState<string | null>(null);
  const [mediaPreviewType, setMediaPreviewType] = useState<"image" | "video" | null>(null);

  const { supabaseUrl, supabaseAnonKey, sdkKey } = Constants.expoConfig?.extra || {}; 
  
  const router = useRouter();

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

  function fectchAsyncCourse() {
    const openedCourse = courses.find((course: any) => (course?.id === courseId));
    setCourse(openedCourse);
    const courseOwner = allUsers.find((user: any) => user?.id === openedCourse?.owner_id);
    setOwner(courseOwner);
    setPurchased(Boolean(purchases.find((purchase: any) => purchase?.course_id === courseId && purchase?.user_id === userData?.id) || (courseOwner?.id === userData?.id) || false));
    // setPurchased(owner.id === userData.id);
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

  const checkPurchase = async () => {
    if (!userData?.id) return;

    const { data } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", userData.id)
      .eq("course_id", courseId)
      .maybeSingle();

    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

    const { data: owner } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", courseData?.owner_id)
      .maybeSingle();

    setOwner(owner);
    if (data) setPurchased(true);
    else checkOwner();
  };

  const checkOwner = async () => {
    if (!userData?.id) return;

    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("owner_id", userData.id)
      .eq("id", courseId)
      .maybeSingle();

    if (data) setPurchased(true);
  };

  useEffect(() => {
    fetchCourse();
    checkPurchase();
  }, [courseId]);

   const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
    if (!error) {
      setPurchases(data);
    }
  };

  // JazzCash payment
   const handlePurchase = async () => {
  const res =  await fetch("https://saxuhvcppykdazdfosae.supabase.co/functions/v1/create-jazzcash-payment", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
          },
      body: JSON.stringify({ amount: course?.price, userId: userData?.id, courseId: courseId }) // Rs 500
    }
  );

  const data = await res.json();
  console.log("JazzCash Payment Payload:", data);
  setPaymentPayload(data);
  setPaymentModalVisible(true);

  const { actionUrl, fields } = data;

  const html = `
  <!DOCTYPE html>
  <html>
    <body onload="document.forms[0].submit()">
      <form method="POST" action="${actionUrl}">
        ${Object.entries(fields)
          .map(
            ([key, value]) =>
              `<input type="hidden" name="${key}" value="${value}" />`
          )
          .join("")}
      </form>
    </body>
  </html>
  `;

  setHtml(html);

};

const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Show alert depending on status
      if (data.status === "success") {
        Alert.alert("Payment Successful", `Transaction ID: ${data.txn}`, [
          { text: "OK", onPress: () => {setPaymentModalVisible(false); fetchPurchases;} } // Close modal after user presses OK
        ]);
      } else {
        Alert.alert("Payment Failed", "Transaction failed or invalid", [
          { text: "OK", onPress: () => setPaymentModalVisible(false) }
        ]);
      }
    } catch (e) {
      Alert.alert("Payment Error", "Unexpected error occurred", [
        { text: "OK", onPress: () => setPaymentModalVisible(false) }
      ]);
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
          <Text style={[styles.title, { color: textColor }]}>View Course</Text>
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
        {(!purchased && course.price > 0) && (<Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 16, color: textColor }}>
          Price: {course.price > 0 ? `PKR ${course.price}` : "Free"}
        </Text>)}

        {/* Purchase button */}
        {(!purchased && course.price > 0) && (
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={processing}
            style={{
              backgroundColor: buttonColor,
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Buy Now
              </Text>
            )}
          </TouchableOpacity>
        )}

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
                  if(purchased || course.price === 0)
                  {setMediaPreviewUri(url);
                  setMediaPreviewType("video");
                  setMediaPreviewVisible(true);}
                  else Alert.alert("Locked", "Buy the course to access this file.");
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
                  opacity: purchased || course.price === 0 ? 1 : 0.4,
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
                    <FontAwesome
                    name={purchased || course.price === 0 ? "download" : "lock"}
                    size={20}
                    color={textColor}
                    />
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
                  opacity: purchased || course.price === 0 ? 1 : 0.4,
                }}
                onPress={() =>
                  purchased || course.price === 0
                    ? openFile(url)
                    : Alert.alert("Locked", "Buy the course to access this file.")
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
                <FontAwesome
                  name={purchased || course.price === 0 ? "download" : "lock"}
                  size={20}
                  color={textColor}
                />
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

        {/* ---------------- JAZZCASH MODAL ---------------- */}
      <Modal visible={paymentModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setPaymentModalVisible(false)}
            style={{ height: height * 0.06, padding: 0, justifyContent: "center", backgroundColor: backgroundColor }}
          >
            <Text style={{ width: "20%", height: "75%", justifyContent: "center", textAlign: "center", paddingVertical: height * 0.01, fontSize: 16, fontWeight: "bold", borderRadius: 10, color: buttonTextColor, backgroundColor: redButton }}>Cancel</Text>
          </TouchableOpacity>
          {paymentPayload && (
          <WebView
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            source={{ html }}
            // onNavigationStateChange={handleNavigation}
            onMessage={handleMessage} // capture postMessage
            // onError={(e) => console.log("WebView error", e.nativeEvent)}
            // onHttpError={(e) => console.log("HTTP error", e.nativeEvent)}
          />
          )}
        </SafeAreaView>
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
