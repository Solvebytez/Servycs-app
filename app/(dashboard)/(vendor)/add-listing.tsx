import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  ResponsiveText,
  ResponsiveButton,
  ResponsiveCard,
  GlobalStatusBar,
  AppHeader,
  MultiSelectCategorySearch,
  ServiceImageUpload,
  BusinessHours,
  BusinessAddressList,
  StepProgressIndicator,
  StepNavigation,
} from "@/components";
import {
  DraftListingProvider,
  useDraftListing,
} from "@/contexts/DraftListingContext";
import { useCreateServiceListing } from "@/hooks/useServiceListings";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

// Step 1 Component
const Step1Component = () => {
  const { data, updateData } = useDraftListing();
  const [contactNumberError, setContactNumberError] = useState<string>("");
  const [whatsappNumberError, setWhatsappNumberError] = useState<string>("");

  const handleInputChange = (field: keyof typeof data, value: string) => {
    updateData({ [field]: value });

    // Real-time validation for phone numbers
    if (field === "contactNumber") {
      if (value.trim() && !validateIndianPhoneNumber(value)) {
        setContactNumberError(
          "Enter valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)"
        );
      } else {
        setContactNumberError("");
      }
    }

    if (field === "whatsappNumber") {
      if (value.trim() && !validateIndianPhoneNumber(value)) {
        setWhatsappNumberError(
          "Enter valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)"
        );
      } else {
        setWhatsappNumberError("");
      }
    }
  };

  // Indian phone number validation
  const validateIndianPhoneNumber = (phoneNumber: string): boolean => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const mobilePattern = /^(\+91|91)?[6-9]\d{9}$/;
    return mobilePattern.test(cleanNumber);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Service Images Section */}
      <ResponsiveCard variant="elevated" style={styles.formCard}>
        <ResponsiveText
          variant="h6"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.sectionTitle}
        >
          Service Image
        </ResponsiveText>

        <ServiceImageUpload
          image={data.image}
          onImageChange={(image) => updateData({ image })}
          showHint={true}
        />
      </ResponsiveCard>

      {/* Listing Details Section */}
      <ResponsiveCard variant="elevated" style={styles.formCard}>
        <ResponsiveText
          variant="h6"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.sectionTitle}
        >
          Shop Details
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.sectionSubtitle}
        >
          Provide basic information about your shop
        </ResponsiveText>

        {/* Shop Name Input */}
        <View style={styles.inputGroup}>
          <ResponsiveText
            variant="inputLabel"
            weight="medium"
            color={COLORS.text.primary}
            style={styles.inputLabel}
          >
            Shop Name *
          </ResponsiveText>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your shop name"
            placeholderTextColor={COLORS.text.secondary}
            value={data.title}
            onChangeText={(text) => handleInputChange("title", text)}
            maxLength={100}
          />
        </View>

        {/* Contact Number Input */}
        <View style={styles.inputGroup}>
          <ResponsiveText
            variant="inputLabel"
            weight="medium"
            color={COLORS.text.primary}
            style={styles.inputLabel}
          >
            Contact Number *
          </ResponsiveText>
          <TextInput
            style={[styles.textInput, contactNumberError && styles.inputError]}
            placeholder="Enter your contact number (e.g., 9876543210)"
            placeholderTextColor={COLORS.text.secondary}
            value={data.contactNumber}
            onChangeText={(text) => handleInputChange("contactNumber", text)}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {contactNumberError ? (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.error[500]}
              style={styles.errorText}
            >
              {contactNumberError}
            </ResponsiveText>
          ) : (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.text.secondary}
              style={styles.helperText}
            >
              Indian mobile number (10 digits starting with 6, 7, 8, or 9)
            </ResponsiveText>
          )}
        </View>

        {/* WhatsApp Number Input */}
        <View style={styles.inputGroup}>
          <ResponsiveText
            variant="inputLabel"
            weight="medium"
            color={COLORS.text.primary}
            style={styles.inputLabel}
          >
            WhatsApp Number *
          </ResponsiveText>
          <TextInput
            style={[styles.textInput, whatsappNumberError && styles.inputError]}
            placeholder="Enter your WhatsApp number (e.g., 9876543210)"
            placeholderTextColor={COLORS.text.secondary}
            value={data.whatsappNumber}
            onChangeText={(text) => handleInputChange("whatsappNumber", text)}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {whatsappNumberError ? (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.error[500]}
              style={styles.errorText}
            >
              {whatsappNumberError}
            </ResponsiveText>
          ) : (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.text.secondary}
              style={styles.helperText}
            >
              Indian mobile number (10 digits starting with 6, 7, 8, or 9)
            </ResponsiveText>
          )}
        </View>

        {/* Description Text Area */}
        <View style={styles.inputGroup}>
          <ResponsiveText
            variant="inputLabel"
            weight="medium"
            color={COLORS.text.primary}
            style={styles.inputLabel}
          >
            Detailed Description *
          </ResponsiveText>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your service in detail. Include what makes it special, benefits, duration, what to expect..."
              placeholderTextColor={COLORS.text.secondary}
              value={data.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <View style={styles.characterCounter}>
              <ResponsiveText variant="caption2" color={COLORS.text.secondary}>
                {data.description.length}/1000 characters
              </ResponsiveText>
            </View>
          </View>
        </View>
      </ResponsiveCard>

      {/* Bottom Spacing for Fixed Button */}
      <View style={styles.bottomSpacing} />
    </KeyboardAwareScrollView>
  );
};

