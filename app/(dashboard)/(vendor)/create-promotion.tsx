import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  Text,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DatePicker from "react-native-date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "@/config/env";
import { uploadService } from "@/services/upload";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
  AppHeader,
} from "@/components";
import { useMyServiceListings } from "@/hooks/useServiceListings";
import { useCreatePromotion } from "@/hooks/usePromotions";
import {
  COLORS,
  FONT_SIZE,
  LINE_HEIGHT,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";

// Form validation schema
const promotionSchema = yup.object({
  title: yup
    .string()
    .required("Promotion title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .trim(),
  serviceListingIds: yup
    .array()
    .of(yup.string())
    .min(1, "At least one service listing must be selected"),
  discountType: yup.string().required("Discount type is required"),
  discountValue: yup
    .string()
    .required("Discount value is required")
    .test("is-numeric", "Must be a valid number", (value) => {
      if (!value) return false;
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    })
    .test(
      "percentage-range",
      "Percentage must be between 1-100",
      function (value) {
        const discountType = this.parent.discountType;
        if (discountType === "percentage") {
          const num = parseFloat(value);
          return num >= 1 && num <= 100;
        }
        return true;
      }
    )
    .test(
      "fixed-amount-range",
      "Fixed amount must be reasonable",
      function (value) {
        const discountType = this.parent.discountType;
        if (discountType === "fixed") {
          const num = parseFloat(value);
          return num >= 1 && num <= 10000; // Max $10,000 discount
        }
        return true;
      }
    ),
  originalPrice: yup.string().when("discountType", {
    is: "fixed",
    then: (schema) =>
      schema
        .required("Original price is required for fixed discount")
        .test("is-numeric", "Must be a valid number", (value) => {
          if (!value) return false;
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        })
        .test(
          "greater-than-discount",
          "Original price must be greater than discount amount",
          function (value) {
            const discountValue = this.parent.discountValue;
            if (!value || !discountValue) return true;
            const original = parseFloat(value);
            const discount = parseFloat(discountValue);
            return original > discount;
          }
        ),
    otherwise: (schema) => schema.optional(),
  }),
  startDate: yup.string().required("Start date is required"),
  endDate: yup
    .string()
    .required("End date is required")
    .test(
      "is-after-start",
      "End date must be after start date",
      function (value) {
        const startDate = this.parent.startDate;
        if (!value || !startDate) return true;
        const endDate = new Date(value);
        const start = new Date(startDate);
        return endDate > start;
      }
    ),
  bannerImage: yup.string().optional(),
});

type PromotionFormData = yup.InferType<typeof promotionSchema>;

export default function CreatePromotionScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServiceListingDropdown, setShowServiceListingDropdown] =
    useState(false);
  const [showDiscountTypeDropdown, setShowDiscountTypeDropdown] =
    useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PromotionFormData>({
    resolver: yupResolver(promotionSchema) as any,
    defaultValues: {
      title: "",
      serviceListingIds: [],
      discountType: "",
      discountValue: "",
      originalPrice: "",
      startDate: "",
      endDate: "",
      bannerImage: "",
    },
  });

  const watchedDiscountType = watch("discountType");
  const watchedServiceListingIds = watch("serviceListingIds");

  // Sync form value with local state
  useEffect(() => {
    if (watchedServiceListingIds && Array.isArray(watchedServiceListingIds)) {
      setSelectedServiceIds(
        watchedServiceListingIds.filter(
          (id): id is string => typeof id === "string"
        )
      );
    }
  }, [watchedServiceListingIds]);

  // Fetch user's service listings
  const {
    data: myServiceListingsResponse,
    isLoading: isLoadingServices,
    error: serviceError,
  } = useMyServiceListings();

  // Extract the actual listings array from the response
  const myServiceListings = myServiceListingsResponse?.data || [];

  // Debug service listings data
  console.log(
    "🔍 CREATE SCREEN - My service listings response:",
    myServiceListingsResponse
  );
  console.log("🔍 CREATE SCREEN - My service listings:", myServiceListings);
  console.log(
    "🔍 CREATE SCREEN - My service listings length:",
    myServiceListings.length
  );

  // Filter active services for the dropdown
  const activeServices = myServiceListings.filter(
    (listing) => listing.status === "ACTIVE"
  );

  // Show all services if no active services found
  const servicesToShow =
    activeServices.length > 0 ? activeServices : myServiceListings;

  // Helper functions for multiple selection
  const toggleServiceSelection = (serviceId: string) => {
    const newSelection = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];

    setSelectedServiceIds(newSelection);
    setValue("serviceListingIds", newSelection);
  };

  const getSelectedServicesText = () => {
    if (selectedServiceIds.length === 0) return "Select service listings";
    if (selectedServiceIds.length === 1) {
      const service = servicesToShow.find(
        (s) => s.id === selectedServiceIds[0]
      );
      return service?.title || "Select service listings";
    }
    return `${selectedServiceIds.length} services selected`;
  };

  // Discount type options
  const discountTypes = [
    { value: "percentage", label: "Percentage (%)" },
    { value: "fixed", label: "Fixed Amount ($)" },
  ];

  // Create promotion mutation
  const createPromotionMutation = useCreatePromotion();

  const onSubmit = async (data: PromotionFormData) => {
    try {
      setIsSubmitting(true);

      let bannerImageUrl = undefined;

      // Upload image first if it's a local file URI
      if (data.bannerImage && data.bannerImage.startsWith("file://")) {
        console.log("🖼️ Uploading image before creating promotion...");
        try {
          bannerImageUrl = await uploadImageToCloudinary(data.bannerImage);
          console.log("🖼️ Image uploaded successfully:", bannerImageUrl);
        } catch (uploadError) {
          console.error("🖼️ Image upload failed:", uploadError);
          Alert.alert(
            "Upload Error",
            "Failed to upload image. Please try again."
          );
          return; // Stop execution if image upload fails
        }
      } else if (data.bannerImage && data.bannerImage.trim() !== "") {
        // Image already uploaded (fallback for existing URLs)
        bannerImageUrl = data.bannerImage;
      }

      // Prepare the data for API
      const promotionData = {
        title: data.title,
        serviceListingIds: (data.serviceListingIds || []).filter(
          (id): id is string => typeof id === "string"
        ),
        discountType: data.discountType as "percentage" | "fixed",
        discountValue: parseFloat(data.discountValue),
        originalPrice: data.originalPrice
          ? parseFloat(data.originalPrice)
          : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        bannerImage: bannerImageUrl,
      };

      // DEBUG: Log the data being sent
      console.log("🚀 FRONTEND DEBUG - Promotion data being sent:");
      console.log("Raw form data:", data);
      console.log("Processed promotion data:", promotionData);
      console.log("Start date type:", typeof promotionData.startDate);
      console.log("Start date value:", promotionData.startDate);
      console.log("Banner image type:", typeof promotionData.bannerImage);
      console.log("Banner image value:", promotionData.bannerImage);

      // Create promotion via API
      await createPromotionMutation.mutateAsync(promotionData);

      Alert.alert("Success", "Promotion created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating promotion:", error);
      Alert.alert("Error", "Failed to create promotion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString();
  };

  const getTodayDate = () => {
    return formatDate(new Date());
  };

  const getMinEndDate = () => {
    const startDate = watch("startDate");
    if (startDate) {
      return startDate;
    }
    return getTodayDate();
  };

  const handleImageUpload = () => {
    Alert.alert("Select Image", "Choose how you want to add an image", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Camera",
        onPress: () => openImagePicker("camera"),
      },
      {
        text: "Gallery",
        onPress: () => openImagePicker("gallery"),
      },
    ]);
  };

  const openImagePicker = async (source: "camera" | "gallery") => {
    try {
      // Request permissions
      if (source === "camera") {
        const cameraPermission =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert(
            "Permission Required",
            "Camera permission is needed to take photos."
          );
          return;
        }
      } else {
        const mediaPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          Alert.alert(
            "Permission Required",
            "Media library permission is needed to select photos."
          );
          return;
        }
      }

      // Configure picker options
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 1], // 4:1 aspect ratio
        quality: 0.8,
      };

      // Launch picker
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // Store local image URI for later upload
        setSelectedImage(asset.uri);
        setValue("bannerImage", asset.uri);

        console.log("🖼️ Image selected locally:", asset.uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const uploadImageToCloudinary = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      console.log("🖼️ UPLOAD DEBUG - Starting image upload to Cloudinary");
      console.log("🖼️ UPLOAD DEBUG - Image URI:", imageUri);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "promotion-banner.jpg",
      } as any);

      console.log("🖼️ UPLOAD DEBUG - FormData created, uploading...");

      // Upload to backend
      const apiUrl = `${ENV.API_BASE_URL}/api/${ENV.API_VERSION}/upload/promotion-banner`;
      console.log("🖼️ UPLOAD DEBUG - API URL:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem("accessToken")}`,
          // Don't set Content-Type - let fetch set it automatically for FormData
        },
        body: formData,
      });

      console.log("🖼️ UPLOAD DEBUG - Upload response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("🖼️ UPLOAD DEBUG - Upload failed:", errorData);
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();
      console.log("🖼️ UPLOAD DEBUG - Upload successful:", result);

      // Return the Cloudinary URL
      const cloudinaryUrl = result.data.imageUrl;
      console.log("🖼️ Image uploaded to Cloudinary:", cloudinaryUrl);

      return cloudinaryUrl;
    } catch (error) {
      console.error("🖼️ UPLOAD DEBUG - Upload error:", error);
      throw new Error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    setValue("startDate", formatDate(date));
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    setValue("endDate", formatDate(date));
    setShowEndDatePicker(false);
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
          <AppHeader
            onBackPress={() => router.back()}
            title="Create Promotion"
            subtext="Create a new promotion for your services"
          />

          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            {/* Banner Image Upload Card */}
            <ResponsiveCard variant="elevated" style={styles.card}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Promotion Banner
              </ResponsiveText>
              <ResponsiveText
                variant="caption1"
                size={9}
                lineHeight={12}
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Upload an attractive banner image for your promotion (will be
                automatically cropped to 4:1 ratio - Recommended size:
                1200x300px)
              </ResponsiveText>

              <TouchableOpacity
                style={styles.imageUploadContainer}
                onPress={handleImageUpload}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator
                      size="large"
                      color={COLORS.primary[500]}
                    />
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                      style={styles.uploadText}
                    >
                      Uploading image...
                    </ResponsiveText>
                  </View>
                ) : selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.uploadedImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="camera"
                      size={40}
                      color={COLORS.primary[300]}
                    />
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                      style={styles.uploadText}
                    >
                      Tap to upload banner image
                    </ResponsiveText>
                  </View>
                )}
              </TouchableOpacity>

              {/* Ratio requirement text below the image area */}
              <ResponsiveText
                variant="caption2"
                color={COLORS.text.secondary}
                style={styles.ratioRequirementText}
              >
                Image will be automatically cropped to 4:1 ratio (1200×300px)
              </ResponsiveText>
            </ResponsiveCard>

            {/* Promotion Details Card */}
            <ResponsiveCard variant="elevated" style={styles.card}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Promotion Details
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Enter the basic information for your promotion
              </ResponsiveText>

              {/* Promotion Title */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Promotion Title *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="megaphone"
                        size={20}
                        color={COLORS.text.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.title && styles.inputError,
                        ]}
                        placeholder="Enter promotion title (3-100 characters)"
                        placeholderTextColor={COLORS.text.secondary}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title.message}</Text>
                )}
              </View>

              {/* Service Listing */}
              <View style={[styles.inputGroup, styles.dropdownContainer]}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Select Service Listings *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="serviceListingIds"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownButton,
                        errors.serviceListingIds && styles.inputError,
                      ]}
                      onPress={() =>
                        setShowServiceListingDropdown(
                          !showServiceListingDropdown
                        )
                      }
                    >
                      <ResponsiveText
                        variant="body2"
                        color={
                          selectedServiceIds.length > 0
                            ? COLORS.text.primary
                            : COLORS.text.secondary
                        }
                        style={styles.dropdownText}
                      >
                        {getSelectedServicesText()}
                      </ResponsiveText>
                      <Ionicons
                        name={
                          showServiceListingDropdown
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color={COLORS.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                />
                <Modal
                  visible={showServiceListingDropdown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowServiceListingDropdown(false)}
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowServiceListingDropdown(false)}
                  >
                    <View style={styles.modalDropdownContainer}>
                      <View style={styles.modalDropdownList}>
                        <View style={styles.modalHeader}>
                          <ResponsiveText
                            variant="h6"
                            weight="bold"
                            color={COLORS.text.primary}
                            style={styles.modalTitle}
                          >
                            Select Services
                          </ResponsiveText>
                          <TouchableOpacity
                            onPress={() => setShowServiceListingDropdown(false)}
                            style={styles.closeButton}
                          >
                            <Ionicons
                              name="close"
                              size={24}
                              color={COLORS.text.secondary}
                            />
                          </TouchableOpacity>
                        </View>
                        <ScrollView
                          style={styles.modalScrollView}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          {isLoadingServices ? (
                            <View style={styles.loadingContainer}>
                              <ResponsiveText
                                variant="body2"
                                color={COLORS.text.secondary}
                                style={styles.loadingText}
                              >
                                Loading your service listings...
                              </ResponsiveText>
                            </View>
                          ) : servicesToShow.length === 0 ? (
                            <View style={styles.emptyContainer}>
                              <ResponsiveText
                                variant="body2"
                                color={COLORS.text.secondary}
                                style={styles.emptyText}
                              >
                                No active service listings found. Please create
                                a service listing first.
                              </ResponsiveText>
                            </View>
                          ) : (
                            servicesToShow.map((service) => {
                              const isSelected = selectedServiceIds.includes(
                                service.id
                              );
                              return (
                                <TouchableOpacity
                                  key={service.id}
                                  style={[
                                    isSelected
                                      ? styles.modalDropdownItemActive
                                      : styles.modalDropdownItem,
                                  ]}
                                  onPress={() =>
                                    toggleServiceSelection(service.id)
                                  }
                                >
                                  <View style={styles.serviceItemContent}>
                                    <View style={styles.serviceItemLeft}>
                                      <View
                                        style={[
                                          styles.checkbox,
                                          isSelected && styles.checkboxSelected,
                                        ]}
                                      >
                                        {isSelected && (
                                          <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color={COLORS.white}
                                          />
                                        )}
                                      </View>
                                      <View style={styles.serviceTextContent}>
                                        <ResponsiveText
                                          variant="body2"
                                          color={
                                            isSelected
                                              ? COLORS.primary[600]
                                              : COLORS.text.primary
                                          }
                                          weight={
                                            isSelected ? "medium" : "regular"
                                          }
                                          style={styles.serviceTitle}
                                        >
                                          {service.title}
                                        </ResponsiveText>
                                        <ResponsiveText
                                          variant="caption1"
                                          color={COLORS.text.secondary}
                                          style={styles.serviceCategory}
                                        >
                                          {service.categoryPath?.join(" > ") ||
                                            "Uncategorized"}
                                        </ResponsiveText>
                                      </View>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </ScrollView>
                        {selectedServiceIds.length > 0 && (
                          <View style={styles.modalFooter}>
                            <ResponsiveButton
                              title={`Done (${selectedServiceIds.length} selected)`}
                              variant="primary"
                              size="small"
                              onPress={() =>
                                setShowServiceListingDropdown(false)
                              }
                              style={styles.doneButton}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Modal>
                {errors.serviceListingIds && (
                  <Text style={styles.errorText}>
                    {errors.serviceListingIds.message}
                  </Text>
                )}
              </View>
            </ResponsiveCard>

            {/* Discount Information Card */}
            <ResponsiveCard variant="elevated" style={styles.card}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Discount Information
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Set up your discount details
              </ResponsiveText>

              {/* Discount Type */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Discount Type *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownButton,
                        errors.discountType && styles.inputError,
                      ]}
                      onPress={() =>
                        setShowDiscountTypeDropdown(!showDiscountTypeDropdown)
                      }
                    >
                      <ResponsiveText
                        variant="body2"
                        color={
                          value ? COLORS.text.primary : COLORS.text.secondary
                        }
                        style={styles.dropdownText}
                      >
                        {value
                          ? discountTypes.find((t) => t.value === value)?.label
                          : "Select discount type"}
                      </ResponsiveText>
                      <Ionicons
                        name={
                          showDiscountTypeDropdown
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color={COLORS.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                />
                {showDiscountTypeDropdown && (
                  <View style={styles.dropdownList}>
                    {discountTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setValue("discountType", type.value);
                          setShowDiscountTypeDropdown(false);
                        }}
                      >
                        <ResponsiveText
                          variant="body2"
                          color={COLORS.text.primary}
                        >
                          {type.label}
                        </ResponsiveText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {errors.discountType && (
                  <Text style={styles.errorText}>
                    {errors.discountType.message}
                  </Text>
                )}
              </View>

              {/* Discount Value */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Discount Value *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="discountValue"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="pricetag"
                        size={20}
                        color={COLORS.text.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.discountValue && styles.inputError,
                        ]}
                        placeholder={
                          watchedDiscountType === "percentage"
                            ? "Enter percentage (1-100, e.g., 20)"
                            : "Enter amount (1-10000, e.g., 25)"
                        }
                        placeholderTextColor={COLORS.text.secondary}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                />
                {errors.discountValue && (
                  <Text style={styles.errorText}>
                    {errors.discountValue.message}
                  </Text>
                )}
              </View>

              {/* Original Price (only for fixed discount) */}
              {watchedDiscountType === "fixed" && (
                <View style={styles.inputGroup}>
                  <ResponsiveText
                    variant="inputLabel"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.inputLabel}
                  >
                    Original Price *
                  </ResponsiveText>
                  <Controller
                    control={control}
                    name="originalPrice"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="cash"
                          size={20}
                          color={COLORS.text.secondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.textInput,
                            errors.originalPrice && styles.inputError,
                          ]}
                          placeholder="Enter original price (must be > discount amount)"
                          placeholderTextColor={COLORS.text.secondary}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  />
                  {errors.originalPrice && (
                    <Text style={styles.errorText}>
                      {errors.originalPrice.message}
                    </Text>
                  )}
                </View>
              )}
            </ResponsiveCard>

            {/* Date Range Card */}
            <ResponsiveCard variant="elevated" style={styles.card}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Promotion Period
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Set the start and end dates for your promotion
              </ResponsiveText>

              {/* Start Date */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  Start Date *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field: { value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        errors.startDate && styles.inputError,
                      ]}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <View style={styles.datePickerContent}>
                        <Ionicons
                          name="calendar"
                          size={20}
                          color={COLORS.text.secondary}
                        />
                        <ResponsiveText
                          variant="body2"
                          color={
                            value ? COLORS.text.primary : COLORS.text.secondary
                          }
                          style={styles.datePickerText}
                        >
                          {value
                            ? formatDateForDisplay(value)
                            : "Select start date"}
                        </ResponsiveText>
                      </View>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={COLORS.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                />
                {errors.startDate && (
                  <Text style={styles.errorText}>
                    {errors.startDate.message}
                  </Text>
                )}
              </View>

              {/* End Date */}
              <View style={styles.inputGroup}>
                <ResponsiveText
                  variant="inputLabel"
                  weight="medium"
                  color={COLORS.text.primary}
                  style={styles.inputLabel}
                >
                  End Date *
                </ResponsiveText>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        errors.endDate && styles.inputError,
                      ]}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <View style={styles.datePickerContent}>
                        <Ionicons
                          name="calendar"
                          size={20}
                          color={COLORS.text.secondary}
                        />
                        <ResponsiveText
                          variant="body2"
                          color={
                            value ? COLORS.text.primary : COLORS.text.secondary
                          }
                          style={styles.datePickerText}
                        >
                          {value
                            ? formatDateForDisplay(value)
                            : "Select end date"}
                        </ResponsiveText>
                      </View>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={COLORS.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                />
                {errors.endDate && (
                  <Text style={styles.errorText}>{errors.endDate.message}</Text>
                )}
              </View>
            </ResponsiveCard>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </KeyboardAwareScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.fixedBottomButton}>
            {/* Status indicator */}
            {(isSubmitting ||
              createPromotionMutation.isPending ||
              isUploadingImage) && (
              <ResponsiveText
                variant="caption1"
                color={COLORS.text.secondary}
                style={styles.statusText}
              >
                {isUploadingImage
                  ? "Uploading image..."
                  : isSubmitting || createPromotionMutation.isPending
                  ? "Creating promotion..."
                  : ""}
              </ResponsiveText>
            )}

            <ResponsiveButton
              title="Create Promotion"
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting ||
                createPromotionMutation.isPending ||
                isUploadingImage
              }
              disabled={
                isSubmitting ||
                createPromotionMutation.isPending ||
                isUploadingImage
              }
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Native Date Pickers */}
      <DatePicker
        modal
        open={showStartDatePicker}
        date={startDate}
        mode="date"
        minimumDate={new Date()}
        onConfirm={handleStartDateConfirm}
        onCancel={() => setShowStartDatePicker(false)}
        title="Select Start Date"
        confirmText="Confirm"
        cancelText="Cancel"
        theme="auto"
      />

      <DatePicker
        modal
        open={showEndDatePicker}
        date={endDate}
        mode="date"
        minimumDate={startDate}
        onConfirm={handleEndDateConfirm}
        onCancel={() => setShowEndDatePicker(false)}
        title="Select End Date"
        confirmText="Confirm"
        cancelText="Cancel"
        theme="auto"
      />
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
    paddingTop: MARGIN.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: MARGIN.lg,
  },
  sectionTitle: {
    marginBottom: MARGIN.sm,
  },
  sectionSubtitle: {
    marginBottom: MARGIN.lg,
  },
  inputGroup: {
    marginBottom: MARGIN.lg,
  },
  inputLabel: {
    marginBottom: MARGIN.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: PADDING.inputLarge,
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingLeft: 40,
    paddingRight: PADDING.inputLarge,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: COLORS.background.primary,
    color: COLORS.text.primary,
  },
  textArea: {
    paddingLeft: PADDING.inputLarge,
    paddingRight: PADDING.inputLarge,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: COLORS.error[500],
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: 12,
    backgroundColor: COLORS.background.primary,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownContainer: {
    zIndex: 1000,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalDropdownContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalDropdownList: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 450,
  },
  modalScrollView: {
    maxHeight: 430,
  },
  modalDropdownItem: {
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalDropdownItemActive: {
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.input,
    marginTop: 4,
    zIndex: 1001,
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  bottomSpacing: {
    height: 20,
  },
  // Image Upload Styles
  imageUploadContainer: {
    marginTop: MARGIN.md,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: MARGIN.sm,
  },
  uploadedImage: {
    width: "100%",
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    resizeMode: "cover",
  },
  uploadText: {
    textAlign: "center",
  },
  uploadSubtext: {
    textAlign: "center",
    opacity: 0.7,
  },
  ratioRequirementText: {
    textAlign: "center",
    marginTop: MARGIN.sm,
    fontSize: 11,
    fontStyle: "italic",
    opacity: 0.9,
  },
  // Date Picker Styles
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: 12,
    backgroundColor: COLORS.background.primary,
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  datePickerText: {
    fontSize: 14,
  },
  fixedBottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  // Service dropdown styles
  loadingContainer: {
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.lg,
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
  },
  emptyContainer: {
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.lg,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 20,
  },
  serviceItemContent: {
    flex: 1,
  },
  serviceTitle: {
    marginBottom: 2,
  },
  serviceCategory: {
    opacity: 0.8,
  },
  // Multi-select modal styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalFooter: {
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  doneButton: {
    width: "100%",
  },
  // Checkbox styles
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: MARGIN.sm,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  serviceItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  serviceTextContent: {
    flex: 1,
  },
  // Error text styling
  errorText: {
    fontSize: 11,
    marginTop: MARGIN.xs,
    lineHeight: 14,
    color: COLORS.error[500],
    fontFamily: "System",
  },
  statusText: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
  },
});
