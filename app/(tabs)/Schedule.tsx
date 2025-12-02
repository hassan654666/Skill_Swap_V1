import { Text, View, StyleSheet, TouchableOpacity, useColorScheme, Image, FlatList, Alert, Dimensions, BackHandler, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import CustomDrawer from '@/components/customDrawer';
import { supabase } from '@/lib/supabase';
import { Calendar } from 'react-native-calendars';
//import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

export default function Schedule() {
  const { userData, usersData, DarkMode } = useUserContext();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [request, setRequest] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(toCalendarDateString(new Date()));
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [newDateTime, setNewDateTime] = useState(new Date());
  const [showList, setShowList] = useState(false);
  const [selectUserModal, setSelectUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>('Calendar');

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
  
  const CACHE_KEY = `user_schedule${userData.id}`;

  useEffect(() => {
    const loadCachedSchedule = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setMeetings(parsedData);
        }
      } catch (error) {
        console.error('Failed to load cached schedule:', error);
      }
    };
    loadCachedSchedule();
  }, [userData?.id]);

  // 🗓️ Fetch meetings
  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .or(`user_id.eq.${userData?.id},partner_id.eq.${userData?.id}`)
      .order('datetime', { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setMeetings(data || []);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
  };

  useEffect(() => {
    if (!userData?.id) return;
    fetchMeetings();
    const chatChannel = supabase
      .channel('schedule')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `user_id=eq.${userData?.id}`,
        },
        (payload) => {
          if(!payload.new) return;
          fetchMeetings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `partner_id=eq.${userData?.id}`,
        },
        (payload) => {
          if(!payload.new) return;
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [userData?.id]);

  // ❌ Cancel meeting
  const handleCancel = async (meeting: any) => {
    Alert.alert('Cancel Meeting', 'Are you sure you want to cancel this meeting?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          const { error: notifyError } = await supabase.from("notifications").insert({
            user_id: userData.id === meeting.user_id
              ? meeting.partner_id
              : meeting.user_id,
            type: "canceled",
            title: "Meeting Canceled",
            message: "Your meeting has been canceled",
            meeting_id: meeting.meeting_id,
            read: false,
          });
          if (notifyError) Alert.alert("Error", notifyError.message);

          const { error } = await supabase.from('schedules').delete().eq('id', meeting.id);
          if (error) Alert.alert('Error', error.message);
          else {
            setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
            Alert.alert('Success', 'Meeting canceled successfully.');
          }
        },
      },
    ]);
  };

  // to check for exact conflicts
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

  // 🔁 Reschedule meeting
  const handleReschedule = async (meeting: any) => {

    const { data: requestData, error } = await supabase
      .from('meeting_requests')
      .select('*')
      .eq('id', meeting.meeting_id)
      .single();
    if (error) console.error(error);
    else setRequest(requestData || null);

    if (requestData?.reschedule_of) {
      Alert.alert(
        "Rescheduling Not Allowed",
        'This meeting has already been rescheduled once.',
        [{ text: "OK" }]
      );
      return;
    }
    setSelectedMeeting(meeting);
    setRescheduleModal(true);
  };

  const confirmReschedule = async (date: Date) => {
    if (!selectedMeeting) return;
    if (!date) {
      Alert.alert("Incomplete", "Please select both date and time first.");
      return;
    }

    // usage before sending request
    const iso = date.toISOString();
    const conflictRequester = await hasExactConflict(selectedMeeting?.user_id, iso);
    const conflictReceiver = await hasExactConflict(selectedMeeting?.partner_id, iso);
    if (conflictRequester || conflictReceiver) {
      Alert.alert('Scheduling conflict', 'Either you or the other user already has a meeting at that time.');
      return;
    }

    const { error } = await supabase.from("meeting_requests").insert([
      {
        requester_id: userData.id,
        receiver_id:
          userData.id === selectedMeeting.user_id
            ? selectedMeeting.partner_id
            : selectedMeeting.user_id,
        proposed_datetime: iso,
        message: request?.message || null,
        reschedule_of: request.id,
        zoom_link: request?.zoom_link || null,
        status: "pending",
      },
    ]);

    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Reschedule request sent successfully.");

    setRescheduleModal(false);
    setSelectedMeeting(null);
  };

  const showDatePicker = () => setShowPicker(true);
  const hideDatePicker = () => setShowPicker(false);
  
  // const handleDateChange = (date?: Date) => {
  //   hideDatePicker();
  //   if (date) {
  //     setSelectedDate(date);
  //   }
  // };

  async function requestMeeting(date: Date) {
    if (!date) {
      Alert.alert('Select a Date & Time', 'Please choose a date and time first.');
      return;
    }

    // usage before sending request
    const iso = date.toISOString();
    const conflictRequester = await hasExactConflict(userData.id, iso);
    const conflictReceiver = await hasExactConflict(selectedUser?.id, iso);
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
            receiver_id: selectedUser?.id,
            proposed_datetime: iso,
            status: 'pending',
            message: message || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Meeting request sent successfully!');
      // setSelectedDate(new Date());
      setMessage('');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to send meeting request');
    }

    setShowList(false);
    setSelectedUser(null);
  }

  const JoinMeeting = async (meeting: any) => {
    const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("meeting_id", meeting.meeting_id)
    .single()
    if(error) console.error('Error fetching meeting: ', error);

    if(data.status !== "Missed" && data.status !== "Completed"){
      const updatedjoined = Array.isArray(meeting?.joined)
        ? [...new Set([...meeting.joined, userData?.id])]
        : [userData?.id];

      const { data: sched, error: schedError } = await supabase
      .from("schedules")
      .update({ joined:  updatedjoined})
      .eq("meeting_id", meeting.meeting_id)
      .single()
      if(schedError) console.error('Error marking meeting joined: ', schedError);

      const partnerId = data.host_id === userData?.id ? data.guest_id : data.host_id;
      router.push({
        pathname: '/Meeting',
        params: { 
          partnerId: partnerId, 
          meetingId: data.zoom_meeting_id, 
          password: data.zoom_password, 
          Link: data.zoom_join_url 
        },
      });
    }
  }

  // YYYY-MM-DD format for Calendar keys
