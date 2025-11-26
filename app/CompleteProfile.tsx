import React, { SetStateAction, useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import { View, Text, Image, Button, ScrollView, Alert, StyleSheet, TextInput, useColorScheme, TouchableOpacity, FlatList, Dimensions, Modal, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRouter} from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { color } from '@rneui/themed/dist/config';
import { FontAwesome } from '@expo/vector-icons';
import { he, th } from 'date-fns/locale';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get("window");

export default function CompleteProfile(){

  const { session, thisUser, userData, fetchSessionAndUserData, DarkMode } = useUserContext();

  const [user, setUser] = useState<any>(userData);

  const [name, setName] = useState('');
  const [username, setUserName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>();
  const [selectedHeaderImage, setSelectedHeaderImage] = useState<any>();

  // all skills from 'skills' table
  const [skillsList, setSkillsList] = useState<any[]>([]);
 
  // user's skills (persisted ones fetched from DB)
  const [offeredSkills, setOfferedSkills] = useState<any[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<any[]>([]);
 
  // IDs present in DB at load time (used to detect new items)
  const [originalOfferedIds, setOriginalOfferedIds] = useState<string[]>([]);
  const [originalRequiredIds, setOriginalRequiredIds] = useState<string[]>([]);
 
  // UI state
  const [activeTab, setActiveTab] = useState<"offered" | "required">("offered");
  const [showPicker, setShowPicker] = useState(false);
  const [saveActive, setSaveActive] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const [visible, setVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');

  const navigation = useNavigation<any>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  // const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? "#fff" : "#000";
  const backgroundColor = DarkMode ? "#1e1e1e" : "#ddddddff";
  const SecondaryBackgroundColor = DarkMode ? "#2e2e2e" : "#bdbdbdff";
  const TertiaryBackgroundColor = DarkMode ? "#484848ff" : "#ffffffff";
  const inputColor = DarkMode ? "#6c6c6cff" : "#EAEAEA";
  const buttonColor = DarkMode ? "#004187ff" : "#007BFF";
  const redButton = DarkMode ? "#dc3545" : "#ff0000ff"
  const buttonTextColor = "#fff";

  const checkSession = async () => {
    if (isFocused && session && !userData) {
      return;
    } 
    else {
      router.replace('/(tabs)/Home');
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkSession();
    }, [session])
  );

  const save = async () => {
    const profileUpdates: {
      name?: string;
      username?: string;
      email?: string;
      description?: string;
      skillsOffered?: string;
      skillsRequired?: string;
      authid?: string | null;
    } = {};
  
    const authUpdates: {
      data?: {
        full_name?: string;
        username?: string;
      };
    } = { data: {} };
  
    if (name) {
      profileUpdates.name = name;
      authUpdates.data!.full_name = name;
    }
    if (username) {
      profileUpdates.username = username;
      authUpdates.data!.username = username;
    }
    if (description) profileUpdates.description = description;
  
    if (Object.keys(profileUpdates).length === 0 && Object.keys(authUpdates.data!).length === 0 && selectedImage === undefined && selectedHeaderImage === undefined) {
      Alert.alert('Error', 'No fields to update!');
    //   navigation.navigate('Profile'); 
      return;
    }
  
    try {
 
      if (Object.keys(authUpdates.data!).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      profileUpdates.authid = thisUser?.id;
      profileUpdates.email = thisUser?.email;
  
      const { data: userData, error: profileError } = await supabase.from('profiles').upsert(profileUpdates).select().single();
      if (profileError) throw profileError;

      setUser(userData);

      if(selectedImage){
        await uploadImage(selectedImage);
      }

      if(selectedHeaderImage){
        await uploadHeaderImage(selectedHeaderImage);
      }

      await saveSkillsToDB(userData);
  
      Alert.alert('Success', 'Profile updated successfully!');
      fetchSessionAndUserData();
      router.replace('/(tabs)/Home'); 
    } catch (error: any) {
      console.error('Error saving profile:', error.message);
      Alert.alert('Error', error.message);
    }
  };

  const changePic = async () => {
        await pickImage();
  };

  const changeHeaderPic = async () => {
        await pickHeaderImage();
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      //base64: true,
    });

    if (!result.canceled) {
      //setSelectedImage(result.assets[0].uri);
      const image = result.assets[0].uri;
      //return image;
      setSelectedImage(image);
      //uploadImage(image);
      //console.log("image: ", selectedImage);
    }
  };  

  const pickHeaderImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 1],
      quality: 1,
      //base64: true,
    });

    if (!result.canceled) {
      //setSelectedImage(result.assets[0].uri);
      const image = result.assets[0].uri;
      //return image;
      setSelectedHeaderImage(image);
      //uploadImage(image);
      //console.log("image: ", selectedImage);
    }
  };  

  const uploadImage = async (theselectedImage: any) => {
    if (!theselectedImage) {
      Alert.alert('Please select an image first.');
      return;
    }

    try {

      const imagePath = `${thisUser?.id}.png`;

      const result = await fetch(theselectedImage);
      const blob = await result.blob();
      
      const file: any = {
        uri: theselectedImage,
        name: theselectedImage.split('/').pop(),
        type: typeof(theselectedImage),
      }

      const base64 = await FileSystem.readAsStringAsync(theselectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(imagePath, decode(base64), {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const publicUrl = supabase.storage
        .from('avatars')
        .getPublicUrl(imagePath).data.publicUrl;

      console.log('Public URL:', publicUrl);

      await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq("authid", thisUser?.id);

    } catch (error: any) {
      console.error('Upload failed:', error.message);
      Alert.alert('Image upload failed.');
    }
  };

  const uploadHeaderImage = async (theselectedHeaderImage: any) => {
    if (!theselectedHeaderImage) {
      Alert.alert('Please select an image first.');
      return;
    }

    try {

      const imagePath = `${thisUser?.id}.png`;

      const result = await fetch(theselectedHeaderImage);
      const blob = await result.blob();
      
      const file: any = {
        uri: theselectedHeaderImage,
        name: theselectedHeaderImage.split('/').pop(),
        type: typeof(theselectedHeaderImage),
      }

      const base64 = await FileSystem.readAsStringAsync(theselectedHeaderImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.storage
        .from('headers')
        .upload(imagePath, decode(base64), {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const publicUrl = supabase.storage
        .from('headers')
        .getPublicUrl(imagePath).data.publicUrl;

      console.log('Public URL:', publicUrl);

      await supabase
      .from('profiles')
      .update({ header_url: publicUrl })
      .eq("authid", thisUser?.id);

    } catch (error: any) {
      console.error('Upload failed:', error.message);
      Alert.alert('Image upload failed.');
    }
  };

    // ---------------------------
    // Fetch all skills from skills table
    // ---------------------------
    async function fetchSkillsFromDB() {
      try {
        const { data, error } = await supabase
          .from("skills")
          .select("id, name, type, description")
          .order("type", { ascending: true })
          .order("name", { ascending: true });
  
        if (error) {
          console.log("fetchSkillsFromDB error", error);
          return;
        }
        setSkillsList(data || []);
      } catch (err) {
        console.log("fetchSkillsFromDB catch", err);
      }
    }
  
    // ---------------------------
    // Fetch user's profile skills (join to skills table to get name & type)
    // ---------------------------
    async function fetchUserSkills() {
      if (!user?.id) return;
  
      try {
        /**
         * Select profile_skills rows for the user and include
         * the nested skills fields (id, name, type).
         */
        const { data, error }: any = await supabase
          .from("profile_skills")
          .select("category, skill_id, skills(id, name, type)")
          .eq("profile_id", user.id);
  
        if (error) {
          console.log("fetchUserSkills error", error);
          return;
        }
  
        // Build arrays with id,name,type
        const offered = data
          .filter((r: any) => r.category === "offered" && r.skills)
          .map((r: any) => ({ id: r.skills.id, name: r.skills.name, type: r.skills.type }));
  
        const required = data
          .filter((r: any) => r.category === "required" && r.skills)
          .map((r: any) => ({ id: r.skills.id, name: r.skills.name, type: r.skills.type }));
  
        setOfferedSkills(offered);
        setRequiredSkills(required);
  
        // Save original IDs so we know which ones are newly added locally later
        setOriginalOfferedIds(offered.map((s: any) => s.id));
        setOriginalRequiredIds(required.map((s: any) => s.id));
  
        // Clear save flag (we just loaded from server)
        setSaveActive(false);
      } catch (err) {
        console.log("fetchUserSkills catch", err);
      }
    }
  
    // ---------------------------
    // When user picks a skill from Picker:
    // - Immediately add it to the local list for the active tab (if not duplicate)
    // - Hide picker
    // - Enable save (because it's an unsaved addition)
    // ---------------------------
    function handlePickSkill(skillId: string | null) {
      // If user cancelled selection (null) do nothing
      if (!skillId) {
        setSelectedSkillId(null);
        return;
      }
  
      const skill = skillsList.find(s => s.id === skillId);
      if (!skill) {
        // guard against undefined entries
        setSelectedSkillId(null);
        return;
      }
  
      // Add to the appropriate local list (if not already present)
      if (activeTab === "offered") {
        if (!offeredSkills.some(s => s.id === skill.id)) {
          setOfferedSkills(prev => [...prev, { id: skill.id, name: skill.name, type: skill.type }]);
        }
      } else {
        if (!requiredSkills.some(s => s.id === skill.id)) {
          setRequiredSkills(prev => [...prev, { id: skill.id, name: skill.name, type: skill.type }]);
        }
      }
  
      // indicate there's unsaved changes
      setSaveActive(true);
  
      // reset selection state and hide picker (matches your requested flow)
      setSelectedSkillId(null);
      setShowPicker(false);
    }
  
    // ---------------------------
    // Save only NEW skills to profile_skills table
    // ---------------------------
    async function saveSkillsToDB(userData: any) {
      if (!userData?.id) {
        // Alert.alert("Error", "No user found.");
        return;
      }
  
      try {
        // compute new (not-yet-saved) skills by comparing to original IDs
        const newOffered = offeredSkills
          .filter(s => !originalOfferedIds.includes(s.id))
          .map(s => ({ profile_id: userData.id, skill_id: s.id, category: "offered" }));
  
        const newRequired = requiredSkills
          .filter(s => !originalRequiredIds.includes(s.id))
          .map(s => ({ profile_id: userData.id, skill_id: s.id, category: "required" }));
  
        const rowsToUpsert = [...newOffered, ...newRequired];
  
        if (rowsToUpsert.length === 0) {
          Alert.alert("Nothing to save", "No new skills to save.");
          setSaveActive(false);
          return;
        }
  
        // Upsert with onConflict on profile_id,skill_id
        const { error } = await supabase
          .from("profile_skills")
          .upsert(rowsToUpsert, { onConflict: "profile_id,skill_id" });
  
        if (error) {
          console.log("saveSkillsToDB error", error);
          Alert.alert("Error", error.message || "Could not save skills.");
          return;
        }
  
        // Reload user's skills from DB (will reset original IDs)
        await fetchUserSkills();
        // Alert.alert("Success", "Skills saved!");
      } catch (err: any) {
        console.log("saveSkillsToDB catch", err);
        Alert.alert("Error", err?.message || "Unknown error");
      } finally {
        setSaveActive(false);
        setSelectedSkillId(null);
        setShowPicker(false);
      }
    }

    // initial fetches
      useEffect(() => {
        fetchSkillsFromDB();
        if (!user?.id) return;
        fetchUserSkills();
      }, [user?.id]);

  const backAction = () => {
    if(router.canGoBack()){
    router.back();
    } else {
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

   useEffect(() => {
      if (!user?.id) return;
  
      const channel = supabase.channel('ProfileChannel');
  
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          // Fetch the updated user data
          fetchSessionAndUserData();
        }
      );
  
      channel.subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }, [user?.id]);
  
  console.log('Complete Profile rendered');

  return(
    <View style= {[styles.container, {backgroundColor: backgroundColor}]}>
      <View style= {[styles.topbar, {backgroundColor: backgroundColor}]}>
        {userData && (<TouchableOpacity style= { {margin: 10, marginLeft: 15} } onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>)}
      </View>

      {/* Header Image */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => {
            //setImageUri(userData?.header_url ? userData?.header_url : require('./Header.png'));
            setImageUri('header');
            setVisible(true);
        }}>
          <Image
            source={selectedHeaderImage? {uri: selectedHeaderImage } : user?.header_url? {uri: user?.header_url } : require('./Header.png')}
            style={styles.headerImage}
          />
          <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 50, }}>
              <FontAwesome name="pencil" size={16} color="white" onPress={changeHeaderPic} />
          </View>
        </Pressable>
        <Pressable  onPress={() => {
            //setImageUri(userData?.avatar_url ? userData?.avatar_url : require('./Avatar.png'));
            setImageUri('avatar');
            setVisible(true);
        }}>
          <Image
            source={selectedImage? {uri: selectedImage } : user?.avatar_url? {uri: user?.avatar_url } : require('./Avatar.png')}
            style={styles.avatar}
          />
          <View style={{ position: 'absolute', top: -5, left: 15, backgroundColor: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 50, }}>
              <FontAwesome name="pencil" size={16} color="white" onPress={changePic} />
          </View>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Close Modal by tapping anywhere */}
          <Pressable
            style={{
              position: "absolute",
              top: 20,
              left: 20,
            }}
            onPress={() => setVisible(false)}
          >
          <FontAwesome name="arrow-left" size={20} color="white" />
          </Pressable>

          {/* Image */}
          <Image
            // source={{ uri: imageUri }}
            source= {imageUri === 'header' ? (selectedHeaderImage? {uri: selectedHeaderImage } : user?.header_url? {uri: userData?.header_url } : require('./Header.png')) : (selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png'))}
            resizeMode="contain"
            style={{ width: "100%", height: "80%" }}
          />

          {/* Pencil Edit Button */}
          <Pressable
            onPress={imageUri === 'header' ? changeHeaderPic : changePic}
            style={{
              position: "absolute",
              bottom: 40,
              right: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: 12,
              borderRadius: 50,
            }}
          >
            <FontAwesome name="pencil" size={24} color="white" />
          </Pressable>
        </View>
      </Modal>
            
      <View style= {styles.content}>
        {/* <Image source= {selectedImage? {uri: selectedImage } : userData?.avatar_url? {uri: userData?.avatar_url } : require('./Avatar.png')} style= {[styles.avatar, {marginTop: 10,}]}></Image> */}
        
        
        <View style = {[styles.fields, {backgroundColor: backgroundColor}]}>

          <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Full Name '}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Username '}
            value={username}
            onChangeText={setUserName}
            autoCapitalize="none"
          />

          {/* <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
          {!EditEmail && (<Text style={[styles.title, {color: textColor, marginBottom: 10}]}>{'Email: ' + userData?.email}</Text>)}
          <FontAwesome name="pencil" size={16} color={textColor} style={{ position: 'absolute', right: 10, top: 5 }} onPress={() => {setEditEmail(!EditEmail)}} />
          {EditEmail && (<TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Email: ' + userData?.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />)}
          </View> */}

          <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Describe Yourself '}
            value={description}
            onChangeText={setDescription}
            autoCapitalize="none"
          />
          {/* <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Skills Offered: ' + userData?.skillsOffered}
            value={skillsoffered}
            onChangeText={setSkillsOff}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, {backgroundColor: inputColor}]}
            placeholder={'Skills Required: ' + userData?.skillsRequired}
            value={skillsrequired}
            onChangeText={setSkillsReq}
            autoCapitalize="none"
          /> */}
        </View>

        <View style={{ flex: 0.5, width: "100%" }}>
            {/* Tabs */}
            <View style={{ flexDirection: "row", marginTop: 20 }}>
                <View
                    style={[
                    styles.tabButton,
                    // activeTab === "offered" && styles.activeTab
                    ]}
                    // onPress={() => setActiveTab("offered")}
                >
                    <Text style={[styles.title, { color: textColor }]}>Skills Offered</Text>
                </View>

                <View
                    style={[
                    styles.tabButton,
                    // activeTab === "required" && styles.activeTab
                    ]}
                    // onPress={() => setActiveTab("required")}
                >
                    <Text style={[styles.title, { color: textColor }]}>Skills Required</Text>
                </View>
            </View>

            <View style={styles.skillsContainer}>

                <ScrollView style={{ flex: 1, width: '50%' }} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20}]}>

                    {/* SKILL LIST - GROUPED BY TYPE BUT SHOW ONLY TYPES THAT HAVE AT LEAST ONE SKILL FOR THE ACTIVE TAB */}
                    <View style={{ width: "100%", marginTop: 15 }}>
                        {
                            // Build a map type -> skills (for the active tab)
                            (() => {
                            const listToShow = offeredSkills ;
                            // group user's skills by type
                            const groupedUserSkills = listToShow.reduce((acc: any, s: any) => {
                                const key = s.type ?? "Other";
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(s);
                                return acc;
                            }, {});

                            const types = Object.keys(groupedUserSkills);
                            if (types.length === 0) {
                                return (
                                <Text style={{ color: textColor, fontSize: 14, opacity: 0.8 }}>
                                    No skills added yet.
                                </Text>
                                );
                            }

                            return types.map((type) => (
                                <View key={type} style={{ marginBottom: 12 }}>
                                <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>{type}</Text>
                                {groupedUserSkills[type].map((skill: any) => (
                                    <View key={skill.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                                    <Text  style={{ color: textColor, fontSize: 15, marginLeft: 12, marginTop: 6 }}>
                                    • {skill.name}
                                    </Text>
                                    <FontAwesome name="trash" size={16} color={textColor} onPress={() => {
                                        setOfferedSkills(prev => prev.filter(s => s.id !== skill.id));
                                        setSaveActive(true);
                                    }}/>
                                    </View>
                                ))}
                                </View>
                            ));
                            })()
                        }
                    </View>

                </ScrollView>

                <ScrollView style={{ flex: 1, width: '50%' }} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20}]}>

                    <View style={{ width: "100%", marginTop: 15 }}>
                        {
                            // Build a map type -> skills (for the active tab)
                            (() => {
                            const listToShow = requiredSkills;
                            // group user's skills by type
                            const groupedUserSkills = listToShow.reduce((acc: any, s: any) => {
                                const key = s.type ?? "Other";
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(s);
                                return acc;
                            }, {});

                            const types = Object.keys(groupedUserSkills);
                            if (types.length === 0) {
                                return (
                                <Text style={{ color: textColor, fontSize: 14, opacity: 0.8 }}>
                                    No skills added yet.
                                </Text>
                                );
                            }

                            return types.map((type) => (
                                <View key={type} style={{ marginBottom: 12 }}>
                                <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>{type}</Text>
                                {groupedUserSkills[type].map((skill: any) => (
                                    <View key={skill.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                                    <Text  style={{ color: textColor, fontSize: 15, marginLeft: 12, marginTop: 6 }}>
                                    • {skill.name}
                                    </Text>
                                    <FontAwesome name="trash" size={16} color={textColor} onPress={() => {
                                        setRequiredSkills(prev => prev.filter(s => s.id !== skill.id));
                                        setSaveActive(true);
                                    }}/>
                                    </View>
                                ))}
                                </View>
                            ));
                            })()
                        }
                    </View>

                </ScrollView>

            </View>
        </View>

        {/* PICKER (shown only after pressing Add). When user picks, we immediately add to local list and enable Save */}
        {showPicker && (
            <View style={{ marginTop: 12, width: "100%", backgroundColor: TertiaryBackgroundColor, borderRadius: 6, overflow: "hidden" }}>
            

            <Picker
                selectedValue={selectedSkillId ?? null}
                onValueChange={(value) => {
                handlePickSkill(value as string);
                const skill = skillsList.find(s => s.id === value);
                setSelectedSkillId(skill.id ?? null);
                }}
            >
                <Picker.Item label="Select Skill" value={null} />
                {skillsList.map(skill => (
                <Picker.Item
                    key={skill.id}
                    label={`${skill.name}`}
                    value={skill.id}
                />
                ))}
            </Picker>
            </View>
        )}

        {/* Add button under the listed skills (requested) */}
        {showPicker ? (<View style={{ width: "100%", flexDirection: "row", justifyContent: "space-evenly" }}>
            <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            
            onPress={() => setShowPicker(false)}
            >
            <Text style={{ color: buttonTextColor, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
        </View>) : 
        
        (<View style={{ width: "100%", flexDirection: "row", justifyContent: "space-evenly" }}>
            <TouchableOpacity
            style={[styles.addButton, { backgroundColor: buttonColor }]}
            
            onPress={() => {setActiveTab('offered'); setShowPicker(true);}}
            >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{!showPicker ? "Add Offered Skills" : "Cancel"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.addButton, { backgroundColor: buttonColor }]}
            
            onPress={() => {setActiveTab('required'); setShowPicker(true);}}
            >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{!showPicker ? "Add Required Skills" : "Cancel"}</Text>
            </TouchableOpacity>
        </View>)}

        {/* Save button (enabled only when we have unsaved additions) */}
        {/* {saveActive && (<View style={{ width: "100%" }}>
            <TouchableOpacity
            style={[
                styles.saveButton,
                { backgroundColor: saveActive ? buttonColor : "#888" }
            ]}
            disabled={!saveActive}
            onPress={saveSkillsToDB}
            >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
            </TouchableOpacity>
        </View>)} */}

        <View style={{flexDirection: 'row', justifyContent: 'space-evenly', width: '100%'}}>
          {/* <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor, marginBottom: 25}]} onPress={resetPassword}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Reset password</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor,}]} onPress={save}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Save</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor,}]} onPress={() => navigation.navigate('Profile')}>
              <Text style={[styles.buttonText, {color: buttonTextColor}]}>Cancel</Text>
          </TouchableOpacity> */}
          
        </View>

        </View>
        
    </View>

  );

}

