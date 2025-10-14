import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, View, Text, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserContext } from './UserContext';

interface CustomDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function CustomDrawer({ visible, onClose }: CustomDrawerProps) {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const { userData, DarkMode, setIsDark } = useUserContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (userData?.is_admin) {
      setIsAdmin(true);
    }
  }, [userData]);

  return (
    <>
      {/* Overlay */}
      {visible && (
        <Pressable onPress={onClose} style={styles.overlay} />
      )}

      {/* Drawer Panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: DarkMode ? '#1c1c1e' : '#fff',
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.title, { color: DarkMode ? '#fff' : '#000' }]}>Settings</Text>

        {/* Drawer Items */}
        {isAdmin && (<Pressable style={styles.item} onPress={() => { router.push('/admin'); onClose();}}>
          <Text style={[styles.text, { color: DarkMode ? '#fff' : '#000' }]}>Admin Panel</Text>
        </Pressable>)}
        {/* <Pressable style={styles.item}>
          <Text style={[styles.text, { color: dark ? '#fff' : '#000' }]}>Account</Text>
        </Pressable>
        <Pressable style={styles.item}>
          <Text style={[styles.text, { color: dark ? '#fff' : '#000' }]}>Privacy</Text>
        </Pressable> */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={[styles.text, { color: DarkMode ? '#fff' : '#000' }]}>Dark Mode</Text>
          <Switch value={DarkMode} onValueChange={(value) => setIsDark(value)} />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: width * 0.6,
    paddingHorizontal: 20,
    paddingTop: 60,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
  },
});
