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
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { useUpdatePromotion, useVendorPromotion } from "@/hooks/usePromotions";
import {
  COLORS,
  FONT_SIZE,
  LINE_HEIGHT,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";

// Form validation schema (same as create form)
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

export default function EditPromotionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServiceListingDropdown, setShowServiceListingDropdown] =
    useState(false);
  const [showDiscountTypeDropdown, setShowDiscountTypeDropdown] =
    useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Debug selectedImage state
  console.log("🖼️ EDIT SCREEN - Selected image state:", selectedImage);
  console.log("🖼️ EDIT SCREEN - Image load error state:", imageLoadError);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
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

  // Fetch promotion data
  const {
    data: promotion,
    isLoading: isLoadingPromotion,
    error: promotionError,
    refetch: refetchPromotion,
  } = useVendorPromotion(id);

  // Debug promotion data when it loads
  useEffect(() => {
    if (promotion) {
      console.log("🔍 EDIT SCREEN - Promotion data loaded:", promotion);
      console.log(
        "🔍 EDIT SCREEN - Service listings:",
        promotion.serviceListings
      );
      console.log(
        "🔍 EDIT SCREEN - Service listings length:",
        promotion.serviceListings?.length || 0
      );
      console.log("🔍 EDIT SCREEN - My service listings:", myServiceListings);
      console.log(
        "🔍 EDIT SCREEN - My service listings length:",
        myServiceListings.length
      );
    }
  }, [promotion]);

  // Fetch user's service listings
  const {
    data: myServiceListingsResponse,
    isLoading: isLoadingServices,
    error: serviceError,
  } = useMyServiceListings();

  // Extract the actual listings array from the response
  const myServiceListings = myServiceListingsResponse?.data || [];

  // Update promotion mutation
  const updatePromotionMutation = useUpdatePromotion();

  // Populate form when promotion data is loaded
  useEffect(() => {
    if (promotion) {
      // Set form values
      setValue("title", promotion.title);
      setValue("discountType", promotion.discountType.toLowerCase());
      setValue("discountValue", promotion.discountValue.toString());
      setValue("originalPrice", promotion.originalPrice?.toString() || "");
      setValue("startDate", promotion.startDate);
      setValue("endDate", promotion.endDate);
      setValue("bannerImage", promotion.bannerImage || "");

      // Set service listing IDs
      const serviceIds = promotion.serviceListings?.map((s: any) => s.id) || [];
      // Handle case where serviceListings is undefined or empty
      if (
        !promotion.serviceListings ||
        promotion.serviceListings.length === 0
      ) {
        console.log("⚠️ No service listings found for this promotion");
        setValue("serviceListingIds", []);
        setSelectedServiceIds([]);
      } else {
        setValue("serviceListingIds", serviceIds);
        setSelectedServiceIds(serviceIds);
      }

      // Set dates for date pickers
      setStartDate(new Date(promotion.startDate));
      setEndDate(new Date(promotion.endDate));

      // Set banner image
      if (promotion.bannerImage) {
        console.log(
          "🖼️ Setting banner image from promotion:",
          promotion.bannerImage
        );
        setSelectedImage(promotion.bannerImage);
        setOriginalImageUrl(promotion.bannerImage); // Store original URL for cleanup
        setImageLoadError(false); // Reset error state when loading from promotion
      } else {
        console.log("🖼️ No banner image in promotion data");
        setSelectedImage(null);
        setOriginalImageUrl(null);
        setImageLoadError(false);
      }
    }
  }, [promotion, setValue]);

  // Cleanup effect - delete original image if user navigates away without saving
  useEffect(() => {
    return () => {
      // This cleanup runs when component unmounts
      // Note: We don't delete here as the user might have saved the changes
      // The deletion happens only when a new image is uploaded
    };
  }, []);

  // Sync form value with local state
  useEffect(() => {
    if (watchedServiceListingIds && Array.isArray(watchedServiceListingIds)) {
      const filteredIds = watchedServiceListingIds.filter(
        (id): id is string => typeof id === "string"
      );
      setSelectedServiceIds(filteredIds);
    }
  }, [watchedServiceListingIds]);

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

  const onSubmit = async (data: PromotionFormData) => {
    try {
      setIsSubmitting(true);

      let bannerImageUrl = undefined;

      // Upload image first if it's a local file URI
      if (data.bannerImage && data.bannerImage.startsWith("file://")) {
        console.log("🖼️ Uploading image before updating promotion...");
        try {
          const uploadResponse = await uploadService.uploadPromotionBanner(
            data.bannerImage
          );
          console.log("🖼️ Upload response:", uploadResponse);

          // Extract the imageUrl from the response object
          bannerImageUrl = uploadResponse.data?.imageUrl || uploadResponse;
          console.log("🖼️ Extracted image URL:", bannerImageUrl);

          // Delete the original image if it exists and is different from the new one
          if (originalImageUrl && originalImageUrl !== bannerImageUrl) {
            try {
              console.log("🗑️ Deleting original image:", originalImageUrl);
              await uploadService.deleteImage(originalImageUrl);
              console.log("✅ Original image deleted successfully");
            } catch (deleteError) {
              console.error("❌ Failed to delete original image:", deleteError);
              // Don't show error to user as the main operation succeeded
            }
          }
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

      // Prepare the data for API - only include changed fields
      const promotionData: any = {};

      // Compare with original data and only include changed fields
      if (promotion) {
        // Title
        if (data.title !== promotion.title) {
          promotionData.title = data.title;
        }

        // Service listings
        const currentServiceIds =
          promotion.serviceListings?.map((s: any) => s.id) || [];
        const newServiceIds = (data.serviceListingIds || []).filter(
          (id): id is string => typeof id === "string"
        );

        // Check if service listings changed
        const serviceIdsChanged =
          currentServiceIds.length !== newServiceIds.length ||
          !currentServiceIds.every((id) => newServiceIds.includes(id));

        if (serviceIdsChanged) {
          promotionData.serviceListingIds = newServiceIds;
        }

        // Discount type
        if (data.discountType !== promotion.discountType.toLowerCase()) {
          promotionData.discountType = data.discountType as
            | "percentage"
            | "fixed";
        }

        // Discount value
        if (parseFloat(data.discountValue) !== promotion.discountValue) {
          promotionData.discountValue = parseFloat(data.discountValue);
        }

        // Original price
        const newOriginalPrice = data.originalPrice
          ? parseFloat(data.originalPrice)
          : undefined;
        if (newOriginalPrice !== promotion.originalPrice) {
          promotionData.originalPrice = newOriginalPrice;
        }

        // Start date
        if (data.startDate !== promotion.startDate) {
          promotionData.startDate = data.startDate;
        }

        // End date
        if (data.endDate !== promotion.endDate) {
          promotionData.endDate = data.endDate;
        }

        // Banner image
        const newBannerImage = bannerImageUrl;

        console.log("🖼️ BANNER IMAGE COMPARISON:");
        console.log("  - New banner image:", newBannerImage);
        console.log("  - Original banner image:", promotion.bannerImage);
        console.log("  - Form data banner image:", data.bannerImage);
        console.log(
          "  - Are they different?",
          newBannerImage !== promotion.bannerImage
        );

        if (newBannerImage !== promotion.bannerImage) {
          promotionData.bannerImage = newBannerImage;
          console.log("✅ Banner image will be updated");
        } else {
          console.log("ℹ️ Banner image unchanged, skipping update");
        }
      } else {
        // Fallback: if no original data, send all fields
        promotionData.title = data.title;
        promotionData.serviceListingIds = (data.serviceListingIds || []).filter(
          (id): id is string => typeof id === "string"
        );
        promotionData.discountType = data.discountType as
          | "percentage"
          | "fixed";
        promotionData.discountValue = parseFloat(data.discountValue);
        promotionData.originalPrice = data.originalPrice
          ? parseFloat(data.originalPrice)
          : undefined;
        promotionData.startDate = data.startDate;
        promotionData.endDate = data.endDate;
        promotionData.bannerImage = bannerImageUrl;
      }

      // Check if there are any changes
      if (Object.keys(promotionData).length === 0) {
        Alert.alert("No Changes", "No changes were made to the promotion.");
        return;
      }

      console.log("🔄 Updating promotion with changes:", promotionData);
      console.log("🔄 Full form data:", data);
      console.log("🔄 Banner image URL being sent:", bannerImageUrl);

      // Update promotion via API
      try {
        await updatePromotionMutation.mutateAsync({
          id: id!,
          data: promotionData,
        });
      } catch (apiError: any) {
        console.error("🚨 API ERROR DETAILS:");
        console.error("  - Error message:", apiError.message);
        console.error("  - Error response:", apiError.response?.data);
        console.error("  - Error status:", apiError.response?.status);
        console.error("  - Request data sent:", promotionData);
        throw apiError; // Re-throw to be handled by outer catch
      }

      // Refetch promotion data to ensure we have the latest data
      const refetchResult = await refetchPromotion();
      console.log("🔄 REFETCH RESULT:", refetchResult.data);
      console.log(
        "🔄 REFETCH SERVICE LISTINGS:",
        refetchResult.data?.serviceListings
      );

      Alert.alert("Success", "Promotion updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating promotion:", error);
      Alert.alert("Error", "Failed to update promotion. Please try again.");
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
        setImageLoadError(false);

        console.log("🖼️ Image selected locally:", asset.uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
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

  // Show loading state
  if (isLoadingPromotion) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <View style={styles.container}>
            <AppHeader
              onBackPress={() => router.back()}
              title="Edit Promotion"
              subtext="Loading promotion details..."
            />
            <View style={styles.loadingContainer}>
              <ResponsiveText
                variant="body1"
                color={COLORS.text.secondary}
                style={styles.loadingText}
              >
                Loading promotion details...
              </ResponsiveText>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show error state
  if (promotionError || !promotion) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <View style={styles.container}>
            <AppHeader
              onBackPress={() => router.back()}
              title="Edit Promotion"
              subtext="Error loading promotion"
            />
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={COLORS.error[500]}
              />
              <ResponsiveText
                variant="h6"
                weight="medium"
                color={COLORS.error[500]}
                style={styles.errorTitle}
              >
                Error Loading Promotion
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.errorDescription}
              >
                {promotionError?.message ||
                  "Promotion not found or access denied."}
              </ResponsiveText>
              <ResponsiveButton
                title="Go Back"
                variant="outline"
                size="medium"
                onPress={() => router.back()}
                style={styles.errorButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

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
            title="Edit Promotion"
            subtext="Update your promotion details"
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
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Upload an attractive banner image for your promotion (will be
                automatically cropped to 4:1 ratio)
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
                ) : selectedImage && !imageLoadError ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.uploadedImage}
                    onError={(error) => {
                      console.log("🖼️ Image load error:", error);
                      console.log("🖼️ Image URI:", selectedImage);
                      setImageLoadError(true);
                    }}
                    onLoad={() => {
                      console.log(
                        "🖼️ Image loaded successfully:",
                        selectedImage
                      );
                      setImageLoadError(false);
                    }}
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
                Image will be automatically cropped to 4:1 ratio (1920×480px)
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
                                          {service.category?.name ||
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
              updatePromotionMutation.isPending ||
              isUploadingImage) && (
              <ResponsiveText
                variant="caption1"
                color={COLORS.text.secondary}
                style={styles.statusText}
              >
                {isUploadingImage
                  ? "Uploading image..."
                  : isSubmitting || updatePromotionMutation.isPending
                  ? "Updating promotion..."
                  : ""}
              </ResponsiveText>
            )}

            <ResponsiveButton
              title="Update Promotion"
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting ||
                updatePromotionMutation.isPending ||
                isUploadingImage
              }
              disabled={
                isSubmitting ||
                updatePromotionMutation.isPending ||
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
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
    gap: MARGIN.lg,
  },
  errorTitle: {
    textAlign: "center",
  },
  errorDescription: {
    textAlign: "center",
    lineHeight: 20,
  },
  errorButton: {
    marginTop: MARGIN.md,
  },
  statusText: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
  },
});
