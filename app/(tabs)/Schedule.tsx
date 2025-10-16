import { Text, View, StyleSheet, TouchableOpacity, useColorScheme, Image, FlatList, Alert, Dimensions, BackHandler, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import CustomDrawer from '@/components/customDrawer';
import { supabase } from '@/lib/supabase';
import { Calendar } from 'react-native-calendars';
//import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width, height } = Dimensions.get("window");

export default function Schedule() {
  const { userData, usersData, DarkMode } = useUserContext();
  const navigation = useNavigation<any>();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [request, setRequest] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [newDateTime, setNewDateTime] = useState(new Date());

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

  // 🗓️ Fetch meetings
  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .or(`user_id.eq.${userData?.id},partner_id.eq.${userData?.id}`)
      .order('datetime', { ascending: true });
    if (error) console.error(error);
    else setMeetings(data || []);
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
          filter: `or(user_id.eq.${userData?.id},partner_id.eq.${userData?.id})`,
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
  const handleCancel = async (meetingId: string) => {
    Alert.alert('Cancel Meeting', 'Are you sure you want to cancel this meeting?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          const { error } = await supabase.from('schedules').delete().eq('id', meetingId);
          if (error) Alert.alert('Error', error.message);
          else {
            setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
            Alert.alert('Success', 'Meeting canceled successfully.');
          }
        },
      },
    ]);
  };

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
        "This meeting has already been rescheduled once.",
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

    const { error } = await supabase.from("meeting_requests").insert([
      {
        requester_id: userData.id,
        receiver_id:
          userData.id === selectedMeeting.user_id
            ? selectedMeeting.partner_id
            : selectedMeeting.user_id,
        proposed_datetime: date.toISOString(),
        reschedule_of: request.id,
        status: "pending",
      },
    ]);

    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Reschedule request sent successfully.");

    setRescheduleModal(false);
    setSelectedMeeting(null);
  };


  // 📆 Calendar mark
  const markedDates = meetings.reduce((acc, meeting) => {
    const date = new Date(meeting.datetime).toISOString().split('T')[0];
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
              📅 {new Date(item.datetime).toLocaleDateString()}
            </Text>
            <Text style={{ color: textColor }}>Status: {item.status}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => handleReschedule(item)}
          >
            <Text style={{ color: buttonTextColor }}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: redButton }]}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={{ color: buttonTextColor }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredMeetings = selectedDate
    ? meetings.filter((m) => new Date(m.datetime).toISOString().split('T')[0] === selectedDate)
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
        {selectedDate ? `Meetings on ${selectedDate}` : 'Select a date'}
      </Text>

      <FlatList
        data={filteredMeetings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMeeting}
        ListEmptyComponent={
          selectedDate ? (
            <Text style={{ color: textColor, textAlign: 'center' }}>No meetings for this date.</Text>
          ) : null
        }
      />

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

      <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  meetingCard: {
    width: '90%',
    alignSelf: 'center',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
  },
  button: {
    width: '30%',
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
});
