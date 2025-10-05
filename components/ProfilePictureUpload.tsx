import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ResponsiveText } from "./UI/ResponsiveText";
import { COLORS, MARGIN } from "@/constants";
import {
  useProfilePicture,
  useUploadProfilePicture,
} from "@/hooks/useProfilePicture";

interface ProfilePictureUploadProps {
  currentAvatar?: string;
  size?: number;
  showHint?: boolean;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatar,
  size = 100,
  showHint = true,
  onUploadStateChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const { data: profilePictureData, isLoading: isLoadingPicture } =
    useProfilePicture();
  const uploadMutation = useUploadProfilePicture();

  // Use profile picture data if available, otherwise fall back to currentAvatar
  const imageUrl = profilePictureData?.data?.url || currentAvatar;

  // Notify parent component of upload state changes
  useEffect(() => {
    onUploadStateChange?.(isUploading || uploadMutation.isPending);
  }, [isUploading, uploadMutation.isPending, onUploadStateChange]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to upload profile pictures."
      );
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open image picker. Please try again.");
    }
  };

  const uploadImage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);

      // Debug: Check if we have a token
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const token = await AsyncStorage.getItem("accessToken");

      const file = {
        uri: imageAsset.uri,
        type: "image/jpeg",
        fileName: `profile-picture-${Date.now()}.jpg`,
      };

      await uploadMutation.mutateAsync(file);

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        "Failed to upload profile picture. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {isLoadingPicture ? (
          <View
            style={[styles.avatarPlaceholder, { width: size, height: size }]}
          >
            <ActivityIndicator size="small" color={COLORS.primary[500]} />
          </View>
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.avatarImage, { width: size, height: size }]}
          />
        ) : (
          <View
            style={[styles.avatarPlaceholder, { width: size, height: size }]}
          >
            <Ionicons
              name="person"
              size={size * 0.4}
              color={COLORS.text.secondary}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.editAvatarButton,
            {
              width: size * 0.32,
              height: size * 0.32,
              borderRadius: size * 0.16,
            },
          ]}
          onPress={handleImagePicker}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="camera" size={size * 0.16} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {showHint && (
        <ResponsiveText
          variant="caption2"
          color={COLORS.text.secondary}
          style={styles.avatarHint}
        >
          Tap to change profile picture
        </ResponsiveText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: MARGIN.sm,
  },
  avatarPlaceholder: {
    borderRadius: 50,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  avatarImage: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary[300],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarHint: {
    textAlign: "center",
  },
});
