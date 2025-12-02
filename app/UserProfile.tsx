import React, { useEffect, useState, useCallback } from 'react';
import { useUserContext } from '@/components/UserContext';
import {
  View, Text, Image, ScrollView, Alert, StyleSheet, useColorScheme,
  TouchableOpacity, Dimensions, Modal, Pressable,
  TextInput
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width, height } = Dimensions.get("window");

export default function UserProfile() {
  const { session, userData, usersData, fetchSessionAndUserData, clearUserData, DarkMode, skills } = useUserContext();
  const router = useRouter();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();

  const { userId } = useLocalSearchParams<{ userId?: string }>();

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

  // user's skills (persisted ones fetched from DB)
  const [offeredSkills, setOfferedSkills] = useState<any[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"offered" | "required">("offered");

  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [message, setMessage] = useState('');

  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportTopic, setReportTopic] = useState<any>();
  const [reportMessage, setReportMessage] = useState<any>();

  const [visible, setVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');

  const checkSession = async () => {
    if (isFocused && !session) {
      router.replace('/Login');
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkSession();
    }, [session])
  );

  async function fetchCachedUserSkills() {
    if (!userId) return;

      const offered = user.skillsOffered;

      const required = user.skillsRequired;

      setOfferedSkills(offered);
      setRequiredSkills(required);

  }

  useEffect(()=>{
    fetchCachedUserSkills
  },[userId])

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

    } catch (err) {
      console.log("fetchUserSkills catch", err);
    }
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

  const user = usersData?.find((users: any) =>
    users?.id === userId
  );

  const safeRating = Math.max(0, Math.min(5, Number(user?.rating) || 0));

  const fullStars = Math.floor(safeRating);
  const halfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    function MessageUser() {
      router.push({
        pathname: '/Chat',
        params: {
          receiverId: userId
        }
      });
    }

  // -----------------------------------------------------------
    // 🧩 MEETING REQUEST LOGIC ADDED BELOW
    // -----------------------------------------------------------

    const showDatePicker = () => setShowPicker(true);
    const hideDatePicker = () => setShowPicker(false);
    
    // const handleDateChange = (date?: Date) => {
    //   hideDatePicker();
    //   if (date) {
    //     setSelectedDate(date);
    //   }
    // };

    // async function used in your Profile or Reschedule flow
    async function hasExactConflict(userId: string, isoDateTime: string) {

      const proposed = new Date(isoDateTime);

      const lower = new Date(proposed.getTime() - 60 * 60 * 1000).toISOString();
      const upper = new Date(proposed.getTime() + 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('schedules')
        .select('id')
        .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
        .gte('datetime', lower)
        .lte('datetime', upper)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    }

    async function requestMeeting(date: Date) {
      if (!date) {
        Alert.alert('Select a Date & Time', 'Please choose a date and time first.');
        return;
      }

      // usage before sending request
      const iso = date.toISOString();
      const conflictRequester = await hasExactConflict(userData.id, iso);
      const conflictReceiver = await hasExactConflict(user?.id, iso);
      if (conflictRequester || conflictReceiver) {
        Alert.alert('Scheduling conflict', 'Either you or the other user already has a meeting at that time.');
        return;
      }
      // proceed to insert meeting_requests

      try {
        const { data, error } = await supabase
          .from('meeting_requests')
          .insert([
            {
              requester_id: userData?.id,
              receiver_id: user.id,
              proposed_datetime: date.toISOString(),
              status: 'pending',
              message: message || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        Alert.alert('Success', 'Meeting request sent successfully!');
        setSelectedDate(new Date());
        setMessage('');
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', err.message || 'Failed to send meeting request');
      }
    }

    // -----------------------------------------------------------
    // 🧩 END MEETING REQUEST LOGIC
    // -----------------------------------------------------------

  const reportUser = async () => {
    try {
      const { error } = await supabase.from("reports").insert({
        user_id: userId,
        reporter_id: userData.id,
        topic: reportTopic,
        message: reportMessage,
        status: 'pending'
      });

      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Reported",
        message: 'You have been reported to the admin ⚠️',
        type: 'report'
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }finally{
      setReportVisible(false);
      setReportTopic('');
      setReportMessage('');
    }
  };

  // realtime subscription to profile updates
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
        // console.log('Profile updated:', payload.new);
        fetchSessionAndUserData();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // initial fetches
  useEffect(() => {
    if (!user?.id) return;
    fetchUserSkills();
  }, [user?.id]);

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
          if(user?.header_url) {
            setImageUri(user?.header_url || '');
            setVisible(true);
          }
        }}>
        <Image
          source={user?.header_url ? { uri: user?.header_url } : require('./Header.png')}
          style={styles.headerImage}
        />
        </Pressable>
        <Pressable  onPress={() => {
          if(user?.avatar_url) {
            setImageUri(user?.avatar_url || '');
            setVisible(true);
          }
        }}>
        <Image
          source={user?.avatar_url ? { uri: user?.avatar_url } : require('./Avatar.png')}
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

      <Modal visible={reportVisible} transparent animationType="fade">
        <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
        }}>
          
        <FontAwesome name="close" size={32} style={{position: 'absolute', top: height * 0.1, right: width * 0.1, color: textColor, marginBottom: 4}} onPress={() => { setReportVisible(false); setReportTopic(null); setReportMessage(null); }}/>

        <TextInput
          style={[styles.input, { backgroundColor: inputColor }]}
          placeholder="Enter Report Topic"
          value={reportTopic}
          onChangeText={setReportTopic}
        />
  
        <TextInput
          style={[styles.input, { backgroundColor: inputColor }]}
          placeholder="Enter Report Description"
          value={reportMessage}
          onChangeText={setReportMessage}
        />

        <TouchableOpacity style={[styles.button, {backgroundColor: redButton}]} onPress={reportUser}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Report</Text>
          {/* <FontAwesome name="send" size={20} color={buttonTextColor} /> */}
        </TouchableOpacity>

        </View>
      </Modal>

      <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>

        <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginVertical: 5, marginLeft: 110 }}>
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
            ({user?.reviews})
          </Text>

        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-evenly', gap:20, padding: 10}}>
          <TouchableOpacity style={[styles.smallButton, {backgroundColor: buttonColor}]} onPress={MessageUser}>
            {/* <Text style={[styles.buttonText, {color: buttonTextColor}]}>Message</Text> */}
            <FontAwesome name="comment" size={18} color={buttonTextColor} />
          </TouchableOpacity>
        
          <TouchableOpacity
            style={[styles.button, {backgroundColor: buttonColor}]}
            onPress={showDatePicker}
          >
            <Text style={[styles.buttonText, {color: buttonTextColor}]}>
              Schedule Meeting
            </Text>
            {/* <FontAwesome name="calendar" size={20} color={buttonTextColor} /> */}
          </TouchableOpacity>
        </View>

        </View>

      <View style={{width: width, flexDirection: "row", justifyContent: "flex-start", alignItems: "center", paddingHorizontal: 10, marginTop: 0, }}>
        <View style={styles.userInfo}>
            <Text style={[styles.title, { color: textColor, top: -20 }]}>{user?.name}</Text>
            <Text style={[styles.title, { color: textColor, top: -20, opacity: 0.6 }]}>@{user?.username}</Text>
            
        </View>
        {/* <TouchableOpacity style={[styles.smallButton, {backgroundColor: buttonColor, top: -20}]} onPress={MessageUser}> */}
          {/* <Text style={[styles.buttonText, {color: buttonTextColor}]}>Message</Text> */}
          {/* <FontAwesome name="comment" size={20} color={buttonTextColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, {backgroundColor: buttonColor, top: -20}]}
          onPress={showDatePicker}
        > */}
          {/* <Text style={[styles.buttonText, {color: buttonTextColor}]}>
            Schedule Meeting
          </Text> */}
          {/* <FontAwesome name="calendar" size={20} color={buttonTextColor} />
        </TouchableOpacity> */}

        {/* <TouchableOpacity style={[styles.smallButton, {backgroundColor: buttonColor, top: -20}]} onPress={() => router.push({pathname: "/ReviewUser", params: {userId: user.id}})}> */}
          {/* <Text style={[styles.buttonText, {color: buttonTextColor}]}>Message</Text> */}
          {/* <FontAwesome name="camera" size={20} color={buttonTextColor} />
        </TouchableOpacity> */}
      </View>

      <Text style={[styles.title, { color: textColor, paddingHorizontal: 20 }]}>{user?.description}</Text>

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
              <Text style={{ color: textColor }}>Offered</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "required" && styles.activeTab
              ]}
              onPress={() => setActiveTab("required")}
            >
              <Text style={{ color: textColor }}>Required</Text>
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
                      <Text key={skill.id} style={{ color: textColor, fontSize: 15, marginLeft: 12, marginTop: 6 }}>
                        • {skill.name}
                      </Text>
                    ))}
                  </View>
                ));
              })()
            }
          </View>

        </View>
      </ScrollView>

      {/* <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={MessageUser}>
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>Message</Text>
      </TouchableOpacity> */}

      {/* -----------------------------------------------------------
            🧭 Meeting Request UI
      ----------------------------------------------------------- */}
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        {/* <Text style={[styles.title, {color: textColor}]}>Schedule a Skill Swap Meeting</Text>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: buttonColor, width: '60%'}]}
          onPress={showDatePicker}
        >
          <Text style={[styles.buttonText, {color: buttonTextColor}]}>
            Select Date & Time
          </Text>
        </TouchableOpacity> */}

          <DateTimePickerModal
            isVisible={showPicker}
            mode="datetime"
            display='spinner'
            date={selectedDate || new Date()}
            onConfirm={(date) => {
              setSelectedDate(date);
              setShowPicker(false);
              setTimeout(() => {
                Alert.alert(
                  "Confirm Request",
                  `Do you want to request a meeting at ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}?`,
                  [
                    { text: "Cancel" },
                    { text: "Yes", onPress: () => requestMeeting(date) }
                  ]
                );
              }, 300); // slight delay so the picker closes smoothly
            }}
            onCancel={hideDatePicker}
            minimumDate={new Date()}
            themeVariant={DarkMode ? "dark" : "light"}
          />
        </View>

         {/* Menu Modal */}
          <Modal
            transparent={true}
            visible={menuVisible}
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
              <View style={[styles.menu, { backgroundColor: backgroundColor }]}>
                <TouchableOpacity style={styles.menuItem} onPress={() => {setReportVisible(true); setMenuVisible(false);}}>
                  <Text style={{ color: redButton, fontSize: 16 }}>Report</Text>
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
    width: '55%', 
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
  input: {
    width: '80%', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 20 
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
    // width: "30%",
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
  smallButton: {
    // width: '10%',
    padding: width * 0.014,
    borderRadius: 25,
    alignItems: 'center',
    // margin: 10,
  },
  button: {
    minWidth: '20%',
    padding: 7,
    borderRadius: 15,
    alignItems: 'center',
    // margin: 10,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

});
