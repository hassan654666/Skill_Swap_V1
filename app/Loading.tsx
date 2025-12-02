import { StyleSheet, ActivityIndicator, useColorScheme, Image } from 'react-native';
import { useUserContext } from '@/components/UserContext';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function Loading() {
  
  const {loading, userData, session, DarkMode, fetchSessionAndUserData} = useUserContext();

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

  const router = useRouter();

  // if (loading) {
  //   return (
  //     <View style={[styles.container, {justifyContent: 'center', backgroundColor: backgroundColor}]}>
  //       {/* You can show a spinner, splash, or nothing */}
  //       <ActivityIndicator size="large" style={{backgroundColor: backgroundColor}}/>
  //     </View>
  //   );
  // };

  const checkSession = async () => {
    try {
      if (session) {
        if(!userData){
          router.replace('/CompleteProfile');
        } else if(userData?.banned){
          router.replace('/Banned')
        } else {
          router.replace('/(tabs)/Home');
        }
      } else {
        router.replace('/Login');
        console.log("Going Login");
      }
    } catch (error) {
      console.error('Navigation Error:', error);
    }
  };

  useFocusEffect(
    useCallback(()=>{
      if(!loading){
        checkSession();
      }
      // fetchSessionAndUserData();
    },[loading])
  )

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor}]}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      <ActivityIndicator size="large"/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  logo: {
    alignSelf: 'center',
    // width: 500,
    // height: 500,
    width: '60%',
    height: '30%',
    //margin: '5%'
    // margin: 25,
  },
});