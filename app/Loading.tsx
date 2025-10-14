import { StyleSheet, ActivityIndicator, useColorScheme, Image } from 'react-native';
import { useUserContext } from '@/components/UserContext';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function Loading() {
  const {loading, session, DarkMode} = useUserContext();
  const colorScheme = useColorScheme();
  // const DarkMode = colorScheme === 'dark';
  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
  const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
  const TertiaryBackgroundColor = DarkMode ? '#828282' : '#E7E7E7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = DarkMode ? '#fff' : '#fff';

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
        router.replace('/(tabs)/Home');
        console.log("Going Home");
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