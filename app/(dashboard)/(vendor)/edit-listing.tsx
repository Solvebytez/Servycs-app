import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TimerPickerModal } from "react-native-timer-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
  AppHeader,
  MultiSelectCategorySearch,
  BusinessAddressForm,
  BusinessAddressList,
  ServiceImageUpload,
  BusinessHours,
} from "@/components";
import { useBusinessAddresses } from "@/hooks/useBusinessAddresses";
import {
  serviceService,
  CreateServiceListingRequest,
  ServiceListing,
  FlexibleUpdateRequest,
  BusinessHours as BusinessHoursType,
} from "@/services/service";
import { useUpdateServiceListingFlexible } from "@/hooks/useServiceListings";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";

interface FormData {
  title: string;
  contactNumber: string;
  whatsappNumber: string;
  description: string;
  image: string | null;
  selectedAddressId: string | null;
  businessHours: BusinessHoursType;
  services: Array<{
    id: number;
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    duration: string;
    categoryIds: string[]; // ✅ Updated to array
    categoryPaths: any; // ✅ Updated to JSON
  }>;
}

// Remove old static categories - now using dynamic CategorySelector

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Use the optimistic update mutation
  const updateListingMutation = useUpdateServiceListingFlexible();
  const { data: existingAddresses = [] } = useBusinessAddresses();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    contactNumber: "",
    whatsappNumber: "",
    description: "",
    image: null,
    selectedAddressId: null,
    businessHours: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      saturday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
    },
    services: [
      {
        id: 1,
        name: "",
        description: "",
        price: "",
        discountPrice: "",
        duration: "",
        categoryIds: [],
        categoryPaths: [],
      },
    ],
  });
  const [contactNumberError, setContactNumberError] = useState<string>("");
  const [whatsappNumberError, setWhatsappNumberError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Use mutation loading state
  const isUpdating = updateListingMutation.isPending;

  // Combined loading state for button
  const isButtonLoading = isUpdating || isUploadingImage;
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showMultipleServices, setShowMultipleServices] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [selectedDuration, setSelectedDuration] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch existing listing data
  const { data: existingListing, isLoading: isListingLoading } = useQuery({
    queryKey: ["serviceListing", id],
    queryFn: () => serviceService.getServiceListingById(id!),
    enabled: !!id,
  });

  // Populate form when listing data is loaded
  useEffect(() => {
    if (existingListing) {
      console.log("=== POPULATING FORM WITH EXISTING DATA ===");
      console.log("Existing Listing:", existingListing);
      console.log("Category ID:", existingListing.categoryId);
      console.log("Category Path:", existingListing.categoryPath);

      // Get business hours from the ServiceListing (shop level)
      console.log("=== BUSINESS HOURS LOADING DEBUG ===");
      console.log(
        "ServiceListing businessHours:",
        existingListing.businessHours
      );
      console.log("Services count:", existingListing.services?.length);

      const existingBusinessHours = existingListing.businessHours || {
        monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        saturday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
      };

      console.log("Final existingBusinessHours:", existingBusinessHours);
      console.log("Sunday isOpen:", existingBusinessHours.sunday?.isOpen);
      console.log("===================================");

      // Populate services with category data
      let servicesData: any[] = [];

      if (existingListing.services && existingListing.services.length > 0) {
        servicesData = existingListing.services.map((service, index) => {
          // Convert duration from minutes to "HH:MM" format
          let durationString = "";
          if (service.duration) {
            const hours = Math.floor(service.duration / 60);
            const minutes = service.duration % 60;
            durationString = `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`;
          }

          return {
            id: index + 1,
            name: service.name || "",
            description: service.description || "",
            price: service.price?.toString() || "",
            discountPrice: service.discountPrice?.toString() || "",
            duration: durationString,
            categoryIds: (service as any).categoryIds || [],
            categoryPaths: (service as any).categoryPaths || [],
          };
        });
      } else {
        // If no existing services, create one empty service for editing
        servicesData = [
          {
            id: 1,
            name: "",
            description: "",
            price: "",
            discountPrice: "",
            duration: "",
            categoryIds: [],
            categoryPaths: [],
          },
        ];
      }

      const newFormData = {
        title: existingListing.title || "",
        contactNumber: existingListing.contactNumber || "",
        whatsappNumber: existingListing.whatsappNumber || "",
        description: existingListing.description || "",
        image: existingListing.image || null,
        selectedAddressId: existingListing.addressId || null,
        businessHours: existingBusinessHours,
        services: servicesData,
      };

      console.log("=== EXISTING LISTING DEBUG ===");
      console.log(
        "Full existingListing object:",
        JSON.stringify(existingListing, null, 2)
      );
      console.log("existingListing.addressId:", existingListing.addressId);
      console.log("existingListing.address:", existingListing.address);
      console.log("existingListing.title:", existingListing.title);
      console.log("existingListing.services:", existingListing.services);
      console.log("=== SERVICES CATEGORY DEBUG ===");
      if (existingListing.services && existingListing.services.length > 0) {
        existingListing.services.forEach((service, index) => {
          console.log(`Service ${index + 1}:`, {
            id: service.id,
            name: service.name,
            categoryIds: (service as any).categoryIds,
            categoryPaths: (service as any).categoryPaths,
          });
        });
      }
      console.log("=== ADDRESS ASSOCIATION CHECK ===");
      console.log("Listing Title:", existingListing.title);
      console.log("Current Address ID:", existingListing.addressId);
      console.log("Current Address Object:", existingListing.address);
      console.log("Available Addresses:", existingAddresses);
      console.log("===============================");
      console.log("Setting Form Data:", newFormData);
      setFormData(newFormData);

      // Show services section when editing
      setShowMultipleServices(true);
      console.log("Address fields:", {
        addressId: existingListing.addressId,
        address: existingListing.address,
      });
      console.log("Available Addresses:", existingAddresses);

      // Log final state after a small delay to ensure state updates
      setTimeout(() => {
        console.log("Final Form Data (after state update):", {
          title: formData.title,
          selectedAddressId: formData.selectedAddressId,
          servicesCount: formData.services.length,
          addressId: existingListing.addressId,
        });
        console.log("=== ADDRESS SELECTION STATUS ===");
        console.log("Form selectedAddressId:", formData.selectedAddressId);
        console.log("Original addressId:", existingListing.addressId);
        console.log(
          "Are they the same?",
          formData.selectedAddressId === existingListing.addressId
        );
        console.log("===============================");
      }, 100);
    }
  }, [existingListing, existingAddresses]);

  // Debug: Log when formData changes
  useEffect(() => {
    console.log("FormData state changed:", formData);
    console.log("Business hours in formData:", formData.businessHours);
    console.log(
      "Sunday isOpen in formData:",
      formData.businessHours.sunday?.isOpen
    );
  }, [formData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

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

  const handleMultipleServiceChange = (
    id: number,
    field: string,
    value: string
  ) => {
    // For price fields, only allow numbers and decimal point
    if (field === "price" || field === "discountPrice") {
      // Allow only numbers, decimal point, and empty string
      const numericValue = value.replace(/[^0-9.]/g, "");

      // Prevent multiple decimal points
      const parts = numericValue.split(".");
      const finalValue =
        parts.length > 2
          ? parts[0] + "." + parts.slice(1).join("")
          : numericValue;

      setFormData((prev) => ({
        ...prev,
        services: (prev.services || []).map((service) =>
          service.id === id ? { ...service, [field]: finalValue } : service
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        services: (prev.services || []).map((service) =>
          service.id === id ? { ...service, [field]: value } : service
        ),
      }));
    }
  };

  const addNewService = () => {
    const newId = Math.max(...(formData.services || []).map((s) => s.id)) + 1;
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: newId,
          name: "",
          description: "",
          price: "",
          discountPrice: "",
          duration: "",
          categoryIds: [],
          categoryPaths: [],
        },
      ],
    }));
  };

  const removeService = (id: number) => {
    if (formData.services.length > 1) {
      setFormData((prev) => ({
        ...prev,
        services: prev.services.filter((service) => service.id !== id),
      }));
    }
  };

  // Indian phone number validation
  const validateIndianPhoneNumber = (phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
    // Also allow numbers with country code +91 (11 digits total)
    const mobilePattern = /^(\+91|91)?[6-9]\d{9}$/;

    return mobilePattern.test(cleanNumber);
  };

  // Timer picker functions
  const openTimePicker = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsTimePickerVisible(true);
  };

  const confirmTimeSelection = (duration: {
    hours: number;
    minutes: number;
    seconds: number;
  }) => {
    if (selectedServiceId !== null) {
      const durationString = `${duration.hours
        .toString()
        .padStart(2, "0")}:${duration.minutes.toString().padStart(2, "0")}`;

      setFormData((prev) => ({
        ...prev,
        services: (prev.services || []).map((service) =>
          service.id === selectedServiceId
            ? { ...service, duration: durationString }
            : service
        ),
      }));
    }
    setIsTimePickerVisible(false);
    setSelectedServiceId(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a shop name");
      return;
    }
    if (
      formData.title.trim().length < 3 ||
      formData.title.trim().length > 100
    ) {
      Alert.alert("Error", "Title must be between 3 and 100 characters");
      return;
    }
    // Note: Category validation is now handled per service in the services array
    if (!formData.description.trim()) {
      Alert.alert("Error", "Please enter a service description");
      return;
    }
    if (
      formData.description.trim().length < 5 ||
      formData.description.trim().length > 1000
    ) {
      Alert.alert("Error", "Description must be between 5 and 1000 characters");
      return;
    }
    if (!formData.contactNumber.trim()) {
      Alert.alert("Error", "Please enter a contact number");
      return;
    }
    if (!validateIndianPhoneNumber(formData.contactNumber)) {
      Alert.alert(
        "Error",
        "Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)"
      );
      return;
    }
    if (!formData.whatsappNumber.trim()) {
      Alert.alert("Error", "Please enter a WhatsApp number");
      return;
    }
    if (!validateIndianPhoneNumber(formData.whatsappNumber)) {
      Alert.alert(
        "Error",
        "Please enter a valid Indian WhatsApp number (10 digits starting with 6, 7, 8, or 9)"
      );
      return;
    }

    // Validate that at least one service is added and prices are valid
    const validServices = formData.services.filter((service) => {
      const hasName = service.name.trim();
      const hasDescription = service.description.trim();
      const hasCategory = service.categoryIds && service.categoryIds.length > 0;

      // Price validation (optional)
      const hasPrice = service.price.trim();
      const isValidPrice =
        !hasPrice ||
        (!isNaN(parseFloat(service.price)) && parseFloat(service.price) > 0);

      // Duration validation (optional)
      const hasDuration = service.duration.trim();
      const isValidDuration =
        !hasDuration || service.duration.trim().length > 0;

      // Discount price validation (optional)
      const isValidDiscountPrice =
        !service.discountPrice.trim() ||
        (!isNaN(parseFloat(service.discountPrice)) &&
          parseFloat(service.discountPrice) >= 0 &&
          (!hasPrice ||
            parseFloat(service.discountPrice) < parseFloat(service.price)));

      return (
        hasName &&
        hasDescription &&
        hasCategory &&
        isValidPrice &&
        isValidDuration &&
        isValidDiscountPrice
      );
    });

    // Check for invalid prices in any service first
    const invalidServices = formData.services.filter((service) => {
      if (
        !service.name.trim() &&
        !service.description.trim() &&
        !service.price.trim()
      ) {
        return false; // Skip empty services
      }

      const hasPrice = service.price.trim();
      const isValidPrice =
        !hasPrice || // No price is valid (optional)
        (!isNaN(parseFloat(service.price)) && parseFloat(service.price) > 0);

      const hasDiscountPrice = service.discountPrice.trim();
      const isValidDiscountPrice =
        !hasDiscountPrice || // No discount price is valid (optional)
        (!isNaN(parseFloat(service.discountPrice)) &&
          parseFloat(service.discountPrice) >= 0 &&
          (!hasPrice ||
            parseFloat(service.discountPrice) < parseFloat(service.price)));

      return !isValidPrice || !isValidDiscountPrice;
    });

    if (invalidServices.length > 0) {
      Alert.alert(
        "Error",
        "Please enter valid prices for all services. Price must be greater than 0, and discount price must be 0 or greater and less than the base price."
      );
      return;
    }

    if (!formData.selectedAddressId) {
      Alert.alert("Error", "Please select a business address");
      return;
    }

    // Now handle service count and status selection
    if (validServices.length === 0) {
      Alert.alert(
        "No Services",
        "Your listing will be saved as DRAFT since no valid services were found. You can add services later to make it active.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Save as Draft",
            onPress: () => {
              handleSubmitWithStatus("DRAFT");
            },
          },
        ]
      );
      return;
    }

    // If user has valid services, proceed with PENDING status (normal flow)
    // Continue with the original submit logic for PENDING status
    try {
      // Get the selected address details
      const selectedAddress = existingAddresses.find(
        (addr) => addr.id === formData.selectedAddressId
      );

      // Upload image if it's a local URI (from image picker)
      let imageUrl = formData.image;
      if (formData.image && formData.image.startsWith("file://")) {
        console.log("=== UPLOADING IMAGE ===");
        console.log("Local image URI:", formData.image);

        try {
          setIsUploadingImage(true);

          const imageAsset = {
            uri: formData.image,
            type: "image/jpeg",
            fileName: "service-image.jpg",
          };

          const uploadResult = await serviceService.uploadServiceImage(
            imageAsset
          );
          imageUrl = uploadResult.imageUrl;
          console.log("Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          let errorMessage =
            "Failed to upload service image. Please try again.";
          if ((uploadError as any)?.response?.data?.message) {
            errorMessage = (uploadError as any).response.data.message;
          } else if ((uploadError as any)?.message) {
            errorMessage = (uploadError as any).message;
          }
          Alert.alert("Upload Failed", errorMessage);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Create flexible update payload with PENDING status
      const updatePayload: any = {
        status: "PENDING", // Set to PENDING for valid services
      };

      // Add basic field changes
      if (existingListing && formData.title.trim() !== existingListing.title) {
        updatePayload.title = formData.title.trim();
      }

      if (
        existingListing &&
        formData.description.trim() !== existingListing.description
      ) {
        updatePayload.description = formData.description.trim();
      }

      if (
        existingListing &&
        formData.contactNumber.trim() !== existingListing.contactNumber
      ) {
        updatePayload.contactNumber = formData.contactNumber.trim();
      }

      if (
        existingListing &&
        formData.whatsappNumber.trim() !== existingListing.whatsappNumber
      ) {
        updatePayload.whatsappNumber = formData.whatsappNumber.trim();
      }

      if (imageUrl !== existingListing?.image) {
        updatePayload.image = imageUrl || undefined;
      }

      if (formData.selectedAddressId !== existingListing?.addressId) {
        updatePayload.addressId = formData.selectedAddressId;
        console.log(
          "🏠 Address changed:",
          existingListing?.addressId,
          "->",
          formData.selectedAddressId
        );
      }

      // Check for business hours change (now at shop level)
      const existingBusinessHours = existingListing?.businessHours;
      console.log("=== BUSINESS HOURS CHANGE DETECTION ===");
      console.log("Existing business hours:", existingBusinessHours);
      console.log("Form data business hours:", formData.businessHours);
      console.log(
        "JSON.stringify(existing):",
        JSON.stringify(existingBusinessHours)
      );
      console.log(
        "JSON.stringify(formData):",
        JSON.stringify(formData.businessHours)
      );

      const businessHoursChanged =
        JSON.stringify(existingBusinessHours) !==
        JSON.stringify(formData.businessHours);

      console.log("Business hours changed:", businessHoursChanged);
      console.log("=====================================");

      if (businessHoursChanged) {
        console.log("🕐 Business hours changed (PENDING flow)");
        updatePayload.businessHours = formData.businessHours;
      } else {
        console.log("✅ No business hours changes detected (PENDING flow)");
      }

      // Handle services - replace all services (business hours are now at shop level)
      updatePayload.services = {
        replace: validServices.map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
          price: service.price.trim() ? parseFloat(service.price) : undefined,
          discountPrice: service.discountPrice
            ? parseFloat(service.discountPrice)
            : undefined,
          duration: service.duration.trim() ? service.duration : undefined,
          categoryIds: service.categoryIds,
          categoryPaths: service.categoryPaths,
        })),
      };

      console.log("=== UPDATE PAYLOAD (PENDING) ===");
      console.log("Update Payload:", JSON.stringify(updatePayload, null, 2));
      console.log("Valid Services:", validServices.length);
      console.log("Form Data selectedAddressId:", formData.selectedAddressId);
      console.log("Existing Listing addressId:", existingListing?.addressId);
      console.log(
        "Address change detected:",
        formData.selectedAddressId !== existingListing?.addressId
      );
      console.log("================================");

      // Call the update API
      await updateListingMutation.mutateAsync({
        id: id!,
        data: updatePayload,
      });

      // Show success alert with details of what was updated
      const updatedFields = Object.keys(updatePayload);
      const fieldsText =
        updatedFields.length === 1
          ? `Updated: ${updatedFields[0]}`
          : `Updated: ${updatedFields.join(", ")}`;

      Alert.alert(
        "Success",
        `Service listing updated successfully and submitted for review!\n\n${fieldsText}\n\nTotal fields updated: ${updatedFields.length}`,
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error updating service listing:", error);
      let errorMessage = "Failed to update service listing. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      // Mutation handles loading state automatically
    }
  };

  // Handle submit with specific status (for DRAFT when no services)
  const handleSubmitWithStatus = async (status: "DRAFT" | "PENDING") => {
    // Re-run the same validation logic but with the specified status
    if (
      !formData.title.trim() ||
      formData.title.trim().length < 3 ||
      formData.title.trim().length > 100
    ) {
      Alert.alert("Error", "Title must be between 3 and 100 characters");
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert("Error", "Please enter a service description");
      return;
    }
    if (
      formData.description.trim().length < 5 ||
      formData.description.trim().length > 1000
    ) {
      Alert.alert("Error", "Description must be between 5 and 1000 characters");
      return;
    }
    if (!formData.contactNumber.trim()) {
      Alert.alert("Error", "Please enter a contact number");
      return;
    }
    if (!validateIndianPhoneNumber(formData.contactNumber)) {
      Alert.alert(
        "Error",
        "Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)"
      );
      return;
    }
    if (!formData.whatsappNumber.trim()) {
      Alert.alert("Error", "Please enter a WhatsApp number");
      return;
    }
    if (!validateIndianPhoneNumber(formData.whatsappNumber)) {
      Alert.alert(
        "Error",
        "Please enter a valid Indian WhatsApp number (10 digits starting with 6, 7, 8, or 9)"
      );
      return;
    }

    // Validate services (but allow empty for DRAFT status)
    const validServices = formData.services.filter((service) => {
      const hasName = service.name.trim();
      const hasDescription = service.description.trim();
      const hasPrice = service.price.trim();
      const hasDuration = service.duration.trim();
      const hasCategory = service.categoryIds && service.categoryIds.length > 0;
      const isValidPrice =
        hasPrice &&
        !isNaN(parseFloat(service.price)) &&
        parseFloat(service.price) > 0;
      const isValidDiscountPrice =
        !service.discountPrice.trim() ||
        (!isNaN(parseFloat(service.discountPrice)) &&
          parseFloat(service.discountPrice) >= 0 &&
          parseFloat(service.discountPrice) < parseFloat(service.price));
      const isValidDuration = hasDuration && service.duration.trim().length > 0;

      return (
        hasName &&
        hasDescription &&
        hasPrice &&
        hasDuration &&
        hasCategory &&
        isValidPrice &&
        isValidDuration &&
        isValidDiscountPrice
      );
    });

    // For DRAFT status, allow empty services
    if (status === "PENDING" && validServices.length === 0) {
      Alert.alert(
        "Error",
        "Please add at least one service with valid name, description, and category"
      );
      return;
    }

    // Check for invalid prices in any service
    const invalidServices = formData.services.filter((service) => {
      if (
        !service.name.trim() &&
        !service.description.trim() &&
        !service.price.trim()
      ) {
        return false; // Skip empty services
      }

      const hasPrice = service.price.trim();
      const isValidPrice =
        !hasPrice || // No price is valid (optional)
        (!isNaN(parseFloat(service.price)) && parseFloat(service.price) > 0);

      const hasDiscountPrice = service.discountPrice.trim();
      const isValidDiscountPrice =
        !hasDiscountPrice || // No discount price is valid (optional)
        (!isNaN(parseFloat(service.discountPrice)) &&
          parseFloat(service.discountPrice) >= 0 &&
          (!hasPrice ||
            parseFloat(service.discountPrice) < parseFloat(service.price)));

      return !isValidPrice || !isValidDiscountPrice;
    });

    if (invalidServices.length > 0) {
      Alert.alert(
        "Error",
        "Please enter valid prices for all services. Price must be greater than 0, and discount price must be 0 or greater and less than the base price."
      );
      return;
    }
    if (!formData.selectedAddressId) {
      Alert.alert("Error", "Please select a business address");
      return;
    }

    try {
      // Get the selected address details
      const selectedAddress = existingAddresses.find(
        (addr) => addr.id === formData.selectedAddressId
      );

      // validServices already filtered above with proper validation

      // Prepare the complete listing data structure
      const listingData = {
        // Basic listing information
        title: formData.title.trim(),
        description: formData.description.trim(),
        contactNumber: formData.contactNumber.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),

        // Image information
        image: formData.image,

        // Address information
        selectedAddressId: formData.selectedAddressId,
        selectedAddress: selectedAddress,

        // Services information
        services: validServices.map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
          price: service.price.trim() ? parseFloat(service.price) : undefined,
          discountPrice: service.discountPrice
            ? parseFloat(service.discountPrice)
            : null,
          duration: service.duration.trim() ? service.duration : undefined,
          categoryIds: service.categoryIds,
          categoryPaths: service.categoryPaths,
        })),

        // Metadata
        totalServices: validServices.length,
        hasMultipleServices: validServices.length > 1,
        createdAt: new Date().toISOString(),
      };

      // Log the complete data structure to console
      console.log("=== LISTING DATA STRUCTURE ===");
      console.log(
        "Complete Listing Data:",
        JSON.stringify(listingData, null, 2)
      );
      console.log("Form Data:", formData);
      console.log("Multiple Services:", formData.services);
      console.log("Valid Services:", validServices);
      console.log("Selected Address:", selectedAddress);
      console.log("Existing Addresses:", existingAddresses);
      console.log("===============================");

      // Upload image if it's a local URI (from image picker)
      let imageUrl = formData.image;
      if (formData.image && formData.image.startsWith("file://")) {
        console.log("=== UPLOADING IMAGE ===");
        console.log("Local image URI:", formData.image);

        try {
          setIsUploadingImage(true); // Start image upload loading

          // Create a mock image asset object for the upload service
          const imageAsset = {
            uri: formData.image,
            type: "image/jpeg", // Default type
            fileName: "service-image.jpg",
          };

          const uploadResult = await serviceService.uploadServiceImage(
            imageAsset
          );
          imageUrl = uploadResult.imageUrl;
          console.log("Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          console.error("Upload error details:", {
            message: (uploadError as any)?.message,
            response: (uploadError as any)?.response?.data,
            status: (uploadError as any)?.response?.status,
          });

          let errorMessage =
            "Failed to upload service image. Please try again.";
          if ((uploadError as any)?.response?.data?.message) {
            errorMessage = (uploadError as any).response.data.message;
          } else if ((uploadError as any)?.message) {
            errorMessage = (uploadError as any).message;
          }

          Alert.alert("Upload Failed", errorMessage);
          return;
        } finally {
          setIsUploadingImage(false); // Stop image upload loading
        }
      }

      // Prepare data for API call
      const apiData: CreateServiceListingRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: undefined, // No global category, each service has its own
        categoryPath: [], // No global category path
        contactNumber: formData.contactNumber.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        image: imageUrl || undefined,
        selectedAddressId: formData.selectedAddressId!,
        services: validServices.map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
          price: service.price.trim() ? parseFloat(service.price) : undefined,
          discountPrice: service.discountPrice
            ? parseFloat(service.discountPrice)
            : undefined,
          duration: service.duration.trim() ? service.duration : undefined,
          businessHours: formData.businessHours,
          categoryIds: service.categoryIds,
          categoryPaths: service.categoryPaths,
        })),
      };

      console.log("=== API REQUEST DATA ===");
      console.log("API Data:", JSON.stringify(apiData, null, 2));
      console.log("========================");

      // Create flexible update payload with only changed fields
      const updatePayload: FlexibleUpdateRequest = {};

      // Check for basic field changes
      if (existingListing && formData.title.trim() !== existingListing.title) {
        updatePayload.title = formData.title.trim();
        console.log(
          "📝 Title changed:",
          existingListing.title,
          "->",
          formData.title.trim()
        );
      }

      if (
        existingListing &&
        formData.description.trim() !== existingListing.description
      ) {
        updatePayload.description = formData.description.trim();
        console.log("📝 Description changed");
      }

      if (
        existingListing &&
        formData.contactNumber.trim() !== existingListing.contactNumber
      ) {
        updatePayload.contactNumber = formData.contactNumber.trim();
        console.log("📝 Contact number changed");
      }

      if (
        existingListing &&
        formData.whatsappNumber.trim() !== existingListing.whatsappNumber
      ) {
        updatePayload.whatsappNumber = formData.whatsappNumber.trim();
        console.log("📝 WhatsApp number changed");
      }

      if (existingListing && imageUrl !== existingListing.image) {
        updatePayload.image = imageUrl || undefined;
        console.log("📝 Image changed");
        console.log("Old image:", existingListing.image);
        console.log("New image:", imageUrl);
      } else {
        console.log("📝 No image change detected");
        console.log("Existing image:", existingListing?.image);
        console.log("New image URL:", imageUrl);
        console.log("Are they equal?", imageUrl === existingListing?.image);
      }

      // Check for address change
      if (
        existingListing &&
        formData.selectedAddressId !== existingListing.addressId
      ) {
        updatePayload.addressId = formData.selectedAddressId!;
        console.log(
          "🏠 Address changed:",
          existingListing.addressId,
          "->",
          formData.selectedAddressId
        );
      }

      // Check for business hours change (now at shop level)
      const existingBusinessHours = existingListing?.businessHours;
      console.log("=== BUSINESS HOURS CHANGE DETECTION (DRAFT FLOW) ===");
      console.log("Existing business hours:", existingBusinessHours);
      console.log("Form data business hours:", formData.businessHours);
      console.log(
        "JSON.stringify(existing):",
        JSON.stringify(existingBusinessHours)
      );
      console.log(
        "JSON.stringify(formData):",
        JSON.stringify(formData.businessHours)
      );

      const businessHoursChanged =
        JSON.stringify(existingBusinessHours) !==
        JSON.stringify(formData.businessHours);

      console.log("Business hours changed:", businessHoursChanged);
      console.log("=====================================");

      if (businessHoursChanged) {
        console.log("🕐 Business hours changed (DRAFT flow)");
        updatePayload.businessHours = formData.businessHours; // ✅ Send at top level like addressId
      } else {
        console.log("✅ No business hours changes detected (DRAFT flow)");
      }

      // Handle services - replace all services (business hours are now at shop level)
      updatePayload.services = {
        replace: validServices.map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
          price: service.price.trim() ? parseFloat(service.price) : undefined,
          discountPrice: service.discountPrice
            ? parseFloat(service.discountPrice)
            : undefined,
          duration: service.duration.trim() ? service.duration : undefined,
          categoryIds: service.categoryIds,
          categoryPaths: service.categoryPaths,
        })),
      };

      console.log("=== FLEXIBLE UPDATE PAYLOAD ===");
      console.log("Update Payload:", JSON.stringify(updatePayload, null, 2));
      console.log("Fields being updated:", Object.keys(updatePayload));
      console.log("Total fields to update:", Object.keys(updatePayload).length);
      console.log("Form Data selectedAddressId:", formData.selectedAddressId);
      console.log("Existing Listing addressId:", existingListing?.addressId);
      console.log(
        "Address change detected:",
        formData.selectedAddressId !== existingListing?.addressId
      );
      console.log("===============================");

      // Only call API if there are changes
      if (Object.keys(updatePayload).length === 0) {
        Alert.alert("No Changes", "No changes were made to the listing.");
        return;
      }

      // Use optimistic update mutation
      const updatedListing = (await updateListingMutation.mutateAsync({
        id: id!,
        data: updatePayload,
      })) as any;

      console.log("=== OPTIMISTIC UPDATE SUCCESS ===");
      console.log("Updated Listing:", JSON.stringify(updatedListing, null, 2));
      console.log("=================================");

      // Show success alert with details of what was updated
      const updatedFields = Object.keys(updatePayload);
      const fieldsText =
        updatedFields.length === 1
          ? `Updated: ${updatedFields[0]}`
          : `Updated: ${updatedFields.join(", ")}`;

      Alert.alert(
        "Success!",
        `Your service listing has been updated successfully!\n\n${fieldsText}\n\nTotal fields updated: ${updatedFields.length}`,
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error updating service listing:", error);

      let errorMessage = "Failed to update service listing. Please try again.";
      let shouldRefreshCategories = false;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        // Check if it's a category-related error
        if (
          error.response.data.error === "INVALID_CATEGORY_ID" ||
          error.response.data.message.includes("category") ||
          error.response.data.message.includes("Category") ||
          error.response.data.message.includes("deleted")
        ) {
          shouldRefreshCategories = true;
          errorMessage =
            "The selected category may have been deleted or is no longer available. Please select a different category.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage, [
        {
          text: "OK",
          onPress: () => {
            if (shouldRefreshCategories) {
              // Clear the selected category and refresh the category list
              setFormData((prev) => ({
                ...prev,
                categoryIds: [],
                categoryPaths: [],
              }));
            }
          },
        },
      ]);
    } finally {
      // Mutation handles loading state automatically
    }
  };

  // Show loading state while fetching listing data
  if (isListingLoading) {
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
              title="Edit Listing"
              subtext="Loading listing data..."
            />
            <View style={styles.loadingContainer}>
              <ResponsiveText variant="h6" color={COLORS.text.secondary}>
                Loading listing data...
              </ResponsiveText>
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
            title="Edit Listing"
            subtext="Update your service offering"
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
                image={formData.image}
                onImageChange={(image) =>
                  setFormData((prev) => ({ ...prev, image }))
                }
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
                Listing Details
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Provide detailed information about your service
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
                  value={formData.title}
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
                  style={[
                    styles.textInput,
                    contactNumberError && styles.inputError,
                  ]}
                  placeholder="Enter your contact number (e.g., 9876543210)"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.contactNumber}
                  onChangeText={(text) =>
                    handleInputChange("contactNumber", text)
                  }
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
                  style={[
                    styles.textInput,
                    whatsappNumberError && styles.inputError,
                  ]}
                  placeholder="Enter your WhatsApp number (e.g., 9876543210)"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.whatsappNumber}
                  onChangeText={(text) =>
                    handleInputChange("whatsappNumber", text)
                  }
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
                    value={formData.description}
                    onChangeText={(text) =>
                      handleInputChange("description", text)
                    }
                    multiline
                    numberOfLines={6}
                    maxLength={1000}
                    textAlignVertical="top"
                  />
                  <View style={styles.characterCounter}>
                    <ResponsiveText
                      variant="caption2"
                      color={COLORS.text.secondary}
                    >
                      {formData.description.length}/1000 characters
                    </ResponsiveText>
                  </View>
                </View>
              </View>
            </ResponsiveCard>

            {/* Business Address Section */}
            <View style={styles.addAddressSection}>
              {/* Show selected address if one is selected */}
              {formData.selectedAddressId &&
                (() => {
                  const selectedAddress = existingAddresses.find(
                    (addr) => addr.id === formData.selectedAddressId
                  );
                  return selectedAddress ? (
                    <ResponsiveCard
                      variant="elevated"
                      style={styles.selectedAddressCard}
                    >
                      <ResponsiveText
                        variant="h6"
                        weight="bold"
                        style={styles.selectedAddressTitle}
                      >
                        Selected Address
                      </ResponsiveText>
                      <ResponsiveText
                        variant="body1"
                        weight="medium"
                        style={styles.addressName}
                      >
                        {selectedAddress.name}
                      </ResponsiveText>
                      <ResponsiveText
                        variant="body2"
                        color={COLORS.text.secondary}
                        style={styles.addressDetails}
                      >
                        {selectedAddress.address}
                      </ResponsiveText>
                      <ResponsiveText
                        variant="body2"
                        color={COLORS.text.secondary}
                        style={styles.addressDetails}
                      >
                        {selectedAddress.city}, {selectedAddress.state}{" "}
                        {selectedAddress.zipCode}
                      </ResponsiveText>
                      {selectedAddress.description && (
                        <ResponsiveText
                          variant="body2"
                          color={COLORS.text.secondary}
                          style={styles.addressDescription}
                        >
                          {selectedAddress.description}
                        </ResponsiveText>
                      )}
                    </ResponsiveCard>
                  ) : null;
                })()}

              {/* Address Button */}
              <ResponsiveButton
                title={
                  formData.selectedAddressId ? "Change Address" : "Add Address"
                }
                variant="outline"
                size="medium"
                fullWidth
                onPress={() => setShowAddressModal(true)}
                leftIcon={
                  <Ionicons
                    name={formData.selectedAddressId ? "pencil" : "add"}
                    size={16}
                    color={COLORS.primary[300]}
                  />
                }
              />
            </View>

            {/* Add Multiple Services Button */}
            <View style={styles.addMultipleServicesSection}>
              <ResponsiveButton
                title={
                  showMultipleServices
                    ? "Hide Multiple Services"
                    : "Add Multiple Services"
                }
                variant="outline"
                size="medium"
                fullWidth
                onPress={() => setShowMultipleServices(!showMultipleServices)}
                leftIcon={
                  <Ionicons
                    name={showMultipleServices ? "remove-circle" : "add-circle"}
                    size={16}
                    color={COLORS.primary[300]}
                  />
                }
              />
            </View>

            {/* Multiple Services Form */}
            {showMultipleServices && (
              <View style={styles.multipleServicesContainer}>
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.multipleServicesTitle}
                >
                  Multiple Services
                </ResponsiveText>
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.multipleServicesSubtitle}
                >
                  Add multiple service options with different pricing
                </ResponsiveText>

                {(formData.services || []).map((service, index) => (
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
                      {formData.services.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeServiceButton}
                          onPress={() => removeService(service.id)}
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
                        onChangeText={(text) =>
                          handleMultipleServiceChange(service.id, "name", text)
                        }
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
                          handleMultipleServiceChange(
                            service.id,
                            "description",
                            text
                          )
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
                            handleMultipleServiceChange(
                              service.id,
                              "price",
                              text
                            )
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
                            handleMultipleServiceChange(
                              service.id,
                              "discountPrice",
                              text
                            )
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
                        onPress={() => openTimePicker(service.id)}
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
                        selectedCategories={(() => {
                          console.log("=== CATEGORY DEBUG ===");
                          console.log("Service ID:", service.id);
                          console.log(
                            "Service categoryIds:",
                            service.categoryIds
                          );
                          console.log(
                            "Service categoryPaths:",
                            service.categoryPaths
                          );
                          console.log(
                            "Mapping result:",
                            (service.categoryIds || []).map((id, index) => ({
                              id,
                              name:
                                service.categoryPaths?.[index]?.[
                                  service.categoryPaths[index].length - 1
                                ] || `Category ${index + 1}`,
                              slug: `category-${id}`,
                              path:
                                service.categoryPaths?.[index]?.join(" > ") ||
                                "",
                            }))
                          );
                          console.log("=====================");
                          return (service.categoryIds || []).map(
                            (id, index) => ({
                              id,
                              name:
                                service.categoryPaths?.[index]?.[
                                  service.categoryPaths[index].length - 1
                                ] || `Category ${index + 1}`,
                              slug: `category-${id}`,
                              path:
                                service.categoryPaths?.[index]?.join(" > ") ||
                                "",
                            })
                          );
                        })()}
                        onCategoriesChange={(categories) => {
                          setFormData((prev) => ({
                            ...prev,
                            services: (prev.services || []).map((s) =>
                              s.id === service.id
                                ? {
                                    ...s,
                                    categoryIds: categories.map(
                                      (cat) => cat.id
                                    ),
                                    categoryPaths: categories.map(
                                      (cat) =>
                                        cat.path?.split(" > ") || [cat.name]
                                    ),
                                  }
                                : s
                            ),
                          }));
                        }}
                        maxSelections={4}
                        placeholder="Search categories..."
                        error=""
                      />
                    </View>
                  </ResponsiveCard>
                ))}

                {/* Add New Service Button */}
                <ResponsiveButton
                  title="Add Another Service"
                  variant="outline"
                  size="medium"
                  fullWidth
                  onPress={addNewService}
                  leftIcon={
                    <Ionicons
                      name="add"
                      size={16}
                      color={COLORS.primary[300]}
                    />
                  }
                  style={styles.addAnotherServiceButton}
                />
              </View>
            )}

            {/* Business Hours Section */}
            <BusinessHours
              key={JSON.stringify(formData.businessHours)} // Force re-render when business hours change
              businessHours={formData.businessHours}
              onBusinessHoursChange={(businessHours) => {
                console.log("=== BUSINESS HOURS COMPONENT CHANGE ===");
                console.log(
                  "New business hours from component:",
                  businessHours
                );
                console.log("Sunday isOpen:", businessHours.sunday?.isOpen);
                console.log("=====================================");
                setFormData((prev) => ({ ...prev, businessHours }));
              }}
            />

            {/* Bottom Spacing for Fixed Button */}
            <View style={styles.bottomSpacing} />
          </KeyboardAwareScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.fixedBottomButton}>
            <ResponsiveButton
              title={
                isUploadingImage
                  ? "Uploading Image..."
                  : isUpdating
                  ? "Updating..."
                  : "Update Listing"
              }
              variant="primary"
              size="large"
              onPress={handleSubmit}
              loading={isButtonLoading}
              disabled={isButtonLoading}
              style={styles.submitButton}
            />
          </View>

          {/* Address Modal */}
          <Modal
            visible={showAddressModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAddressModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowAddressModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.text.primary}
                  />
                </TouchableOpacity>
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.text.primary}
                >
                  Select Addresses
                </ResponsiveText>
                <View style={styles.modalPlaceholder} />
              </View>

              <KeyboardAwareScrollView
                style={styles.modalContent}
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
              >
                {/* Existing Addresses Section */}
                <ResponsiveCard variant="elevated" style={styles.modalCard}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.modalSectionTitle}
                  >
                    Existing Addresses
                  </ResponsiveText>

                  <BusinessAddressList
                    selectedAddressId={formData.selectedAddressId}
                    onAddressSelect={(addressId) => {
                      console.log("=== ADDRESS SELECTION ===");
                      console.log(
                        "Previous selectedAddressId:",
                        formData.selectedAddressId
                      );
                      console.log("New selectedAddressId:", addressId);
                      console.log("Available addresses:", existingAddresses);
                      const selectedAddress = existingAddresses.find(
                        (addr) => addr.id === addressId
                      );
                      console.log("Selected address details:", selectedAddress);
                      console.log("=========================");
                      setFormData((prev) => ({
                        ...prev,
                        selectedAddressId: addressId,
                      }));
                    }}
                    onAddressDeselect={() => {
                      console.log("=== ADDRESS DESELECTION ===");
                      console.log(
                        "Deselecting address:",
                        formData.selectedAddressId
                      );
                      console.log("===========================");
                      setFormData((prev) => ({
                        ...prev,
                        selectedAddressId: null,
                      }));
                    }}
                  />
                </ResponsiveCard>

                {/* Add New Address Section */}
                <ResponsiveCard variant="elevated" style={styles.modalCard}>
                  {showAddressForm ? (
                    <BusinessAddressForm
                      existingAddresses={existingAddresses}
                      onSuccess={() => {
                        setShowAddressForm(false);
                        // The BusinessAddressList will automatically refresh due to query invalidation
                      }}
                      onCancel={() => setShowAddressForm(false)}
                    />
                  ) : (
                    <View>
                      <ResponsiveText
                        variant="h6"
                        weight="bold"
                        color={COLORS.text.primary}
                        style={styles.modalSectionTitle}
                      >
                        Add New Address
                      </ResponsiveText>
                      <ResponsiveButton
                        title="Add New Address"
                        variant="primary"
                        size="medium"
                        onPress={() => setShowAddressForm(true)}
                        leftIcon={
                          <Ionicons name="add" size={16} color={COLORS.white} />
                        }
                        style={styles.addNewAddressButton}
                      />
                    </View>
                  )}
                </ResponsiveCard>
              </KeyboardAwareScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <ResponsiveButton
                  title="Cancel"
                  variant="danger"
                  size="medium"
                  onPress={() => setShowAddressModal(false)}
                  style={styles.modalCancelButton}
                  textStyle={styles.modalCancelButtonText}
                />
                <ResponsiveButton
                  title={`Done${formData.selectedAddressId ? " (1)" : ""}`}
                  variant="primary"
                  size="medium"
                  onPress={() => setShowAddressModal(false)}
                  style={styles.modalDoneButton}
                />
              </View>
            </SafeAreaView>
          </Modal>

          {/* Timer Picker Modal */}
          <TimerPickerModal
            visible={isTimePickerVisible}
            setIsVisible={setIsTimePickerVisible}
            onConfirm={confirmTimeSelection}
            onCancel={() => {
              setIsTimePickerVisible(false);
              setSelectedServiceId(null);
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
    paddingBottom: 100, // Space for fixed button
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
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    marginTop: MARGIN.xs,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primary[50],
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
  compactTextArea: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: 12,
    paddingBottom: 32,
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
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButton: {
    width: "100%",
  },
  bottomSpacing: {
    height: 100,
  },
  // Add Address Section Styles
  addAddressSection: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.md,
    alignItems: "center",
  },
  // Selected Address Card Styles
  selectedAddressCard: {
    width: "100%",
    marginBottom: MARGIN.md,
    padding: PADDING.md,
  },
  selectedAddressTitle: {
    marginBottom: MARGIN.sm,
    color: COLORS.primary[500],
  },
  addressName: {
    marginBottom: MARGIN.xs,
  },
  addressDetails: {
    marginBottom: MARGIN.xs,
  },
  addressDescription: {
    marginTop: MARGIN.xs,
    fontStyle: "italic",
  },
  // Add Multiple Services Section Styles
  addMultipleServicesSection: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.md,
    alignItems: "center",
  },
  // Multiple Services Form Styles
  multipleServicesContainer: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.lg,
  },
  multipleServicesTitle: {
    marginBottom: MARGIN.sm,
  },
  multipleServicesSubtitle: {
    marginBottom: MARGIN.lg,
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
  addAnotherServiceButton: {
    marginTop: MARGIN.lg,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.screen,
    paddingVertical: MARGIN.md,
    backgroundColor: COLORS.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalCloseButton: {
    padding: PADDING.sm,
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  modalCard: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
  },
  modalSectionTitle: {
    marginBottom: MARGIN.lg,
  },
  emptyAddressState: {
    alignItems: "center",
    paddingVertical: MARGIN.xl,
  },
  emptyAddressText: {
    textAlign: "center",
    marginTop: MARGIN.md,
  },
  addNewAddressButton: {
    marginTop: MARGIN.sm,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: PADDING.screen,
    paddingVertical: MARGIN.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: MARGIN.md,
  },
  modalCancelButton: {
    flex: 1,
    borderColor: COLORS.error[500],
    borderWidth: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalCancelButtonText: {
    color: COLORS.error[500],
  },
  modalDoneButton: {
    flex: 1,
  },
  // Inline Form Actions
  formActions: {
    marginTop: MARGIN.xs,
  },
  formCancelButton: {
    flex: 1,
    borderColor: COLORS.error[500],
    borderWidth: 1,
    backgroundColor: COLORS.background.primary,
  },
  formSaveButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
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
  timePickerButtonError: {
    borderColor: COLORS.error[500],
  },
  timePickerText: {
    flex: 1,
    fontSize: 14,
  },
});
