import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import serviceService from "@/services/service";

interface ServiceImageUploadProps {
  image: string | null;
  onImageChange: (image: string | null) => void;
  showHint?: boolean;
}

export const ServiceImageUpload: React.FC<ServiceImageUploadProps> = ({
  image,
  onImageChange,
  showHint = true,
}) => {
  const requestPermissions = async () => {
    console.log("=== REQUESTING PERMISSIONS ===");

    // Check current permission status
    const currentStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
    console.log("Current permission status:", currentStatus);

    if (currentStatus.status === "granted") {
      console.log("Permission already granted");
      return true;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Permission request result:", status);

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to upload service images. You can enable this in your device settings."
      );
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    try {
      console.log("=== IMAGE PICKER START ===");

      const hasPermission = await requestPermissions();
      console.log("Permission granted:", hasPermission);
      if (!hasPermission) return;

      console.log("Launching image library...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: false, // Try without editing first
        quality: 0.8,
        base64: false,
      });

      console.log("Image picker result:", result);
      console.log("Canceled:", result.canceled);
      console.log("Assets:", result.assets);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log("Selected asset:", result.assets[0]);
        handleImageSelected(result.assets[0]);
      } else {
        console.log("No image selected or picker was canceled");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open image picker. Please try again.");
    }
  };

  const handleImageSelected = async (
    imageAsset: ImagePicker.ImagePickerAsset
  ) => {
    console.log("=== IMAGE SELECTED ===");
    console.log("Image Asset:", imageAsset);
    console.log("Asset URI:", imageAsset.uri);
    console.log("Asset Type:", imageAsset.type);
    console.log("Asset FileName:", imageAsset.fileName);

    // Store the local URI first - upload will happen when user clicks "Next"
    onImageChange(imageAsset.uri);
  };

  const removeImage = () => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onImageChange(null);
        },
      },
    ]);
  };

  const renderImageUpload = () => {
    if (!image) {
      return (
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={handleImagePicker}
          activeOpacity={0.7}
        >
          <Ionicons
            name="cloud-upload"
            size={48}
            color={COLORS.text.secondary}
          />
          <ResponsiveText
            variant="h6"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.uploadTitle}
          >
            Upload Service Image
          </ResponsiveText>
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.uploadInstructions}
          >
            Add a photo of your service or business
          </ResponsiveText>
          <ResponsiveText
            variant="caption2"
            color={COLORS.text.secondary}
            style={styles.uploadRequirements}
          >
            JPG, PNG up to 5MB
          </ResponsiveText>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
          <Ionicons name="close" size={16} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={handleImagePicker}
        >
          <Ionicons name="pencil" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return <View style={styles.container}>{renderImageUpload()}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  uploadArea: {
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.neutral[50],
    alignItems: "center",
    justifyContent: "center",
    padding: PADDING.lg,
  },
  uploadTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  uploadInstructions: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
  },
  uploadRequirements: {
    textAlign: "center",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.neutral[100],
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error[500],
    justifyContent: "center",
    alignItems: "center",
  },
  changeButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    textAlign: "center",
    marginTop: MARGIN.sm,
  },
});