// Step 2 Component
const Step2Component = () => {
  const { data, updateData } = useDraftListing();
  const [addressError, setAddressError] = useState<string>("");

  const handleBusinessHoursChange = (businessHours: any) => {
    updateData({ businessHours });
  };

  const handleAddressSelect = (addressId: string | null) => {
    updateData({ selectedAddressId: addressId });
    setAddressError("");
  };

  return (
    <KeyboardAwareScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Business Hours & Address Section */}
      <ResponsiveCard variant="elevated" style={styles.formCard}>
        <ResponsiveText
          variant="h6"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.sectionTitle}
        >
          Business Hours & Address
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.sectionSubtitle}
        >
          Set your operating hours and select your business address
        </ResponsiveText>

        <BusinessHours
          businessHours={data.businessHours}
          onBusinessHoursChange={handleBusinessHoursChange}
        />

        <BusinessAddressList
          selectedAddressId={data.selectedAddressId}
          onAddressSelect={(addressId) => handleAddressSelect(addressId)}
          onAddressDeselect={() => handleAddressSelect(null)}
        />
      </ResponsiveCard>

      {/* Bottom Spacing for Fixed Button */}
      <View style={styles.bottomSpacing} />
    </KeyboardAwareScrollView>
  );
};

// Step 3 Component
const Step3Component = ({
  onOpenTimePicker,
}: {
  onOpenTimePicker: (index: number) => void;
}) => {
  const { data, updateData } = useDraftListing();

  const handleServiceChange = (index: number, field: string, value: string) => {
    const updatedServices = [...data.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };
    updateData({ services: updatedServices });
  };

  const handleAddService = () => {
    const newService = {
      id: Math.max(...(data.services || []).map((s) => s.id), 0) + 1,
      name: "",
      description: "",
      price: "",
      discountPrice: "",
      duration: "",
      categoryIds: [],
      categoryPaths: [],
    };
    updateData({ services: [...data.services, newService] });
  };

  const handleRemoveService = (index: number) => {
    if (data.services.length > 1) {
      const updatedServices = data.services.filter((_, i) => i !== index);
      updateData({ services: updatedServices });
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Services Section */}
      <ResponsiveCard variant="elevated" style={styles.formCard}>
        <ResponsiveText
          variant="h6"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.sectionTitle}
        >
          Multiple Services
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.sectionSubtitle}
        >
          Add the services you offer with pricing and duration
        </ResponsiveText>
      </ResponsiveCard>

      {/* Services List */}
      {data.services.map((service, index) => (
        <ResponsiveCard
          key={service.id}
          variant="elevated"
          style={styles.serviceCard}
        >
          <View style={styles.serviceCardHeader}>
            <ResponsiveText
              variant="h6"
              weight="bold"
              color={COLORS.text.primary}
            >
              Service {index + 1}
            </ResponsiveText>
            {data.services.length > 1 && (
              <TouchableOpacity
                style={styles.removeServiceButton}
                onPress={() => handleRemoveService(index)}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.error[500]}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Service Name */}
          <View style={styles.inputGroup}>
            <ResponsiveText
              variant="inputLabel"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.inputLabel}
            >
              Service Name *
            </ResponsiveText>
            <TextInput
              style={styles.textInput}
              placeholder="Enter service name"
              placeholderTextColor={COLORS.text.secondary}
              value={service.name}
              onChangeText={(text) => handleServiceChange(index, "name", text)}
            />
          </View>

          {/* Service Description */}
          <View style={styles.inputGroup}>
            <ResponsiveText
              variant="inputLabel"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.inputLabel}
            >
              Service Description *
            </ResponsiveText>
            <TextInput
              style={styles.textArea}
              placeholder="Describe this service"
              placeholderTextColor={COLORS.text.secondary}
              value={service.description}
              onChangeText={(text) =>
                handleServiceChange(index, "description", text)
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Price and Discount Row */}
          <View style={styles.priceRow}>
            {/* Service Price */}
            <View style={[styles.inputGroup, styles.priceInputGroup]}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Price
              </ResponsiveText>
              <TextInput
                style={[
                  styles.textInput,
                  service.price.trim() &&
                    (isNaN(parseFloat(service.price)) ||
                      parseFloat(service.price) <= 0) &&
                    styles.inputError,
                ]}
                placeholder="0.00"
                placeholderTextColor={COLORS.text.secondary}
                value={service.price}
                onChangeText={(text) =>
                  handleServiceChange(index, "price", text)
                }
                keyboardType="numeric"
              />
              {service.price.trim() &&
                (isNaN(parseFloat(service.price)) ||
                  parseFloat(service.price) <= 0) && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                    style={styles.errorText}
                  >
                    Price must be a valid number greater than 0
                  </ResponsiveText>
                )}
            </View>

            {/* Discount Price */}
            <View style={[styles.inputGroup, styles.priceInputGroup]}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Discount Price
              </ResponsiveText>
              <TextInput
                style={[
                  styles.textInput,
                  service.discountPrice.trim() &&
                    (isNaN(parseFloat(service.discountPrice)) ||
                      parseFloat(service.discountPrice) < 0 ||
                      parseFloat(service.discountPrice) >=
                        parseFloat(service.price)) &&
                    styles.inputError,
                ]}
                placeholder="0.00"
                placeholderTextColor={COLORS.text.secondary}
                value={service.discountPrice}
                onChangeText={(text) =>
                  handleServiceChange(index, "discountPrice", text)
                }
                keyboardType="numeric"
              />
              {service.discountPrice.trim() &&
                (isNaN(parseFloat(service.discountPrice)) ||
                  parseFloat(service.discountPrice) < 0 ||
                  parseFloat(service.discountPrice) >=
                    parseFloat(service.price)) && (
                  <ResponsiveText
                    variant="inputHelper"
                    color={COLORS.error[500]}
                    style={styles.errorText}
                  >
                    {isNaN(parseFloat(service.discountPrice)) ||
                    parseFloat(service.discountPrice) < 0
                      ? "Discount price must be a valid number (0 or greater)"
                      : "Discount price must be less than the base price"}
                  </ResponsiveText>
                )}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <ResponsiveText
              variant="inputLabel"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.inputLabel}
            >
              Duration (HH:MM)
            </ResponsiveText>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => onOpenTimePicker(index)}
            >
              <ResponsiveText
                variant="body1"
                color={
                  service.duration.trim()
                    ? COLORS.text.primary
                    : COLORS.text.secondary
                }
                style={styles.timePickerText}
              >
                {service.duration.trim() || "Select Duration"}
              </ResponsiveText>
              <Ionicons
                name="time-outline"
                size={20}
                color={COLORS.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Service Category */}
          <View style={styles.inputGroup}>
            <ResponsiveText
              variant="inputLabel"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.inputLabel}
            >
              Service Category *
            </ResponsiveText>
            <MultiSelectCategorySearch
              selectedCategories={(service.categoryIds || []).map(
                (id, catIndex) => ({
                  id,
                  name:
                    service.categoryPaths?.[catIndex]?.[
                      service.categoryPaths[catIndex].length - 1
                    ] || `Category ${catIndex + 1}`,
                  slug: `category-${id}`,
                  path: service.categoryPaths?.[catIndex]?.join(" > ") || "",
                })
              )}
              onCategoriesChange={(categories) => {
                const updatedServices = [...data.services];
                updatedServices[index] = {
                  ...updatedServices[index],
                  categoryIds: categories.map((cat) => cat.id),
                  categoryPaths: categories.map(
                    (cat) => cat.path?.split(" > ") || [cat.name]
                  ),
                };
                updateData({ services: updatedServices });
              }}
              maxSelections={4}
              placeholder="Search categories..."
              error=""
            />
          </View>
        </ResponsiveCard>
      ))}

      {/* Add Service Button */}
      <ResponsiveButton
        title="+ Add Another Service"
        variant="outline"
        size="large"
        onPress={handleAddService}
        style={styles.addServiceButton}
      />

      {/* Bottom Spacing for Fixed Button */}
      <View style={styles.bottomSpacing} />
    </KeyboardAwareScrollView>
  );
};

