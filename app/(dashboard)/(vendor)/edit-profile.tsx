import React, { useState, useEffect } from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
  LINE_HEIGHT,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";

import {
  useProfile,
  useUpdateProfile,
  isVendorProfile,
  BusinessAddress,
} from "../../../hooks/useProfile";

import { useUser } from "../../../hooks/useUser";

import { userService } from "@/services/user";

// Remove duplicate BusinessAddress type since it's imported from useProfile

// Validation schema for vendor profile

const vendorProfileSchema = yup.object({
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
  businessAddress: yup.string(),
  businessCity: yup.string(),
  businessState: yup.string(),
  businessZipCode: yup
    .string()
    .test(
      "indian-zipcode",
      "Please enter a valid Indian zip code (6 digits)",
      (value) => {
        if (!value) return true; // Optional field
        // Indian zip codes are 6 digits
        const zipCodeRegex = /^[1-9][0-9]{5}$/;
        return zipCodeRegex.test(value);
      }
    ),
  businessCountry: yup.string(),
  addressType: yup
    .string()
    .test(
      "address-type-validation",
      "Address type is required when adding addresses",
      function (value) {
        const {
          businessAddress,
          businessCity,
          businessState,
          businessZipCode,
        } = this.parent;
        const hasAddressData =
          businessAddress || businessCity || businessState || businessZipCode;

        // Only require addressType if user is filling address fields
        if (hasAddressData && (!value || value.trim().length === 0)) {
          return this.createError({ message: "Address type is required" });
        }

        // If addressType is provided, validate length
        if (value && value.trim().length > 0) {
          if (value.trim().length < 2 || value.trim().length > 50) {
            return this.createError({
              message: "Address type must be between 2 and 50 characters",
            });
          }
        }

        return true;
      }
    ),
});

type VendorProfileFormData = {
  name: string;

  phone: string;

  businessAddress: string;

  businessCity: string;

  businessState: string;

  businessZipCode: string;

  businessCountry: string;

  addressType: string;
};

