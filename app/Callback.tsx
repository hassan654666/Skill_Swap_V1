import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { View, ActivityIndicator, StyleSheet, Image } from "react-native";
import * as Linking from "expo-linking";
import { useUserContext } from "@/components/UserContext";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function Callback() {

  const {DarkMode, fetchSessionAndUserData} = useUserContext();
  
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

  const params = useLocalSearchParams<{ code?: string; token?: string; type?: string }>(); // Supabase sends ?token=...&type=signup
   const authParam = params.code ? params.code : params.token;

  useEffect(() => {
    const confirmEmail = async () => {
      if (!authParam) return;

      // Confirm email by exchanging token
      // const { data, error } = await supabase.auth.verifyOtp({ type: "signup", token: token as string });
      const { data, error } = await supabase.auth.exchangeCodeForSession(authParam as string);

      if (error) {
        console.log("Email confirmation failed", error.message);
        return;
      }

      // User email confirmed, now redirect to CompleteProfile
      router.replace("/CompleteProfile");
    };

    confirmEmail();
  }, [authParam]);

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
