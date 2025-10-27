import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
  AppHeader,
  ProfilePictureUpload,
} from "@/components";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
  LINE_HEIGHT,
} from "@/constants";
import {
  useProfile,
  useUpdateProfile,
  isUserProfile,
} from "../../../hooks/useProfile";

// Validation schema for user profile
const userProfileSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  phone: yup
    .string()
    .test(
      "indian-phone",
      "Please enter a valid Indian phone number",
      (value) => {
        if (!value) return true; // Optional field

        // Remove all non-digit characters except +
        const cleanValue = value.replace(/[^\d+]/g, "");

        // Check if it's a valid Indian phone number
        // Pattern 1: 10 digits starting with 6,7,8,9 (e.g., 9876543210)
        // Pattern 2: +91 followed by 10 digits starting with 6,7,8,9 (e.g., +919876543210)
        const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;

        return indianPhoneRegex.test(cleanValue);
      }
    ),
  primaryAddress: yup.string(),
  primaryCity: yup.string(),
  primaryState: yup.string(),
  primaryZipCode: yup
    .string()
    .test(
      "indian-zipcode",
      "Please enter a valid Indian PIN code (6 digits)",
      (value) => {
        if (!value) return true; // Optional field

        // Indian PIN code validation: 6 digits
        const indianZipCodeRegex = /^[1-9][0-9]{5}$/;
        return indianZipCodeRegex.test(value);
      }
    ),
  primaryCountry: yup.string(),
});

type UserProfileFormData = yup.InferType<typeof userProfileSchema>;