export default function VendorEditProfileScreen() {
  const router = useRouter();

  const [additionalAddresses, setAdditionalAddresses] = useState<any[]>([]);

  // Functions to handle additional addresses

  const addAdditionalAddress = () => {
    const newAddress = {
      id: Date.now(),
      addressType: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    };
    setAdditionalAddresses((prev) => [...prev, newAddress]);
  };

  const removeAdditionalAddress = (id: number) => {
    setAdditionalAddresses((prev) =>
      prev.filter((address) => address.id !== id)
    );
  };

  const updateAdditionalAddress = (
    id: number,
    field: string,
    value: string
  ) => {
    setAdditionalAddresses((prev) =>
      prev.map((address) =>
        address.id === id ? { ...address, [field]: value } : address
      )
    );
  };

  // Use TanStack Query hooks

  const {
    data: profileData,

    isLoading: isLoadingProfile,

    error: profileError,
  } = useProfile();

  const updateProfileMutation = useUpdateProfile();

  // Also get user data to check role

  const { data: userData } = useUser();

  // State for saved addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // State for pending new addresses (to be added)
  const [pendingAddresses, setPendingAddresses] = useState<any[]>([]);

  // State for inline editing
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressData, setEditingAddressData] = useState<any>(null);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [isProfilePictureUploading, setIsProfilePictureUploading] =
    useState(false);

  const {
    control,

    handleSubmit,

    formState: { errors, isValid },

    reset,

    setValue,
    getValues,
  } = useForm<VendorProfileFormData>({
    resolver: yupResolver(vendorProfileSchema) as any,

    mode: "onChange",

    defaultValues: {
      name: "",

      phone: "",

      businessAddress: "",

      businessCity: "",

      businessState: "",

      businessZipCode: "",

      businessCountry: "India",

      addressType: "",
    },
  });

  // Update form when profile data is loaded (only for name and phone)
  useEffect(() => {
    // Only populate name and phone fields, keep address fields empty for new entry
    if (profileData) {
      // Only set name and phone, keep address fields empty
      setValue("name", profileData.name || "");
      setValue("phone", profileData.phone || "");

      // Set saved addresses for card display
      const businessAddresses = (profileData as any).businessAddresses || [];
      setSavedAddresses(businessAddresses);
    }
  }, [profileData, setValue]);

  // Image picker functionality is now handled by ProfilePictureUpload component

  // Add address to pending list
  const handleAddToPending = (data: any) => {
    const newAddress = {
      name: data.addressType || `Address ${pendingAddresses.length + 1}`,
      address: data.businessAddress || "",
      city: data.businessCity || "",
      state: data.businessState || "",
      zipCode: data.businessZipCode || "",
      country: data.businessCountry || "India",
      description: "",
      isPrimary: false, // Will be set when submitting
    };

    setPendingAddresses((prev) => [...prev, newAddress]);

    // Clear the form for next address entry
    reset({
      name: data.name, // Keep name and phone
      phone: data.phone,
      addressType: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessZipCode: "",
      businessCountry: "India",
    });

    Alert.alert("Success", "Address added to pending list!", [{ text: "OK" }]);
  };

  // Remove address from pending list
  const handleRemovePending = (index: number) => {
    setPendingAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit all pending addresses
  const handleSubmitPending = async () => {
    if (pendingAddresses.length === 0) {
      Alert.alert("No Pending Addresses", "Please add some addresses first.", [
        { text: "OK" },
      ]);
      return;
    }

    try {
      // Set first pending address as primary if no existing addresses
      const addressesWithPrimary = pendingAddresses.map((addr, index) => ({
        ...addr,
        isPrimary: savedAddresses.length === 0 && index === 0,
      }));

      // Combine existing addresses with pending ones
      const allAddresses = [...savedAddresses, ...addressesWithPrimary];

      const transformedData = {
        name: getValues("name"),
        phone: getValues("phone"),
        businessAddresses: allAddresses,
      };

      await updateProfileMutation.mutateAsync(transformedData);

      // Update local state
      setSavedAddresses(allAddresses);
      setPendingAddresses([]);

      Alert.alert(
        "Success",
        `${pendingAddresses.length} addresses added successfully!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error adding addresses:", error);
      Alert.alert("Error", "Failed to add addresses. Please try again.");
    }
  };

  // Handle edit address
  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setEditingAddressData({ ...address });
  };

  // Handle editing address data changes
  const handleEditingAddressChange = (field: string, value: string) => {
    setEditingAddressData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditingAddressData(null);
  };

  // Handle save edited address
  const handleSaveAddress = async (addressId: string) => {
    try {
      setIsUpdatingAddress(true);

      // Call API to update address
      const updatedAddress = await userService.updateBusinessAddress(
        addressId,
        editingAddressData
      );

      // Update local state with the response from API
      setSavedAddresses((prev) =>
        prev.map((addr) => (addr.id === addressId ? updatedAddress : addr))
      );

      setEditingAddressId(null);
      setEditingAddressData(null);

      Alert.alert("Success", "Address updated successfully!");
    } catch (error) {
      console.error("Error updating address:", error);
      Alert.alert("Error", "Failed to update address. Please try again.");
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingAddress(true);

              // Call API to delete address
              await userService.deleteBusinessAddress(addressId);

              // Update local state
              setSavedAddresses((prev) =>
                prev.filter((addr) => addr.id !== addressId)
              );

              Alert.alert("Success", "Address deleted successfully!");
            } catch (error) {
              console.error("Error deleting address:", error);
              Alert.alert(
                "Error",
                "Failed to delete address. Please try again."
              );
            } finally {
              setIsDeletingAddress(false);
            }
          },
        },
      ]
    );
  };

  const onSubmit = async (data: any) => {
    try {
      // Create the structured data object
      const formData = {
        name: data.name || "",
        phone: data.phone || "",
        addresses: [] as any[],
      };

      // Check if user wants to add addresses by checking if any address fields are filled
      const hasMainAddressData =
        data.addressType ||
        data.businessAddress ||
        data.businessCity ||
        data.businessState ||
        data.businessZipCode;

      const hasAdditionalAddressData = additionalAddresses.some(
        (addr) =>
          addr.addressType ||
          addr.address ||
          addr.city ||
          addr.state ||
          addr.zipCode
      );

      const hasAddressData = hasMainAddressData || hasAdditionalAddressData;

      // Only process addresses if user actually filled address fields
      if (hasAddressData) {
        // Add main form address if it has data
        if (hasMainAddressData) {
          const mainAddress = {
            name: data.addressType || "Address",
            address: data.businessAddress || "",
            city: data.businessCity || "",
            state: data.businessState || "",
            zipCode: data.businessZipCode || "",
            country: data.businessCountry || "India",
            description: "",
            isPrimary: false,
          };
          formData.addresses.push(mainAddress);
        }

        // Add additional form addresses if they have data
        additionalAddresses.forEach((address) => {
          if (
            address.addressType ||
            address.address ||
            address.city ||
            address.state ||
            address.zipCode
          ) {
            const additionalAddress = {
              name: address.addressType || "Address",
              address: address.address || "",
              city: address.city || "",
              state: address.state || "",
              zipCode: address.zipCode || "",
              country: address.country || "India",
              description: "",
              isPrimary: false,
            };
            formData.addresses.push(additionalAddress);
          }
        });
      }

      // Prepare update data - only include addresses if user wants to add them
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
      };

      // Only include businessAddresses if user actually filled address fields
      if (hasAddressData && formData.addresses.length > 0) {
        updateData.businessAddresses = formData.addresses;
      }

      await updateProfileMutation.mutateAsync(updateData);

      // Clear all forms after successful submission
      reset({
        name: formData.name, // Keep name and phone
        phone: formData.phone,
        addressType: "",
        businessAddress: "",
        businessCity: "",
        businessState: "",
        businessZipCode: "",
        businessCountry: "India",
      });

      // Reset additional addresses to empty state
      setAdditionalAddresses([]);

      // Show appropriate success message
      if (hasAddressData && formData.addresses.length > 0) {
        Alert.alert(
          "Success",
          `${formData.addresses.length} address(es) added successfully!`
        );
      } else {
        Alert.alert("Success", "Profile updated successfully!");
      }
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
                    router.replace("/(dashboard)/(vendor)/profile");
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
                    {profileData && profileData.email ? profileData.email : ""}
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
            </ResponsiveCard>

            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <ResponsiveCard variant="elevated" style={styles.formCard}>
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.sectionTitle}
                >
                  📍 Saved Addresses
                </ResponsiveText>

                {savedAddresses.map((address, index) => (
                  <View key={address.id || index} style={styles.addressCard}>
                    {editingAddressId === address.id ? (
                      // Edit Mode
                      <View>
                        <View style={styles.addressCardHeader}>
                          <View style={styles.addressCardTitle}>
                            <Ionicons
                              name="location"
                              size={16}
                              color={COLORS.primary[500]}
                              style={styles.addressIcon}
                            />
                            <ResponsiveText
                              variant="body1"
                              weight="semiBold"
                              color={COLORS.text.primary}
                            >
                              Edit Address
                            </ResponsiveText>
                          </View>
                          <View style={styles.addressCardActions}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.saveButton]}
                              onPress={() => handleSaveAddress(address.id)}
                              disabled={isUpdatingAddress}
                            >
                              {isUpdatingAddress ? (
                                <Ionicons
                                  name="hourglass"
                                  size={16}
                                  color={COLORS.text.secondary}
                                />
                              ) : (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color={COLORS.success[500]}
                                />
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.cancelButton]}
                              onPress={handleCancelEdit}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color={COLORS.error[500]}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Edit Form Fields */}
                        <View style={styles.editFormContainer}>
                          {/* Address Type */}
                          <View style={styles.editInputGroup}>
                            <ResponsiveText
                              variant="inputLabel"
                              weight="medium"
                              color={COLORS.text.primary}
                              style={styles.editInputLabel}
                            >
                              Address Type
                            </ResponsiveText>
                            <TextInput
                              style={styles.editTextInput}
                              value={editingAddressData?.name || ""}
                              onChangeText={(value) =>
                                handleEditingAddressChange("name", value)
                              }
                              placeholder="e.g., Home, Shop 1, Shop 2"
                              placeholderTextColor={COLORS.text.secondary}
                            />
                          </View>

                          {/* Address */}
                          <View style={styles.editInputGroup}>
                            <ResponsiveText
                              variant="inputLabel"
                              weight="medium"
                              color={COLORS.text.primary}
                              style={styles.editInputLabel}
                            >
                              Address
                            </ResponsiveText>
                            <TextInput
                              style={styles.editTextInput}
                              value={editingAddressData?.address || ""}
                              onChangeText={(value) =>
                                handleEditingAddressChange("address", value)
                              }
                              placeholder="Enter your address"
                              placeholderTextColor={COLORS.text.secondary}
                            />
                          </View>

                          {/* City, State, Zip Row */}
                          <View style={styles.editRowContainer}>
                            <View style={[styles.editInputGroup, styles.flex1]}>
                              <ResponsiveText
                                variant="inputLabel"
                                weight="medium"
                                color={COLORS.text.primary}
                                style={styles.editInputLabel}
                              >
                                City
                              </ResponsiveText>
                              <TextInput
                                style={styles.editTextInput}
                                value={editingAddressData?.city || ""}
                                onChangeText={(value) =>
                                  handleEditingAddressChange("city", value)
                                }
                                placeholder="City"
                                placeholderTextColor={COLORS.text.secondary}
                              />
                            </View>
                            <View
                              style={[
                                styles.editInputGroup,
                                styles.flex1,
                                styles.marginLeft,
                              ]}
                            >
                              <ResponsiveText
                                variant="inputLabel"
                                weight="medium"
                                color={COLORS.text.primary}
                                style={styles.editInputLabel}
                              >
                                State
                              </ResponsiveText>
                              <TextInput
                                style={styles.editTextInput}
                                value={editingAddressData?.state || ""}
                                onChangeText={(value) =>
                                  handleEditingAddressChange("state", value)
                                }
                                placeholder="State"
                                placeholderTextColor={COLORS.text.secondary}
                              />
                            </View>
                            <View
                              style={[
                                styles.editInputGroup,
                                styles.flex1,
                                styles.marginLeft,
                              ]}
                            >
                              <ResponsiveText
                                variant="inputLabel"
                                weight="medium"
                                color={COLORS.text.primary}
                                style={styles.editInputLabel}
                              >
                                Zip Code
                              </ResponsiveText>
                              <TextInput
                                style={styles.editTextInput}
                                value={editingAddressData?.zipCode || ""}
                                onChangeText={(value) =>
                                  handleEditingAddressChange("zipCode", value)
                                }
                                placeholder="Zip Code"
                                placeholderTextColor={COLORS.text.secondary}
                              />
                            </View>
                          </View>

                          {/* Country */}
                          <View style={styles.editInputGroup}>
                            <ResponsiveText
                              variant="inputLabel"
                              weight="medium"
                              color={COLORS.text.primary}
                              style={styles.editInputLabel}
                            >
                              Country
                            </ResponsiveText>
                            <TextInput
                              style={styles.editTextInput}
                              value={editingAddressData?.country || ""}
                              onChangeText={(value) =>
                                handleEditingAddressChange("country", value)
                              }
                              placeholder="Country"
                              placeholderTextColor={COLORS.text.secondary}
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      // View Mode
                      <View>
                        <View style={styles.addressCardHeader}>
                          <View style={styles.addressCardTitle}>
                            <Ionicons
                              name="location"
                              size={16}
                              color={COLORS.primary[500]}
                              style={styles.addressIcon}
                            />
                            <ResponsiveText
                              variant="body1"
                              weight="semiBold"
                              color={COLORS.text.primary}
                            >
                              {address.name || `Address ${index + 1}`}
                            </ResponsiveText>
                          </View>
                          <View style={styles.addressCardActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleEditAddress(address)}
                            >
                              <Ionicons
                                name="pencil"
                                size={16}
                                color={COLORS.primary[500]}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDeleteAddress(address.id)}
                              disabled={isDeletingAddress}
                            >
                              {isDeletingAddress ? (
                                <Ionicons
                                  name="hourglass"
                                  size={16}
                                  color={COLORS.text.secondary}
                                />
                              ) : (
                                <Ionicons
                                  name="trash"
                                  size={16}
                                  color={COLORS.error[500]}
                                />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>

                        <ResponsiveText
                          variant="body2"
                          color={COLORS.text.secondary}
                          style={styles.addressDetails}
                        >
                          {address.address && `${address.address}, `}
                          {address.city && `${address.city}, `}
                          {address.state && `${address.state} `}
                          {address.zipCode && `${address.zipCode}, `}
                          {address.country}
                        </ResponsiveText>
                      </View>
                    )}
                  </View>
                ))}
              </ResponsiveCard>
            )}

            {/* Pending Addresses Section */}
            {pendingAddresses.length > 0 && (
              <ResponsiveCard variant="elevated" style={styles.formCard}>
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.sectionTitle}
                >
                  ⏳ Pending Addresses ({pendingAddresses.length})
                </ResponsiveText>
                {pendingAddresses.map((address, index) => (
                  <View key={index} style={styles.pendingAddressCard}>
                    <View style={styles.pendingAddressHeader}>
                      <View style={styles.pendingAddressTitle}>
                        <Ionicons
                          name="time"
                          size={16}
                          color={COLORS.warning[500]}
                          style={styles.addressIcon}
                        />
                        <ResponsiveText
                          variant="body1"
                          weight="semiBold"
                          color={COLORS.text.primary}
                        >
                          {address.name}
                        </ResponsiveText>
                      </View>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRemovePending(index)}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color={COLORS.error[500]}
                        />
                      </TouchableOpacity>
                    </View>
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                      style={styles.addressDetails}
                    >
                      {address.address && `${address.address}, `}
                      {address.city && `${address.city}, `}
                      {address.state && `${address.state} `}
                      {address.zipCode && `${address.zipCode}, `}
                      {address.country}
                    </ResponsiveText>
                  </View>
                ))}
                <View style={styles.pendingActions}>
                  <ResponsiveButton
                    title={`Save All ${pendingAddresses.length} Addresses`}
                    onPress={handleSubmitPending}
                    variant="primary"
                    size="medium"
                    style={styles.saveAllButton}
                  />
                </View>
              </ResponsiveCard>
            )}

            {/* Add New Address Form */}
            <ResponsiveCard variant="elevated" style={styles.formCard}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                ➕ Add New Address
              </ResponsiveText>

              {/* Address Type */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Address Type
                </ResponsiveText>

                <Controller
                  control={control}
                  name="addressType"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.textInput,

                        errors.addressType && styles.inputError,
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="e.g., Home, Shop 1, Shop 2, Shop 3, Office"
                      placeholderTextColor={COLORS.text.secondary}
                    />
                  )}
                />

                {errors.addressType && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                  >
                    {errors.addressType.message}
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
                    name="businessCity"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,

                          errors.businessCity && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="City"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />

                  {errors.businessCity && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.businessCity.message}
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
                    name="businessState"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,

                          errors.businessState && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="State"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />

                  {errors.businessState && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.businessState.message}
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
                    name="businessZipCode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,

                          errors.businessZipCode && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Zip Code"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />

                  {errors.businessZipCode && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.businessZipCode.message}
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
                    name="businessCountry"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.textInput,

                          errors.businessCountry && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Country"
                        placeholderTextColor={COLORS.text.secondary}
                      />
                    )}
                  />

                  {errors.businessCountry && (
                    <ResponsiveText
                      variant="inputHelper"
                      color={COLORS.error[500]}
                    >
                      {errors.businessCountry.message}
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
                  name="businessAddress"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.textInput,

                        styles.textArea,

                        errors.businessAddress && styles.inputError,
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

                {errors.businessAddress && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                  >
                    {errors.businessAddress.message}
                  </ResponsiveText>
                )}
              </View>
            </ResponsiveCard>

            {/* Additional Address Cards */}

            {additionalAddresses.map((address, index) => (
              <ResponsiveCard
                key={address.id}
                variant="elevated"
                style={styles.formCard}
              >
                <View style={styles.additionalAddressHeader}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.sectionTitle}
                  >
                    Address {index + 2}
                  </ResponsiveText>

                  <TouchableOpacity
                    onPress={() => removeAdditionalAddress(address.id)}
                    style={styles.removeAddressButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={COLORS.error[500]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Address Type */}
                <View style={styles.inputGroup}>
                  <ResponsiveText
                    variant="inputLabel"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.inputLabel}
                  >
                    Address Type
                  </ResponsiveText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Home, Shop 1, Shop 2, Shop 3, Office"
                    placeholderTextColor={COLORS.text.secondary}
                    value={address.addressType || ""}
                    onChangeText={(text) =>
                      updateAdditionalAddress(address.id, "addressType", text)
                    }
                  />
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

                    <TextInput
                      style={styles.textInput}
                      placeholder="City"
                      placeholderTextColor={COLORS.text.secondary}
                      value={address.city || ""}
                      onChangeText={(text) =>
                        updateAdditionalAddress(address.id, "city", text)
                      }
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      styles.flex1,
                      { marginLeft: 10 },
                    ]}
                  >
                    <ResponsiveText
                      variant="inputLabel"
                      weight="medium"
                      color={COLORS.text.primary}
                      style={styles.inputLabel}
                    >
                      State
                    </ResponsiveText>

                    <TextInput
                      style={styles.textInput}
                      placeholder="State"
                      placeholderTextColor={COLORS.text.secondary}
                      value={address.state || ""}
                      onChangeText={(text) =>
                        updateAdditionalAddress(address.id, "state", text)
                      }
                    />
                  </View>
                </View>

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

                    <TextInput
                      style={styles.textInput}
                      placeholder="Zip Code"
                      placeholderTextColor={COLORS.text.secondary}
                      value={address.zipCode || ""}
                      onChangeText={(text) =>
                        updateAdditionalAddress(address.id, "zipCode", text)
                      }
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      styles.flex1,
                      { marginLeft: 10 },
                    ]}
                  >
                    <ResponsiveText
                      variant="inputLabel"
                      weight="medium"
                      color={COLORS.text.primary}
                      style={styles.inputLabel}
                    >
                      Country
                    </ResponsiveText>

                    <TextInput
                      style={styles.textInput}
                      placeholder="Country"
                      placeholderTextColor={COLORS.text.secondary}
                      value={address.country || ""}
                      onChangeText={(text) =>
                        updateAdditionalAddress(address.id, "country", text)
                      }
                    />
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

                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Enter your landmark"
                    placeholderTextColor={COLORS.text.secondary}
                    multiline
                    numberOfLines={2}
                    value={address.address || ""}
                    onChangeText={(text) =>
                      updateAdditionalAddress(address.id, "address", text)
                    }
                  />
                </View>
              </ResponsiveCard>
            ))}

            {/* Add Multiple Address Button */}

            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={addAdditionalAddress}
            >
              <Ionicons name="add" size={20} color={COLORS.primary[600]} />

              <ResponsiveText
                variant="body2"
                weight="medium"
                color={COLORS.primary[600]}
                style={styles.addAddressButtonText}
              >
                Add Multiple Address
              </ResponsiveText>
            </TouchableOpacity>
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
    height: LAYOUT.inputHeightLarge,

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

  addressesHeader: {
    flexDirection: "row",

    justifyContent: "flex-start",

    alignItems: "center",

    marginBottom: MARGIN.md,
  },

  addAddressButton: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingVertical: MARGIN.md,

    paddingHorizontal: MARGIN.lg,

    borderWidth: 1,

    borderColor: COLORS.primary[600],

    borderStyle: "dashed",

    borderRadius: 8,

    backgroundColor: COLORS.primary[50],

    marginTop: MARGIN.md,
  },

  addAddressButtonText: {
    marginLeft: MARGIN.xs,
  },

  addressCard: {
    backgroundColor: COLORS.neutral[50],

    borderRadius: BORDER_RADIUS.md,

    padding: PADDING.md,

    marginBottom: MARGIN.md,

    borderWidth: 1,

    borderColor: COLORS.border.light,
  },

  addressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  addressCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addressIcon: {
    marginRight: MARGIN.xs,
  },
  addressCardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: MARGIN.xs,
    marginLeft: MARGIN.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.primary,
  },
  addressDetails: {
    lineHeight: 20,
  },
  editFormContainer: {
    marginTop: MARGIN.md,
    paddingTop: MARGIN.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  editInputGroup: {
    marginBottom: MARGIN.md,
  },
  editInputLabel: {
    marginBottom: MARGIN.xs,
    fontSize: FONT_SIZE.caption1,
    lineHeight: LINE_HEIGHT.caption1,
  },
  editTextInput: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: PADDING.input,
    paddingVertical: PADDING.input,
    fontSize: FONT_SIZE.body1,
    lineHeight: LINE_HEIGHT.body1,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
  editRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  marginLeft: {
    marginLeft: MARGIN.sm,
  },
  addressHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: MARGIN.sm,
  },

  removeButton: {
    padding: PADDING.xs,
  },

  addressInputGroup: {
    marginBottom: MARGIN.md,
  },

  addressInputLabel: {
    marginBottom: MARGIN.xs,
  },

  addressInput: {
    backgroundColor: COLORS.background.primary,
  },

  rowContainer: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  flex1: {
    flex: 1,
  },

  additionalAddressHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: MARGIN.lg,
  },

  removeAddressButton: {
    padding: MARGIN.xs,

    borderRadius: 20,

    backgroundColor: COLORS.error[50],
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

  // Pending addresses styles
  pendingAddressCard: {
    backgroundColor: COLORS.warning[50],
    borderWidth: 1,
    borderColor: COLORS.warning[200],
    borderRadius: BORDER_RADIUS.md,
    padding: PADDING.md,
    marginBottom: MARGIN.sm,
  },
  pendingAddressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  pendingAddressTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pendingActions: {
    marginTop: MARGIN.md,
    paddingTop: MARGIN.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  saveAllButton: {
    backgroundColor: COLORS.primary[500],
  },
});
