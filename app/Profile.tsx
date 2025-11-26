import React, { useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import {
  View, Text, Image, ScrollView, Alert, StyleSheet, useColorScheme,
  TouchableOpacity, Dimensions, Modal, Pressable
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { BackHandler } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get("window");

export default function Profile() {
  const { session, skills, userData, fetchSessionAndUserData, clearUserData, DarkMode } = useUserContext();
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();

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

  const [menuVisible, setMenuVisible] = useState(false);

  // all skills from 'skills' table
  const [skillsList, setSkillsList] = useState<any[]>(skills);

  // user's skills (persisted ones fetched from DB)
  const [offeredSkills, setOfferedSkills] = useState<any[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<any[]>([]);
  const [deleteSkills, setDeleteSkills] = useState<any[]>([]);

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

  const safeRating = Math.max(0, Math.min(5, Number(userData?.rating) || 0));

  const fullStars = Math.floor(safeRating);
  const halfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const checkSession = async () => {
    if (!session) {
      router.replace('/Login');
    } 
    // else {router.replace('/CompleteProfile');}
  };

  useFocusEffect(
    useCallback(() => {
      checkSession();
    }, [session])
  );

  async function fetchCachedUserSkills() {
    if (!userData?.id) return;

      const offered = userData.skillsOffered

      const required = userData.skillsRequired

      setOfferedSkills(offered);
      setRequiredSkills(required);

      // Save original IDs so we know which ones are newly added locally later
      setOriginalOfferedIds(offered.map((s: any) => s.id));
      setOriginalRequiredIds(required.map((s: any) => s.id));

      // Clear save flag (we just loaded from server)
      setSaveActive(false);
  }

  useEffect(() => {
    fetchCachedUserSkills();
  }, [userData?.id]);

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
    if (!userData?.id) return;

    try {
      /**
       * Select profile_skills rows for the user and include
       * the nested skills fields (id, name, type).
       */
      const { data, error }: any = await supabase
        .from("profile_skills")
        .select("category, skill_id, skills(id, name, type)")
        .eq("profile_id", userData.id);

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
  async function saveSkillsToDB() {
    if (!userData?.id) {
      Alert.alert("Error", "No user found.");
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

      if (rowsToUpsert.length === 0 && deleteSkills.length === 0) {
        Alert.alert("Nothing to save", "No changes to save.");
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

      await deleteSkillsFromDB();

      // Reload user's skills from DB (will reset original IDs)
      await fetchUserSkills();
      Alert.alert("Success", "Skills saved!");
    } catch (err: any) {
      console.log("saveSkillsToDB catch", err);
      Alert.alert("Error", err?.message || "Unknown error");
    } finally {
      setSaveActive(false);
      setSelectedSkillId(null);
      setShowPicker(false);
    }
  }

  async function deleteSkillsFromDB() {
    for (const deleteSkill of deleteSkills) {
      if (userData?.id) {
        const isSaved = deleteSkill.category === "offered"
          ? originalOfferedIds.includes(deleteSkill.id)
          : originalRequiredIds.includes(deleteSkill.id);

        if (isSaved) {
          // DELETE FROM SUPABASE
          const { error } = await supabase
            .from("profile_skills")
            .delete()
            .eq("profile_id", userData.id)
            .eq("skill_id", deleteSkill.id)
            .eq("category", deleteSkill.category);

          if (error) {
            Alert.alert("Error", "Could not delete skill");
            return;
          }
        }
      }
    }
    setDeleteSkills([]);
  }

  async function deleteSkill(itemId: any, category: "offered" | "required") {
    
    // ALWAYS remove from UI using localId if present
    if (category === "offered") {
      setOfferedSkills(prev =>
        prev.filter(s => (s.id !== itemId))
      );
    } else {
      setRequiredSkills(prev =>
        prev.filter(s => (s.id !== itemId))
      );
    }

    setDeleteSkills(prev => [...prev, { id: itemId, category: category }]);

    setSaveActive(true);
  }


  // ---------------------------
  // Misc: back action, logout, edit
  // ---------------------------
  const backAction = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/Home');
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [])
  );

  const handleLogout = async () => {
    try {
      clearUserData();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const editProfile = () => {
    router.push('/EditProfile');
    setMenuVisible(false);
  };

  const resetPassword = () => {
    // navigation.navigate('ResetPassword', {email: userData.email});
    router.push({
      pathname: '/ResetPassword',
      params: {
        email: userData.email
      }
    });
  };

  // realtime subscription to profile updates
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase.channel('ProfileChannel');

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userData?.id}`,
      },
      (payload) => {
        // console.log('Profile updated:', payload.new);
        fetchSessionAndUserData();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  // initial fetches
  useEffect(() => {
    if (!userData?.id) return;
    fetchSkillsFromDB();
    fetchUserSkills();
  }, [userData?.id]);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: backgroundColor }]}>
        <TouchableOpacity style={{ paddingHorizontal: 15 }} onPress={backAction}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity style={{ paddingHorizontal: 15 }} onPress={() => setMenuVisible(true)}>
          <FontAwesome name="ellipsis-v" size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Header Image */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => {
          if(userData?.header_url) {
            setImageUri(userData?.header_url || '');
            setVisible(true);
          }
        }}>
        <Image
          source={userData?.header_url ? { uri: userData.header_url } : require('./Header.png')}
          style={styles.headerImage}
        />
        </Pressable>
        <Pressable  onPress={() => {
          if(userData?.avatar_url) {
            setImageUri(userData?.avatar_url || '');
            setVisible(true);
          }
        }}>
        <Image
          source={userData?.avatar_url ? { uri: userData.avatar_url } : require('./Avatar.png')}
          style={styles.avatar}
        />
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable 
          onPress={() => setVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={{ width: "100%", height: "80%" }}
          />
        </Pressable>
      </Modal>

      <View style={{width: "100%", alignItems: "center", marginTop: 30}}>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: "center"}}>
            <Text style={[styles.title, { color: textColor }]}>{userData?.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Full Stars */}
              {[...Array(fullStars)].map((_, i) => (
                <FontAwesome key={`full-${i}`} name="star" size={20} color="gold" />
              ))}

              {/* Half Star */}
              {halfStar && <FontAwesome name="star-half-full" size={20} color="gold" />}

              {/* Empty Stars */}
              {[...Array(emptyStars)].map((_, i) => (
                <FontAwesome key={`empty-${i}`} name="star-o" size={20} color="grey" />
              ))}

              <Text style={{ marginLeft: 5, fontSize: 16, color: textColor }}>
                ({userData?.reviews})
              </Text>
            </View>
          </View>
            
            <Text style={[styles.title, { color: textColor, opacity: 0.6, marginBottom: 14 }]}>@{userData?.username}</Text>

            <Text style={[styles.title, { color: textColor }]}>{userData?.description}</Text>
        </View>
      </View>

      {/* Scrollable Profile Info */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
       
       <View style={{ width: "90%" }}>
          {/* Tabs */}
          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "offered" && styles.activeTab
              ]}
              onPress={() => setActiveTab("offered")}
            >
              <Text style={{ color: textColor }}>Skills Offered</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "required" && styles.activeTab
              ]}
              onPress={() => setActiveTab("required")}
            >
              <Text style={{ color: textColor }}>Skills Required</Text>
            </TouchableOpacity>
          </View>

          {/* SKILL LIST - GROUPED BY TYPE BUT SHOW ONLY TYPES THAT HAVE AT LEAST ONE SKILL FOR THE ACTIVE TAB */}
          <View style={{ width: "100%", marginTop: 15 }}>
            {
              // Build a map type -> skills (for the active tab)
              (() => {
                const listToShow = activeTab === "offered" ? offeredSkills : requiredSkills;
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
                      <View key={skill.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginLeft: 12, marginTop: 6 }}>
                        <Text style={{ color: textColor, fontSize: 15 }}>
                          • {skill.name}
                        </Text>
                        <FontAwesome name="trash" size={16} color="white" onPress={() => deleteSkill(skill.id, activeTab)} />
                      </View>
                    ))} 
                    
                  </View>
                ));
              })()
            }
          </View>

        </View>
      </ScrollView>

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
      {showPicker ? (<View style={{ width: "100%", flexDirection: "row", justifyContent: "space-around"}}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: buttonColor }]}
          onPress={() => setShowPicker(false)}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{!showPicker ? "Add Offered Skill" : "Cancel"}</Text>
        </TouchableOpacity>
        </View>) : 
        (<View style={{ width: "100%", flexDirection: "row", justifyContent: "space-around"}}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: buttonColor }]}
          onPress={() => {setShowPicker(true); setActiveTab("offered");}}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{!showPicker ? "Add Offered Skill" : "Cancel"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: buttonColor }]}
          onPress={() => {setShowPicker(true); setActiveTab("required");}}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{!showPicker ? "Add Required Skill" : "Cancel"}</Text>
        </TouchableOpacity>
      </View>)}

      {/* Save button (enabled only when we have unsaved additions) */}
      {saveActive && (<View style={{ width: "100%", alignItems: "center"}}>
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
      </View>)}

      {/* Menu Modal */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { backgroundColor: backgroundColor }]}>
            <TouchableOpacity style={styles.menuItem} onPress={editProfile}>
              <Text style={{ color: textColor, fontSize: 16 }}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={resetPassword}>
              <Text style={{ color: textColor, fontSize: 16 }}>Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={{ color: redButton, fontSize: 16 }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  topBar: {
    width: '100%',
    height: height * 0.06,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  headerContainer: {
    width: '100%',
    height: 150,
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
  scrollContent: {
    // paddingTop: 25,
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
  },
  userInfo: { 
    // paddingBottom: 10,
    width: '90%', 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 6 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    width: 160,
    marginTop: 50,
    marginRight: 10,
    borderRadius: 8,
    paddingVertical: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
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
    width: "30%",
    // marginTop: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10
  },

});