const styles = StyleSheet.create({
  container:{
      flex: 1,
      // alignContent: 'center',
      // justifyContent: 'center',
      // alignItems: 'center',
      //padding: 20,
  },
  topbar: {
    // flex: 0.1,
    // position: 'absolute',
    // top: 0,
    flexDirection: 'row',
    width: '100%',
    height: height * 0.06,
    //marginBottom: '10%',
    //height: '6.6%',
    //padding: 20,
    alignItems: 'center',
    //justifyContent: 'flex-start', 
    verticalAlign: 'top',
    //flexGrow: 1,
    //flexShrink: 0,
  },
  content:{
      flex: 1,
      // padding: 30,
      width: '100%',
      justifyContent: 'space-evenly',
      alignContent: 'center',
      alignItems: 'center',
      //textAlign: 'left',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fields: {
    width: '100%',
    height: height * 0.2,
    //paddingHorizontal: 20,
    marginTop: 15,
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    minWidth: '30%',
    height: 40,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 5,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  headerContainer: {
    width: '100%',
    height: height * 0.15,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  avatar: {
    position: 'absolute',
    bottom: -20,
    left: 15,
    width: 80,
    height: 80,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  input: { 
    width: '80%',
    height: 40, 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 10, 
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  skillsContainer: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    // flexWrap: "wrap",
    // marginTop: 10,
  },
  scrollContent: {
    // paddingTop: 25,
    // flex: 1,
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
  },
  activeTab: {
    borderColor: "#007BFF",
  },
  addButton: {
    width: "40%",
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 10,
  },
  saveButton: {
    // width: "30%",
    // marginTop: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10
  },
})