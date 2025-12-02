// CreateCourseScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from 'base64-arraybuffer';
import { useRouter } from "expo-router";
import { useUserContext } from "@/components/UserContext";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker";

const { width, height } = Dimensions.get("window");
const BUCKET = "courses";

export default function UploadCourse() {
  const { userData, DarkMode, skills } = useUserContext();
  const router = useRouter();

  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const buttonTextColor = "#fff";

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState<null | { uri: string; name?: string }>(null);
  const [files, setFiles] = useState<Array<{ uri: string; name?: string; mimeType?: string }>>([]);
  const [loading, setLoading] = useState(false);

  // helpers
  const pickThumbnail = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photos.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setThumbnail({ uri: asset.uri, name: `thumb-${Date.now()}.jpg` });
      }
    } catch (err: any) {
      console.log("pickThumbnail err", err);
      Alert.alert("Error", "Could not pick thumbnail.");
    }
  };

  const addFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        multiple: true,
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', JSON.stringify(res, null, 2));

      if (res.canceled) {
        console.log('Document picker cancelled');
        return;
      }

      // Handle the new API structure with assets array
      if (res.assets && res.assets.length > 0) {
        const newFiles = res.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name || `file-${Date.now()}`,
          mimeType: asset.mimeType || "application/octet-stream",
          size: asset.size, // Optional: you can display file size too
        }));
        
        console.log('Adding new files:', newFiles);
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        // Fallback for older API structure (shouldn't happen with current Expo)
        console.log('No assets found in result');
        Alert.alert("Error", "No files were selected.");
      }
    } catch (err: any) {
      console.log("addFile err", err);
      Alert.alert("Error", "Could not pick file.");
    }
  };

  const removeFile = (index: number) => {
    const copy = [...files];
    copy.splice(index, 1);
    setFiles(copy);
  };

  // Fetch a blob from local uri (works on web too)
  const uriToBlob = async (uri: string): Promise<Uint8Array | Blob> => {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      return await response.blob();
    } else {
      // For RN, read file as base64 and convert to Uint8Array
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);
      return new Uint8Array(arrayBuffer);
    }
  };

  const uploadToStorage = async (data: Uint8Array | Blob, path: string, mimeType?: string) => {
    const { error } = await supabase.storage.from(BUCKET).upload(path, data, {
      contentType: mimeType || undefined,
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw error;

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a course title.");
      return;
    }

    if (files.length === 0) {
      Alert.alert("Validation", "Please add at least one file for the course.");
      return;
    }

    // price is optional (rule 3). convert to number if present
    const priceNumber = price ? Number(price) : 0;

    setLoading(true);

    try {
      if (!userData?.id) throw new Error("User not available. Please login.");

      // 1) Upload thumbnail if provided (one thumbnail only)
      let thumbnailUrl: string | null = null;
      if (thumbnail) {
        const ext = thumbnail.name?.split(".").pop() ?? "jpg";
        const thumbPath = `thumbnails/${userData.id}/${Date.now()}.${ext}`;
        const thumbBlob = await uriToBlob(thumbnail.uri);
        thumbnailUrl = await uploadToStorage(thumbBlob, thumbPath, "image/jpeg");
      }

      // 2) Upload all files (files[]), preserve order
      const uploadedFileUrls: string[] = [];
      const uploadedFileNames: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const safeName = f.name?.replace(/[^a-zA-Z0-9_.-]/g, "_") ?? `file-${i}-${Date.now()}`;
        const ext = safeName.split(".").pop() ?? "bin";
        const path = `courses/${userData.id}/${Date.now()}-${i}.${ext}`;

        console.log(`Uploading file ${i + 1}/${files.length}:`, safeName);
        
        const blob = await uriToBlob(f.uri);
        const url = await uploadToStorage(blob, path, f.mimeType || undefined);
        
        uploadedFileNames.push(safeName);
        uploadedFileUrls.push(url);
        
        console.log(`File ${i + 1} uploaded successfully:`, url);
      }

      // 3) Insert row into courses table
      const { data, error } = await supabase.from("courses").insert([
        {
          owner_id: userData.id,
          title: title.trim(),
          description: description.trim(),
          type: type,
          price: priceNumber,
          thumbnail_url: thumbnailUrl,
          file_name: uploadedFileNames,
          file_url: uploadedFileUrls,
          status: "pending", // created as pending for admin approval
        },
      ]).select();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Course created successfully:', data);

      Alert.alert("Success", "Course saved and sent for approval.");
      // optionally clear form
      setTitle("");
      setDescription("");
      setType("");
      setPrice("");
      setThumbnail(null);
      setFiles([]);
      router.back();
    } catch (err: any) {
      console.error("handleSave err", err);
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique types from skills table
  const uniqueTypes = [...new Set(skills.map((s: any) => s.type))];

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return "file-o";
    
    if (mimeType.startsWith('image/')) return 'file-image-o';
    if (mimeType.startsWith('video/')) return 'file-video-o';
    if (mimeType.startsWith('audio/')) return 'file-audio-o';
    if (mimeType.includes('pdf')) return 'file-pdf-o';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-o';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel-o';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'file-archive-o';
    
    return 'file-o';
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>
        <FontAwesome
          name="arrow-left"
          size={22}
          color={textColor}
          style={{ margin: 16 }}
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: textColor }]}>Create Course</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ width: "100%", padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.inputArea]}>
          <TextInput
            placeholder="Course title"
            placeholderTextColor={DarkMode ? "#AAA" : "#666"}
            style={[styles.input, { backgroundColor: inputColor, color: textColor }]}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={[styles.inputArea]}>
          <TextInput
            placeholder="Short description"
            placeholderTextColor={DarkMode ? "#AAA" : "#666"}
            multiline
            numberOfLines={4}
            style={[styles.textarea, { backgroundColor: inputColor, color: textColor }]}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={{ marginVertical: 8, width: "100%", backgroundColor: TertiaryBackgroundColor, borderRadius: 6, overflow: "hidden" }}>
          <Picker
              selectedValue={type}
              onValueChange={(value) => 
              setType(value)
              }
          >
              <Picker.Item label="Select Type" value={null}/>
              {uniqueTypes.map((type: any) => (
              <Picker.Item
                  key={type}
                  label={`${type}`}
                  value={type}
              />
              ))}
          </Picker>
        </View>

        <View style={[styles.inputArea, { backgroundColor: SecondaryBackgroundColor, flexDirection: "row", alignItems: "center", borderRadius: 12 }]}>
          <TextInput
            placeholder="Price (optional)"
            placeholderTextColor={DarkMode ? "#AAA" : "#666"}
            keyboardType="decimal-pad"
            style={[styles.inputSmall, { backgroundColor: inputColor, color: textColor }]}
            value={price}
            onChangeText={setPrice}
          />
          <Text style={{ marginLeft: 12, color: DarkMode ? "#AAA" : "#333" }}>USD (optional)</Text>
        </View>

        {/* Thumbnail */}
        <View style={{ marginVertical: 8 }}>
          <Text style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}>Thumbnail</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail.uri }} style={{ width: 100, height: 70, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 100, height: 70, borderRadius: 8, backgroundColor: TertiaryBackgroundColor, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: DarkMode ? "#AAA" : "#666" }}>No thumbnail</Text>
              </View>
            )}

            <TouchableOpacity onPress={pickThumbnail} style={[styles.button, { backgroundColor: buttonColor }]}>
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                {thumbnail ? "Change Thumbnail" : "Select Thumbnail"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Files multi-upload */}
        <View style={{ marginVertical: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: textColor, fontWeight: "600" }}>Files ({files.length})</Text>
            {files.length > 0 && (
              <TouchableOpacity onPress={() => setFiles([])}>
                <Text style={{ color: '#ff6b6b', fontSize: 12 }}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {files.map((f, idx) => (
              <View key={idx} style={[styles.fileChip, { backgroundColor: DarkMode ? "#484848" : "#e0e0e0" }]}>
                <View style={styles.fileIconContainer}>
                  <FontAwesome 
                    name={getFileIcon(f.mimeType)} 
                    size={24} 
                    color={DarkMode ? "#fff" : "#666"} 
                  />
                </View>
                <View style={styles.fileInfo}>
                  <Text 
                    style={{ color: textColor, fontSize: 12 }} 
                    numberOfLines={2}
                    ellipsizeMode="middle"
                  >
                    {f.name || f.uri.split("/").pop()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFile(idx)} style={styles.removeButton}>
                  <FontAwesome name="close" size={14} color={textColor} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={addFile} style={[styles.addFile, { backgroundColor: buttonColor }]}>
            <FontAwesome name="plus" size={16} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 8 }}>Add Files</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || files.length === 0}
            style={[styles.saveBtn, { 
              backgroundColor: loading ? "#777" : files.length === 0 ? "#999" : "#2b8a3e",
              opacity: files.length === 0 ? 0.6 : 1
            }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, { color: "#fff" }]}>
                {files.length === 0 ? 'Add files to continue' : 'Save Course (send for approval)'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  topbar: {
    width: "100%",
    height: height * 0.06,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "700" },
  inputArea: { marginVertical: 8, width: "100%" },
  input: {
    width: "95%",
    alignSelf: "center",
    borderRadius: 12,
    padding: 12,
  },
  textarea: {
    width: "95%",
    alignSelf: "center",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputSmall: {
    width: 140,
    borderRadius: 12,
    padding: 10,
  },
  button: {
    padding: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    width: width * 0.45,
    marginBottom: 8,
  },
  fileIconContainer: {
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
  },
  addFile: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    width: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});