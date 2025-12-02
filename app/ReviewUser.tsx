import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUserContext } from "../components/UserContext"; // adjust path if needed

export default function ReviewUser() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { userData, usersData, DarkMode, fetchSessionAndUserData } = useUserContext();
  const router = useRouter();

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>();
  const [loading, setLoading] = useState(false);

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

  async function submitRating(userId: string, ratedBy: string, rating: number) {
    const { data, error } = await supabase
        .from("ratings")
        .upsert(
        { user_id: userId, rated_by: ratedBy, rating: rating, review: review },
        { onConflict: "user_id,rated_by" }
        );

    if (error) {
        console.error(error);
        return { error };
    }

    return { data };
    }

    const user = usersData?.find((users: any) =>
        users?.id === userId
    );


  const handleRate = async () => {
    if (!rating) {
      Alert.alert("Select Rating", "Please tap a star to give a rating.");
      return;
    }

    try {
      setLoading(true);

      await submitRating(userId!, userData.id, rating);

      Alert.alert("Success", "Your rating has been submitted.");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong while submitting rating.");
    } finally {
      fetchSessionAndUserData();
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Rate This User</Text>

        <Image
            source={user?.avatar_url ? { uri: user.avatar_url } : require('./Avatar.png')}
            style={styles.avatar}
        />
        <Text style={[styles.name, { color: textColor }]}>{user?.name}</Text>

      <Text style={[styles.subtitle, { color: textColor }]}>Tap the stars to give your rating</Text>

      {/* INTERACTIVE STARS */}
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.8}
          >
            <FontAwesome
              name={star <= rating ? "star" : "star-o"}
              size={48}
              color={star <= rating ? "#FFD700" : "#B0B0B0"}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, {backgroundColor: inputColor}]}
        placeholder="Feedback"
        value={review}
        onChangeText={setReview}
        keyboardType="default"
        autoCapitalize="sentences"
      />

      <TouchableOpacity
        disabled={loading}
        onPress={handleRate}
        style={[styles.submitBtn, loading && { backgroundColor: buttonColor }, { backgroundColor: buttonColor }]}
      >
        <Text style={[styles.submitText, { color: buttonTextColor }]}>
          {loading ? "Submitting..." : "Submit Rating"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { 
    width: '60%', 
    height: 'auto', 
    aspectRatio: 1 
},
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
  name:{
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 40,
  },
  star: {
    marginHorizontal: 6,
  },
  input: {
    width: '80%',
    // padding: 10,
    height: 40,
    paddingRight: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 30,
  },
  submitBtn: {
    width: '30%',
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center',
  },
  submitText: {
    fontWeight: "600",
  },
});
