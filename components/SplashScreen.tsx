import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useUserContext } from './UserContext';

const { width, height } = Dimensions.get('window');

const splashData = [
  {
    id: '1',
    title: 'Welcome to Skill Swap!',
    description: 'Connect with people to exchange skills and grow together.',
    image: require('../assets/images/logo.png'), // Replace with your image path
  },
  {
    id: '2',
    title: 'Skill Matching',
    description: 'Find the perfect match for your skill needs.',
    image: require('../assets/images/logo.png'),
  },
  {
    id: '3',
    title: 'Schedule Meetings',
    description: 'Plan skill swaps with integrated scheduling features.',
    image: require('../assets/images/logo.png'),
  },
  {
    id: '4',
    title: 'Learn & Grow',
    description: 'Access paid courses and share your expertise.',
    image: require('../assets/images/logo.png'),
  },
  {
    id: '5',
    title: 'Get Started!',
    description: 'Sign up and begin your skill swap journey today.',
    image: require('../assets/images/logo.png'),
  },
];

interface SplashScreenProps {

    onFinish: () => void;
  
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {

    const { DarkMode } = useUserContext();

    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const colorScheme = useColorScheme();
    // const DarkMode = colorScheme === 'dark';
    const textColor = DarkMode ? '#fff' : '#000';
    const backgroundColor = DarkMode ? '#626262' : '#C7C7C7';
    const SecondaryBackgroundColor = DarkMode ? '#7F8487' : '#B2B2B2';
    const TertiaryBackgroundColor = DarkMode ? '#929292' : '#E7E7E7';
    const inputColor = DarkMode ? '#A7A7A7' : '#E7E7E7';
    const buttonColor = DarkMode ? '#333' : '#007BFF';
    const buttonTextColor = DarkMode ? '#fff' : '#fff';

    const handleNext = () => {
        if (currentIndex < splashData.length - 1) {
            setCurrentIndex(currentIndex + 1);
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            onFinish(); // Call the onFinish function passed as a prop
        }
    };

    const renderItem = ({ item }: { item: { id: string; title: string; description: string; image: any } }) => (
        <View style={styles.slide}>
            <Image source={item.image} style={styles.image} />
            <Text style={[styles.title, {color: textColor}]}>{item.title}</Text>
            <Text style={[styles.description, {color: textColor}]}>{item.description}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: backgroundColor }]}>
            <FlatList
            style= {styles.flatlist}
            ref={flatListRef}
            initialNumToRender={splashData.length}
            data={splashData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
            }}
            />
            <View style={styles.footer}>
            <View style={styles.dots}>
                {splashData.map((_, index) => (
                <View
                    key={index}
                    style={[
                    styles.dot,
                    { backgroundColor: index === currentIndex ? '#007BFF' : '#f5f5f5' },
                    ]}
                />
                ))}
            </View>
            <TouchableOpacity style={[styles.button, {backgroundColor: buttonColor}]} onPress={()=> handleNext()}>
                <Text style={[styles.buttonText, {color: buttonTextColor}]}>
                {currentIndex === splashData.length - 1 ? 'Get Started' : 'Next'}
                </Text>
            </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  flatlist: {
    flex: 0.75,
    width: '100%',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.5,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    //color: '#666',
    textAlign: 'center',
  },
  footer: {
    flex: 0.25,
    // position: 'absolute',
    // bottom: 50,
    width,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    //backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    //color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
