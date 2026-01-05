import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Dimensions, Modal, Pressable } from "react-native";
import { supabase } from "../lib/supabase"; // adjust path as needed
import { useUserContext } from "../components/UserContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

type Review = {
  id: string;
  user_id: string;
  rated_by: string;
  rating: number;
  review: string;
};

const { width, height } = Dimensions.get("window");

const Reviews = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const { usersData, allUsers, DarkMode } = useUserContext(); // all users from context
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [imageUri, setImageUri] = useState('');

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

   useEffect(() => {
      const currentUser = allUsers?.find((users: any) =>
        users?.id === userId
      );
  
      setUser(currentUser);
    }, [userId, allUsers]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // fetch reviews for this user
        const { data: reviewsData, error } = await supabase
          .from("ratings")
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;

        setReviews(reviewsData || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  const safeRating = Math.max(0, Math.min(5, Number(user?.rating) || 0));

  const fullStars = Math.floor(safeRating);
  const halfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const renderItem = ({ item }: { item: Review }) => {
    const reviewer: any = allUsers.find((u: any) => u.id === item.rated_by);

    return (
      <View style={[styles.card, { backgroundColor: TertiaryBackgroundColor }]}>
        <Image
          source={reviewer?.avatar_url ? { uri: reviewer.avatar_url } : require('./Avatar.png')}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: textColor }]}>{reviewer?.name || "Anonymous"}</Text>
          <Text style={[styles.rating, { color: textColor }]}>Rating: {item.rating} ⭐</Text>
          <Text style={[styles.reviewText, { color: textColor }]}>{item.review}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={[styles.container, { backgroundColor }]}>
          {/* Top Bar */}
          <View style={[styles.topBar, { backgroundColor: backgroundColor }]}>
            <Pressable style={{ paddingHorizontal: 15 }} onPress={router.back}>
              <FontAwesome name="arrow-left" size={20} color={textColor} />
            </Pressable>
    
            <View style={{ paddingHorizontal: 15 }}>
              <FontAwesome name="ellipsis-v" size={20} color={textColor} />
            </View>
          </View>
    
          {/* Header Image */}
          <View style={styles.headerContainer}>
            <Pressable onPress={() => {
              if(user?.header_url) {
                setImageUri(user?.header_url || '');
                setVisible(true);
              }
            }}>
            <Image
              source={user?.header_url ? { uri: user.header_url } : require('./Header.png')}
              style={styles.headerImage}
            />
            </Pressable>
            <Pressable  onPress={() => {
              if(user?.avatar_url) {
                setImageUri(user?.avatar_url || '');
                setVisible(true);
              }
            }}>
            <Image
              source={user?.avatar_url ? { uri: user.avatar_url } : require('./Avatar.png')}
              style={styles.userAvatar}
            />
            </Pressable>
          </View>
    
          <Modal visible={visible} transparent animationType="fade">
            <Pressable 
              onPress={() => setVisible(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.9)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                resizeMode="contain"
                style={{ width: "100%", height: "80%" }}
              />
            </Pressable>
          </Modal>
    
          <View style={{width: "100%", alignItems: "center", marginTop: 30}}>
            <View style={styles.userInfo}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: "center"}}>
                <Text style={[styles.userName, { color: textColor }]}>{user?.name}</Text>
                <View 
                  style={{ flexDirection: "row", alignItems: "center" }}
                  >
                  {/* Full Stars */}
                  {[...Array(fullStars)].map((_, i) => (
                    <FontAwesome key={`full-${i}`} name="star" size={20} color="gold" />
                  ))}
    
                  {/* Half Star */}
                  {halfStar && <FontAwesome name="star-half-full" size={20} color="gold" />}
    
                  {/* Empty Stars */}
                  {[...Array(emptyStars)].map((_, i) => (
                    <FontAwesome key={`empty-${i}`} name="star-o" size={20} color="grey" />
                  ))}
    
                  <Text style={{ marginLeft: 5, fontSize: 16, color: textColor }}>
                    ({user?.reviews})
                  </Text>
                </View>
              </View>
                
                <Text style={[styles.userName, { color: textColor, opacity: 0.6, marginBottom: 14 }]}>@{user?.username}</Text>
    
                {/* <Text style={[styles.userName, { color: textColor }]}>{user?.description}</Text> */}
            </View>
          </View>
        <Text style={{ marginLeft: width * 0.05, marginTop: height * 0.03, fontSize: 16, fontWeight: '600', color: textColor }}>Reviews:</Text>
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={{ fontSize: 16, fontWeight: 'bold', alignSelf: 'center', color: textColor }}>No reviews yet.</Text>}
    />
    </View>
  );
};

export default Reviews;

const styles = StyleSheet.create({
   container: { 
    flex: 1,
  },
  topBar: {
    width: '100%',
    height: height * 0.06,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  headerContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  userAvatar: {
    position: 'absolute',
    bottom: -20,
    left: 15,
    width: 80,
    height: 80,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700" 
  },
  userInfo: {
    width: '90%',
  },
//   userInfo: { 
//     width: '60%', 
//     flexDirection: "column", 
//     justifyContent: "center", 
//     alignItems: "flex-start",
//     paddingLeft: width * 0.02, 
//     marginTop: 0,
//   },
  userName: { 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 6 
  },
  card: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  rating: {
    marginTop: 2,
    fontSize: 14,
  },
  reviewText: {
    marginTop: 4,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