export default function UserEditProfileScreen() {
  const router = useRouter();

  // Use TanStack Query hooks
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  // State for tracking profile picture upload
  const [isProfilePictureUploading, setIsProfilePictureUploading] =
    useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<UserProfileFormData>({
    resolver: yupResolver(userProfileSchema) as any,
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      primaryAddress: "",
      primaryCity: "",
      primaryState: "",
      primaryZipCode: "",
      primaryCountry: "India",
    },
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profileData && isUserProfile(profileData)) {
      reset({
        name: profileData.name || "",
        phone: profileData.phone || "",
        primaryAddress: profileData.primaryAddress || "",
        primaryCity: profileData.primaryCity || "",
        primaryState: profileData.primaryState || "",
        primaryZipCode: profileData.primaryZipCode || "",
        primaryCountry: profileData.primaryCountry || "India",
      });
    } else {
    }
  }, [profileData, reset, isLoadingProfile, profileError]);

  // Image picker functionality is now handled by ProfilePictureUpload component

  const onSubmit = async (data: any) => {
    try {
      await updateProfileMutation.mutateAsync(data);

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]
    );
  };

  return (
    <>
      <GlobalStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary[500]}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header */}
          <AppHeader onBackPress={handleCancel} title="Edit Profile" />

          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Picture Section */}
            <ResponsiveCard variant="elevated" style={styles.profileCard}>
              <View style={styles.profilePictureSection}>
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.sectionTitle}
                >
                  Profile Picture
                </ResponsiveText>

                <ProfilePictureUpload
                  currentAvatar={profileData?.avatar}
                  size={100}
                  showHint={true}
                  onUploadStateChange={setIsProfilePictureUploading}
                  onUploadSuccess={() => {
                    // Replace with profile screen after successful upload
                    router.replace("/(dashboard)/(user)/profile");
                  }}
                />
              </View>
            </ResponsiveCard>

            {/* Personal Information Form */}
            <ResponsiveCard variant="elevated" style={styles.formCard}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Personal Information
              </ResponsiveText>

              {/* Name Field */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Full Name *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.textInput,
                        errors.name && styles.inputError,
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Enter your full name"
                      placeholderTextColor={COLORS.text.secondary}
                    />
                  )}
                />
                {errors.name && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                  >
                    {errors.name.message}
                  </ResponsiveText>
                )}
              </View>

              {/* Email Display (Read-only) */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Email Address
                </ResponsiveText>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <ResponsiveText
                    variant="body1"
                    color={COLORS.text.primary}
                    style={styles.readOnlyText}
                  >
                    {profileData && isUserProfile(profileData)
                      ? profileData.email
                      : ""}
                  </ResponsiveText>
                </View>
                <ResponsiveText
                  variant="inputHelper"
                  color={COLORS.error[500]}
                  style={styles.helperText}
                >
                  Email cannot be updated from profile settings
                </ResponsiveText>
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Phone Number
                </ResponsiveText>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.textInput,
                        errors.phone && styles.inputError,
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Enter your phone number"
                      placeholderTextColor={COLORS.text.secondary}
                      keyboardType="phone-pad"
                    />
                  )}
                />
                {errors.phone && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                  >
                    {errors.phone.message}
                  </ResponsiveText>
                )}
              </View>

              {/* City, State, Zip Code Row */}
              <View style={styles.rowContainer}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <ResponsiveText
                    variant="inputLabel"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.inputLabel}
                  >
                    City
                  </ResponsiveText>
                  <Controller
                    control={control}
                    name="primaryCity"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.primaryCity && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="City"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />
                  {errors.primaryCity && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.primaryCity.message}
                    </ResponsiveText>
                  )}
                </View>

                <View
                  style={[styles.inputGroup, styles.flex1, { marginLeft: 10 }]}
                >
                  <ResponsiveText
                    variant="inputLabel"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.inputLabel}
                  >
                    State
                  </ResponsiveText>
                  <Controller
                    control={control}
                    name="primaryState"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.primaryState && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="State"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />
                  {errors.primaryState && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.primaryState.message}
                    </ResponsiveText>
                  )}
                </View>
              </View>

              {/* Zip Code and Country Row */}
              <View style={styles.rowContainer}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <ResponsiveText
                    variant="inputLabel"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.inputLabel}
                  >
                    Zip Code
                  </ResponsiveText>
                  <Controller
                    control={control}
                    name="primaryZipCode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.primaryZipCode && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="123456"
                        placeholderTextColor={COLORS.text.secondary}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    )}
                  />
                  {errors.primaryZipCode && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.primaryZipCode.message}
                    </ResponsiveText>
                  )}
                </View>

                <View
                  style={[styles.inputGroup, styles.flex1, { marginLeft: 10 }]}
                >
                  <ResponsiveText
                    variant="inputLabel"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.inputLabel}
                  >
                    Country
                  </ResponsiveText>
                  <Controller
                    control={control}
                    name="primaryCountry"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.primaryCountry && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Country"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />
                  {errors.primaryCountry && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.primaryCountry.message}
                    </ResponsiveText>
                  )}
                </View>
              </View>

              {/* Landmark Field */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Landmark
                </ResponsiveText>
                <Controller
                  control={control}
                  name="primaryAddress"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.textArea,
                        errors.primaryAddress && styles.inputError,
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Enter your landmark"
                      placeholderTextColor={COLORS.text.secondary}
                      multiline
                      numberOfLines={2}
                    />
                  )}
                />
                {errors.primaryAddress && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                  >
                    {errors.primaryAddress.message}
                  </ResponsiveText>
                )}
              </View>
            </ResponsiveCard>
          </KeyboardAwareScrollView>

          {/* Fixed Footer Action Buttons */}
          <View style={styles.fixedFooter}>
            <View style={styles.buttonContainer}>
              <ResponsiveButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={handleCancel}
                disabled={isProfilePictureUploading}
                leftIcon={
                  <Ionicons name="close" size={20} color={COLORS.error[500]} />
                }
                style={[styles.cancelButton, styles.halfWidthButton] as any}
                textStyle={styles.cancelButtonText}
              />

              <ResponsiveButton
                title={
                  updateProfileMutation.isPending ? "Saving..." : "Save Changes"
                }
                variant="primary"
                size="medium"
                onPress={handleSubmit(onSubmit)}
                disabled={
                  updateProfileMutation.isPending ||
                  isLoadingProfile ||
                  isProfilePictureUploading
                }
                style={[styles.saveButton, styles.halfWidthButton] as any}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING.screen,
    paddingBottom: 150, // Add padding for fixed footer
  },
  profileCard: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
  },
  profilePictureSection: {
    alignItems: "center",
    paddingVertical: MARGIN.md,
  },
  sectionTitle: {
    marginBottom: MARGIN.lg,
  },
  formCard: {
    marginBottom: MARGIN.md,
  },
  inputGroup: {
    marginBottom: MARGIN.lg,
  },
  inputLabel: {
    marginBottom: MARGIN.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: COLORS.error[500],
  },
  readOnlyInput: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.light,
    justifyContent: "center",
  },
  readOnlyText: {
    fontSize: 16,
    lineHeight: 20,
  },
  helperText: {
    marginTop: 4,
    fontStyle: "italic",
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: MARGIN.xs,
    gap: MARGIN.md,
  },
  halfWidthButton: {
    flex: 1,
    minHeight: LAYOUT.buttonHeight,
    paddingVertical: PADDING.button,
  },
  cancelButton: {
    borderColor: COLORS.error[500],
    borderWidth: 1,
    backgroundColor: COLORS.background.primary,
  },
  cancelButtonText: {
    color: COLORS.error[500],
    fontSize: FONT_SIZE.button,
    lineHeight: LINE_HEIGHT.button,
  },
  saveButton: {
    // Size is handled by halfWidthButton
  },
  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.md,
    paddingBottom: PADDING.lg, // Extra padding for safe area
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  flex1: {
    flex: 1,
  },
});