function toCalendarDateString(dateString: string | Date) {
  const date = new Date(dateString);
  return date.getFullYear() + '-' +
         String(date.getMonth() + 1).padStart(2, '0') + '-' +
         String(date.getDate()).padStart(2, '0');
}

// Optional: DD-MM-YYYY for display
function toDisplayDate(dateString: string | Date) {
  const date = new Date(dateString);
  return String(date.getDate()).padStart(2, '0') + '-' +
         String(date.getMonth() + 1).padStart(2, '0') + '-' +
         date.getFullYear();
}

const uniqueTypes = ['Calendar', 'Upcoming']; // or any dynamic tags

  // 📆 Calendar mark
  const markedDates = meetings.reduce((acc, meeting) => {
    //const date = new Date(meeting.datetime).toISOString().split('T')[0];
    const date = toCalendarDateString(meeting.datetime); // local date now
    acc[date] = {
      marked: true,
      dotColor: linkTextColor,
      selected: selectedDate === date,
      selectedColor: linkTextColor,
    };
    return acc;
  }, {} as any);

  // ✅ Ensure the selected date is also highlighted
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: linkTextColor,
    };
  }

  const handleDayPress = (day: any) => setSelectedDate(day.dateString);

  // 🧭 Back handler
  const backAction = () => {
    navigation.navigate('Home');
    return true;
  };
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [])
  );

  // 📋 Render meeting card
  const renderMeeting = ({ item }: any) => {
    const partnerId = userData?.id === item.user_id ? item.partner_id : item.user_id;
    const partner = usersData.find((u: any) => u.id === partnerId);

    return (
      <View style={[styles.meetingCard, { backgroundColor: TertiaryBackgroundColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <Image
            source={partner?.avatar_url ? { uri: partner.avatar_url } : require('../Avatar.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View>
            <Text style={[styles.title, { color: textColor }]}>{partner?.name || 'Guest'}</Text>
            <Text style={{ color: textColor }}>
              🕒 {new Date(item.datetime).toLocaleTimeString()}
            </Text>
            <Text style={{ color: textColor }}>
              {/* 📅 {new Date(item.datetime).toLocaleDateString()} */}
              📅 {toDisplayDate(item.datetime)}
            </Text>
            <Text style={{ fontSize: 16, color: textColor }}>Status: {item.status}</Text>
          </View>
        </View>

        {(item.status !== 'Missed' && item.status !== 'Completed' && item.status !== 'Online') && (<View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => handleReschedule(item)}
          >
            <Text style={{ color: buttonTextColor }}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: redButton }]}
            onPress={() => handleCancel(item)}
          >
            <Text style={{ color: buttonTextColor }}>Cancel</Text>
          </TouchableOpacity>
        </View>)}

        {(item.status === 'Online') && (<View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => JoinMeeting(item)}
          >
            <Text style={{ color: buttonTextColor }}>Join</Text>
          </TouchableOpacity>
        </View>)}

      </View>
    );
  };

  const renderUser=({ item }: any) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => {
              setSelectedUser(item);
              // setShowList(false);
              setShowPicker(true); // ➜ open date-time picker instantly
            }}
          >
            <Image
              source={item.avatar_url ? { uri: item.avatar_url } : require('../Avatar.png')}
              style={styles.avatar}
            />
            <Text style={{ color: textColor, fontSize: 16 }}>{item.name}</Text>
          </TouchableOpacity>
        )

  const filteredMeetings = selectedDate
    // ? meetings.filter((m) => new Date(m.datetime).toISOString().split('T')[0] === selectedDate)
    ? meetings.filter((m) => toCalendarDateString(m.datetime) === selectedDate)
    : [];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>
        {/* <FontAwesome
          name="bars"
          size={24}
          color={textColor}
          style={{ margin: 20 }}
          onPress={() => setDrawerVisible(true)}
        /> */}
        <Text style={[styles.title, { color: textColor }]}>Schedule</Text>
        {/* <Image
          source={userData?.avatar_url ? { uri: userData.avatar_url } : require('../Avatar.png')}
          style={styles.avatar}
          resizeMode="cover"
        /> */}
      </View>

      <View style={{flexDirection: 'row', height: height * 0.04, justifyContent: 'center', alignSelf: 'flex-start'}}>
          {uniqueTypes.map(tag => (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(tag)}
              style={{
                height: height * 0.04,
                minWidth: width/2,
                paddingVertical: 0,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 10,
                backgroundColor: selectedTag === tag ? buttonColor : TertiaryBackgroundColor,
                borderRadius: 0,
                borderColor: SecondaryBackgroundColor,
                borderBottomWidth: 0.5,
                borderLeftWidth: 0.5,
                borderRightWidth: 0.5,
                // marginRight: 8
              }}
            >
              <Text style={{ color: selectedTag === tag ? buttonTextColor : textColor }}>{tag}</Text>
            </Pressable>
          ))}
      </View>

      {selectedTag === 'Upcoming' && (
        <View style={{flex: 1, width: '100%'}}>
        {showList ? (<FlatList
          style={{padding: width * 0.03}}
          data={usersData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          ListEmptyComponent={
            selectedDate ? (
              <View>
              <Text style={{ color: textColor, textAlign: 'center' }}>No users found.</Text>
            </View>
            ) : null
          }
        /> ) : (
        <FlatList
          style={{padding: width * 0.03}}
          data={meetings.filter(m => new Date(m.datetime) > new Date())} // future meetings
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMeeting}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View>
              <Text style={{ color: textColor, textAlign: 'center', marginTop: 20 }}>
                No upcoming meetings.
              </Text>
            </View>
          }
        />)}
        </View>
      )}

      {selectedTag === 'Calendar' && (
      <View style={{flex: 1, width: '100%'}}>
      <Calendar
        key={DarkMode ? 'dark' : 'light'}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        enableSwipeMonths={true}
        theme={{
          calendarBackground: TertiaryBackgroundColor,
          textSectionTitleColor: textColor,
          dayTextColor: textColor,
          monthTextColor: textColor,
          arrowColor: linkTextColor,
          todayTextColor: linkTextColor,
          selectedDayTextColor: buttonTextColor,
          textMonthFontWeight: 'bold',
        }}
      />

      <Text style={[styles.title, { color: textColor, marginVertical: 10 }]}>
        {selectedDate ? `Meetings on ${toDisplayDate(selectedDate)}` : 'Select a date'}
      </Text>

      {showList ? (<FlatList
        style={{padding: width * 0.03}}
        data={usersData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        ListEmptyComponent={
          selectedDate ? (
            <View>
            <Text style={{ color: textColor, textAlign: 'center' }}>No users found.</Text>
          </View>
          ) : null
        }
      /> ) : (
      <FlatList
        style={{padding: width * 0.03}}
        data={filteredMeetings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMeeting}
        ListEmptyComponent={
          selectedDate ? (
            <View>
            <Text style={{ color: textColor, textAlign: 'center' }}>No meetings for this date.</Text>
          </View>
          ) : null
        }
      />)}
      </View>
      )}
      <View style={{ flexDirection: 'row', margin: 20, justifyContent: 'space-around' }}>
          <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={() => setShowList(!showList)}
        >
          {showList ? (<Text style={{ color: buttonTextColor }}>Cancel</Text>) : (<Text style={{ color: buttonTextColor }}>Request a new meeting</Text>)}
        </TouchableOpacity>
      </View>

      {/* 🕒 Reschedule Date & Time Picker */}
      <DateTimePickerModal
        isVisible={rescheduleModal}
        mode="datetime"
        date={newDateTime}
        minimumDate={new Date()}
        display="spinner"
        onConfirm={(date) => {
          setNewDateTime(date);
          setRescheduleModal(false);
          setTimeout(() => {
            Alert.alert(
              "Confirm Reschedule",
              `Do you want to reschedule to ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}?`,
              [
                { text: "Cancel" },
                { text: "Yes", onPress: ()=> confirmReschedule(date) }
              ]
            );
          }, 300); // slight delay so the picker closes smoothly
        }}
        onCancel={() => setRescheduleModal(false)}
        themeVariant={DarkMode ? "dark" : "light"}
      />

      {/* 🕒 Reschedule Date & Time Picker */}
      <DateTimePickerModal
        isVisible={showPicker}
        mode="datetime"
        date={newDateTime}
        minimumDate={new Date()}
        display="spinner"
        onConfirm={(date) => {
          setNewDateTime(date);
          setShowPicker(false);
          setTimeout(() => {
            Alert.alert(
              "Confirm Request",
              `Do you want to request a meeting on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}?`,
              [
                { text: "Cancel" },
                { text: "Yes", onPress: ()=> requestMeeting(date) }
              ]
            );
          }, 300); // slight delay so the picker closes smoothly
        }}
        onCancel={() => setShowPicker(false)}
        themeVariant={DarkMode ? "dark" : "light"}
      />

      <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  topbar: {
    flexDirection: 'row',
    width: '100%',
    height: height * 0.06,
    alignItems: 'center',
    // justifyContent: 'space-between',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 90,
    marginRight: 15,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  meetingCard: {
    width: '100%',
    alignSelf: 'center',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
  },
  button: {
    minWidth: '30%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
  },
  userItem: {
  flexDirection: "row",
  alignItems: "center",
  gap: 15,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderColor: "#ccc",
},
});
