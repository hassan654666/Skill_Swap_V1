import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';

export default function Schedule() {
  const navigation = useNavigation();

    return (
      <View style= {styles.container}>
        <Text style= {styles.title}>Schedule</Text>
        <View style = {styles.navbar}>
                    <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Home')}>
                      <Text style={styles.buttonText}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('SkillSwap')}>
                      <Text style={styles.buttonText}>Skill Swap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style ={styles.button} onPress={() => navigation.navigate('Schedule')}>
                      <Text style={styles.buttonText}>Schedule</Text>
                    </TouchableOpacity>
                  </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      //padding: 16,
      backgroundColor: '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    navbar: {
      position: 'absolute', // Make the navbar absolute
      bottom: 0, // Stick it to the bottom
      flex: 0.08,
      flexDirection: 'row',
      width: '100%',
      //alignItems: 'center',
      gap: 10,
      backgroundColor: 'black',
      // padding: 15,
      // marginBottom: 10,
      // marginTop: 10,
    },
    button: {
      width: '32%',
      padding: 20,
      borderRadius: 8,
      alignItems: 'center',
      //backgroundColor: '#007BFF',
    },
    buttonText: {
      color: '#f5f5f5',
      fontWeight: 'bold',
    },
  })