// Main Form Component
const AddListingForm = () => {
  const router = useRouter();
  const {
    data,
    updateData,
    setCurrentStep,
    canProceedToNext,
    getStepValidationErrors,
  } = useDraftListing();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<
    number | null
  >(null);

  const stepTitles = [
    "Shop Details & Images",
    "Business Hours & Address",
    "Multiple Services",
  ];

  // Timer picker functions
  const openTimePicker = (serviceIndex: number) => {
    setSelectedServiceIndex(serviceIndex);
    setIsTimePickerVisible(true);
  };

  const confirmTimeSelection = (duration: {
    hours: number;
    minutes: number;
    seconds: number;
  }) => {
    if (selectedServiceIndex !== null) {
      const durationString = `${duration.hours
        .toString()
        .padStart(2, "0")}:${duration.minutes.toString().padStart(2, "0")}`;

      const updatedServices = [...data.services];
      updatedServices[selectedServiceIndex] = {
        ...updatedServices[selectedServiceIndex],
        duration: durationString,
      };
      updateData({ services: updatedServices });
    }
    setIsTimePickerVisible(false);
    setSelectedServiceIndex(null);
  };

  const handleNext = async () => {
    const errors = getStepValidationErrors(data.currentStep);
    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"));
      return;
    }

    if (data.currentStep < 3) {
      // Auto-save current step before proceeding
      await handleSaveAndProceed();
    } else {
      handleSubmit();
    }
  };

  const handleSaveAndProceed = async () => {
    setIsSubmitting(true);
    try {
      // Import service dynamically to avoid circular imports
      const { serviceService } = await import("@/services/service");

      let imageUrl = data.image || undefined;

      // If image is a local URI, upload it first
      if (
        imageUrl &&
        (imageUrl.startsWith("file://") || imageUrl.startsWith("content://"))
      ) {
        console.log("🔄 Uploading local image to server...");
        try {
          // Create a mock asset object for the upload service
          const mockAsset = {
            uri: imageUrl,
            type: "image/jpeg", // Default type
            fileName: `service-image-${Date.now()}.jpg`,
          };

          const uploadResult = await serviceService.uploadServiceImage(
            mockAsset
          );
          imageUrl = uploadResult.imageUrl;
          console.log("✅ Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("❌ Image upload failed:", uploadError);
          Alert.alert(
            "Upload Failed",
            "Failed to upload image. Please try again."
          );
          return;
        }
      }

      // Prepare draft data
      const draftData = {
        ...data,
        // Use the first service's category as the main listing category
        categoryId:
          data.services.length > 0 && data.services[0].categoryIds.length > 0
            ? data.services[0].categoryIds[0]
            : undefined,
        categoryPath:
          data.services.length > 0 && data.services[0].categoryPaths.length > 0
            ? data.services[0].categoryPaths[0]
            : [],
        image: imageUrl,
        selectedAddressId: data.selectedAddressId || undefined,
        services: data.services
          .filter(
            (service) => service.name.trim() && service.description.trim()
          ) // Only include valid services
          .map((service) => ({
            ...service,
            price: service.price.trim() ? parseFloat(service.price) : undefined,
            discountPrice: service.discountPrice.trim()
              ? parseFloat(service.discountPrice)
              : undefined,
            duration: service.duration.trim() ? service.duration : undefined,
            categoryIds: service.categoryIds || [],
            categoryPaths: service.categoryPaths || [],
          })),
        status: "DRAFT" as const,
        currentStep: data.currentStep, // Include current step for backend validation
      };

      if (data.listingId) {
        // Update existing draft using flexible update
        console.log("Updating existing draft with ID:", data.listingId);

        // Structure the data for flexible update
        const flexibleUpdateData = {
          title: draftData.title,
          description: draftData.description,
          contactNumber: draftData.contactNumber,
          whatsappNumber: draftData.whatsappNumber,
          image: draftData.image,
          addressId: draftData.selectedAddressId, // Backend expects addressId, not selectedAddressId
          businessHours: draftData.businessHours,
          // Only include category fields if we have valid categories (Step 3+)
          ...(draftData.categoryId &&
            draftData.categoryPath.length > 0 && {
              categoryId: draftData.categoryId,
              categoryPath: draftData.categoryPath,
            }),
          status: draftData.status,
          currentStep: draftData.currentStep, // Include current step for backend validation
          services: {
            replace: draftData.services, // Use replace to update all services
          },
        };

        console.log(
          "Flexible update data:",
          JSON.stringify(flexibleUpdateData, null, 2)
        );
        await serviceService.updateServiceListingFlexible(
          data.listingId,
          flexibleUpdateData
        );
      } else {
        // Create new draft
        console.log("Creating new draft...");
        const result = await serviceService.createServiceListing(
          draftData as any
        );
        console.log("Draft created successfully with ID:", result.id);
        updateData({ listingId: result.id });
      }

      // Only proceed to next step after successful save
      setCurrentStep(data.currentStep + 1);
    } catch (error) {
      console.error("Error saving step:", error);
      Alert.alert("Error", "Failed to save your progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (data.currentStep > 1) {
      setCurrentStep(data.currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    const errors = getStepValidationErrors(3);
    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Import service dynamically to avoid circular imports
      const { serviceService } = await import("@/services/service");

      let imageUrl = data.image || undefined;

      // If image is a local URI, upload it first
      if (
        imageUrl &&
        (imageUrl.startsWith("file://") || imageUrl.startsWith("content://"))
      ) {
        console.log("🔄 Uploading local image to server...");
        try {
          // Create a mock asset object for the upload service
          const mockAsset = {
            uri: imageUrl,
            type: "image/jpeg", // Default type
            fileName: `service-image-${Date.now()}.jpg`,
          };

          const uploadResult = await serviceService.uploadServiceImage(
            mockAsset
          );
          imageUrl = uploadResult.imageUrl;
          console.log("✅ Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("❌ Image upload failed:", uploadError);
          Alert.alert(
            "Upload Failed",
            "Failed to upload image. Please try again."
          );
          return;
        }
      }

      // Prepare final data with PENDING status
      const finalData = {
        ...data,
        // Use the first service's category as the main listing category
        categoryId:
          data.services.length > 0 && data.services[0].categoryIds.length > 0
            ? data.services[0].categoryIds[0]
            : undefined,
        categoryPath:
          data.services.length > 0 && data.services[0].categoryPaths.length > 0
            ? data.services[0].categoryPaths[0]
            : [],
        image: imageUrl,
        selectedAddressId: data.selectedAddressId || undefined,
        services: data.services
          .filter(
            (service) => service.name.trim() && service.description.trim()
          ) // Only include valid services
          .map((service) => ({
            ...service,
            price: service.price.trim() ? parseFloat(service.price) : undefined,
            discountPrice: service.discountPrice.trim()
              ? parseFloat(service.discountPrice)
              : undefined,
            duration: service.duration.trim() ? service.duration : undefined,
            categoryIds: service.categoryIds || [],
            categoryPaths: service.categoryPaths || [],
          })),
        status: "PENDING" as const,
        currentStep: 3, // Final step
      };

      if (data.listingId) {
        // Update existing listing to PENDING using flexible update
        console.log(
          "Final submission - updating existing listing with ID:",
          data.listingId
        );

        // Structure the data for flexible update
        const flexibleUpdateData = {
          title: finalData.title,
          description: finalData.description,
          contactNumber: finalData.contactNumber,
          whatsappNumber: finalData.whatsappNumber,
          image: finalData.image,
          addressId: finalData.selectedAddressId, // Backend expects addressId, not selectedAddressId
          businessHours: finalData.businessHours,
          // Only include category fields if we have valid categories
          ...(finalData.categoryId &&
            finalData.categoryPath.length > 0 && {
              categoryId: finalData.categoryId,
              categoryPath: finalData.categoryPath,
            }),
          status: finalData.status,
          currentStep: finalData.currentStep, // Include current step for backend validation
          services: {
            replace: finalData.services, // Use replace to update all services
          },
        };

        console.log(
          "Final flexible update data:",
          JSON.stringify(flexibleUpdateData, null, 2)
        );
        await serviceService.updateServiceListingFlexible(
          data.listingId,
          flexibleUpdateData
        );
      } else {
        // Create new listing with PENDING status
        console.log(
          "Final submission - creating new listing with PENDING status"
        );
        await serviceService.createServiceListing(finalData as any);
      }

      Alert.alert(
        "Success!",
        "Your listing has been submitted for review. You'll be notified once it's approved.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(dashboard)/(vendor)/");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting listing:", error);
      Alert.alert("Error", "Failed to submit listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (data.currentStep) {
      case 1:
        return <Step1Component />;
      case 2:
        return <Step2Component />;
      case 3:
        return <Step3Component onOpenTimePicker={openTimePicker} />;
      default:
        return <Step1Component />;
    }
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
            title="Add New Listing"
            subtext={`Step ${data.currentStep} of 3`}
          />

          {/* Progress Indicator */}
          <StepProgressIndicator
            currentStep={data.currentStep}
            totalSteps={3}
            stepTitles={stepTitles}
          />

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Step Navigation */}
          <StepNavigation
            currentStep={data.currentStep}
            totalSteps={3}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isNextDisabled={!canProceedToNext(data.currentStep)}
            isNextLoading={isSubmitting}
            isPreviousDisabled={data.currentStep === 1}
            nextButtonText={
              data.currentStep === 3 ? "Submit for Review" : "Save & Next"
            }
          />
        </View>
      </SafeAreaView>

      {/* Timer Picker Modal */}
      <TimerPickerModal
        visible={isTimePickerVisible}
        setIsVisible={setIsTimePickerVisible}
        onConfirm={confirmTimeSelection}
        onCancel={() => {
          setIsTimePickerVisible(false);
          setSelectedServiceIndex(null);
        }}
        hideSeconds={true}
        hourLabel="Hrs"
        minuteLabel="min"
        styles={{
          pickerItemContainer: {
            width: 140,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
          },
          pickerLabelContainer: {
            position: "absolute",
            left: 60,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          },
          pickerLabel: {
            fontSize: 16,
            color: COLORS.text.secondary,
            marginLeft: 8,
          },
        }}
      />
    </>
  );
};

// Main Screen Component
export default function AddListingScreen() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleStartNewListing = () => {
    console.log("🚀 Starting new listing...");
    setShowForm(true);
  };

  if (showForm) {
    return (
      <DraftListingProvider>
        <AddListingForm />
      </DraftListingProvider>
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
            title="Add New Listing"
            subtext="Create a new service offering"
          />

          <View style={styles.content}>
            <ResponsiveText
              variant="h4"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.title}
            >
              Create New Listing
            </ResponsiveText>

            <ResponsiveText
              variant="body1"
              color={COLORS.text.secondary}
              style={styles.subtitle}
            >
              Follow our simple 3-step process to create your service listing
            </ResponsiveText>

            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.white}
                  >
                    1
                  </ResponsiveText>
                </View>
                <View style={styles.stepContent}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.stepTitle}
                  >
                    Shop Details & Images
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.stepDescription}
                  >
                    Add your shop information, contact details, and service
                    images
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.white}
                  >
                    2
                  </ResponsiveText>
                </View>
                <View style={styles.stepContent}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.stepTitle}
                  >
                    Business Hours & Address
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.stepDescription}
                  >
                    Set your operating hours and select your business address
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.white}
                  >
                    3
                  </ResponsiveText>
                </View>
                <View style={styles.stepContent}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.stepTitle}
                  >
                    Multiple Services
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.stepDescription}
                  >
                    Add your services with pricing and duration details
                  </ResponsiveText>
                </View>
              </View>
            </View>

            <ResponsiveButton
              title="Start Creating Listing"
              variant="primary"
              size="medium"
              onPress={handleStartNewListing}
              style={styles.startButton}
            />

            <ResponsiveText
              variant="caption1"
              color={COLORS.text.secondary}
              style={styles.note}
            >
              Your progress will be saved automatically as you complete each
              step
            </ResponsiveText>
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
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: MARGIN.md,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: MARGIN.xl,
  },
  stepsContainer: {
    width: "100%",
    marginBottom: MARGIN.xl,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: MARGIN.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[500],
    alignItems: "center",
    justifyContent: "center",
    marginRight: MARGIN.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: MARGIN.xs,
  },
  stepDescription: {
    lineHeight: 20,
  },
  startButton: {
    width: "100%",
    marginBottom: MARGIN.lg,
  },
  note: {
    textAlign: "center",
    fontStyle: "italic",
  },
  // Form styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING.screen,
    paddingBottom: 0, // Minimal space for fixed button
  },
  formCard: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
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
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
  inputError: {
    borderColor: COLORS.error[500],
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
  textAreaContainer: {
    position: "relative",
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingTop: 8,
    paddingBottom: 32, // Space for character counter
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    minHeight: 120,
  },
  characterCounter: {
    position: "absolute",
    bottom: PADDING.sm,
    right: PADDING.md,
  },
  bottomSpacing: {
    height: 100,
  },
  serviceCard: {
    marginBottom: MARGIN.lg,
  },
  serviceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  removeServiceButton: {
    padding: PADDING.xs,
  },
  priceRow: {
    flexDirection: "row",
    gap: MARGIN.md,
  },
  priceInputGroup: {
    flex: 1,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: 12,
    backgroundColor: COLORS.background.primary,
    minHeight: 48,
  },
  timePickerText: {
    flex: 1,
    fontSize: 14,
  },
  addServiceButton: {
    marginTop: MARGIN.lg,
  },
});
