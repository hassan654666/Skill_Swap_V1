import { Text, View, StyleSheet, TouchableOpacity, useColorScheme, Image, FlatList, Alert, Dimensions, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useUserContext } from '@/components/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import CustomDrawer from '@/components/customDrawer';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get("window");

export default function Schedule() {
  const { userData, DarkMode } = useUserContext();
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#3d3d3dff' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#253b48ff' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#20385dff' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = '#fff';

  // --- Fetch upcoming meetings ---
  useEffect(() => {
    if (!userData?.id) return;
    const fetchMeetings = async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .or(`user1_id.eq.${userData.id},user2_id.eq.${userData.id}`)
        .order('scheduled_time', { ascending: true });

      if (error) console.error(error);
      else setMeetings(data || []);
    };

    fetchMeetings();
  }, [userData]);

  // --- Cancel meeting ---
  const handleCancel = async (meetingId: string) => {
    Alert.alert('Cancel Meeting', 'Are you sure you want to cancel this meeting?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
          if (error) Alert.alert('Error', error.message);
          else {
            setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
            Alert.alert('Success', 'Meeting canceled successfully.');
          }
        },
      },
    ]);
  };

  // --- Reschedule meeting ---
  const handleReschedule = (meeting: any) => {
    navigation.navigate('Reschedule', { meeting }); // you'll create this screen later
  };

  const backAction = () => {
      navigation.navigate('Home');
      //navigation.navigate('Inbox'); 
      return true; 
  };

  useFocusEffect(
      useCallback(() => {    
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
      }, [])
  );

  const renderMeeting = ({ item }: any) => {
    const isUser1 = item.user1_id === userData.id;
    const partnerId = isUser1 ? item.user2_id : item.user1_id;

    return (
      <View style={[styles.meetingCard, { backgroundColor: TertiaryBackgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Meeting with {partnerId}</Text>
        <Text style={{ color: textColor }}>
          Time: {new Date(item.scheduled_time).toLocaleString()}
        </Text>
        <Text style={{ color: textColor }}>Status: {item.status}</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => handleReschedule(item)}
          >
            <Text style={styles.buttonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'red' }]}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <View style={[styles.topbar, { backgroundColor: SecondaryBackgroundColor }]}>
        <FontAwesome
          name="bars"
          size={24}
          color={buttonTextColor}
          style={{ margin: 20, marginTop: 10 }}
          onPress={() => setDrawerVisible(true)}
        />
        <TouchableOpacity style={{ margin: 20, marginTop: 20 }}>
          <Image
            source={userData?.avatar_url ? { uri: userData.avatar_url } : require('../Avatar.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 0.9, width: '100%', alignItems: 'center' }}>
        <Text style={[styles.title, { color: textColor, marginVertical: 10 }]}>My Schedule</Text>

        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMeeting}
          ListEmptyComponent={
            <Text style={{ color: textColor, marginTop: 20 }}>No scheduled meetings.</Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topbar: {
    // position: 'absolute',
    // top: 0,
    flex: 0.1,
    flexDirection: 'row',
    width: '100%',
    height: 100,
    //padding: 20,
    //padding: '1%',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',

  },
  logo: {
    width: 200,
    height: 200,
    margin: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    flex: 0.08,
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    backgroundColor: 'black',
  },
  button: {
    width: '20%',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f5f5f5',
    fontWeight: 'bold',
  },
    inputArea: {
    //position: 'absolute',
    //top: 90,
    flex: 0.04,
    //height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    //verticalAlign: 'top',
    padding: 20,

  },
  input: {
    width: '80%',
    height: 40,
    //height: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    //padding: 10,
  },
    meetingCard: {
    width: '90%',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  
});
