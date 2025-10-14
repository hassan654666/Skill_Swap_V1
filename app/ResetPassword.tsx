import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, useColorScheme, BackHandler, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useUserContext } from '@/components/UserContext';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [localUserData, setLocalUserData] = useState<any>(null);

  const { DarkMode } = useUserContext();
  //const colorScheme = useColorScheme();
  const router = useRouter();

  const textColor = DarkMode ? '#fff' : '#000';
  const backgroundColor = DarkMode ? '#626262ff' : '#C7C7C7';
  const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
  const buttonColor = DarkMode ? '#333' : '#007BFF';
  const buttonTextColor = '#fff';

  // --- Restore Supabase session if opened via deep link ---
  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        console.log('Deep link URL:', url);

        // Step 1: Try to get current session
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession.session) {
          setUserEmail(existingSession.session.user?.email || '');
          setLoading(false);
          return;
        }

        // Step 2: If no existing session, parse tokens from deep link
        if (url && url.includes('#')) {
          const hash = url.split('#')[1];
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;

            console.log('Session restored from deep link');
            setUserEmail(data.session?.user?.email || '');
          } else {
            console.warn('No tokens found in deep link.');
          }
        } else {
          console.log('No deep link detected, waiting for in-app session.');
          const { data } = await supabase.auth.getSession();
          setUserEmail(data.session?.user?.email || '');
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setLoading(false);
      }
    };

    handleDeepLink();
  }, []);

  // --- Fetch user data once email is known ---
  useEffect(() => {
    if (!userEmail) return;
    const getUserData = async () => {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .single();

      setLocalUserData(userData);
    };
    getUserData();
  }, [userEmail]);

  const backAction = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/Home');
    }
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [router])
  );

  const changePassword = async () => {
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert('Success', 'Password reset successfully!');
      router.replace('/Login');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={buttonColor} />
      </View>
    );
  }

  console.log('Reset Password rendered');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
      <Image
        source={localUserData?.avatar_url ? { uri: localUserData.avatar_url } : require('./Avatar.png')}
        style={styles.logo}
      />
      <View style={styles.content}>
        <Text style={[styles.name, { color: textColor }]}>Name: {localUserData?.name}</Text>
        <Text style={[styles.userName, { color: textColor }]}>Username: @{localUserData?.username}</Text>
        <Text style={[styles.userName, { color: textColor }]}>Email: {userEmail}</Text>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: inputColor }]}
        placeholder="Enter new Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={[styles.input, { backgroundColor: inputColor }]}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor }]} onPress={changePassword}>
        <Text style={[styles.buttonText, { color: buttonTextColor }]}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor }]} onPress={backAction}>
        <Text style={[styles.buttonText, { color: buttonTextColor }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  logo: { width: '60%', height: 'auto', aspectRatio: 1 },
  title: { fontSize: 40, fontWeight: 'bold', marginBottom: 20 },
  content: { flex: 0.5, justifyContent: 'center', alignItems: 'center', padding: 40 },
  name: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 5 },
  userName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', padding: 5 },
  input: { width: '80%', padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 20 },
  button: { width: '25%', padding: 10, borderRadius: 8, alignItems: 'center', margin: 5 },
  buttonText: { fontWeight: 'bold' },
});
