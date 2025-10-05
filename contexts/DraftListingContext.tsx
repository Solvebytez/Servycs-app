import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Alert } from "react-native";

// Types
export interface DraftListingData {
  // Step 1: Shop Details & Images
  title: string;
  contactNumber: string;
  whatsappNumber: string;
  categoryIds: string[];
  categoryPaths: any;
  description: string;
  image: string | null;

  // Step 2: Business Hours & Address
  businessHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  selectedAddressId: string | null;

  // Step 3: Multiple Services
  services: Array<{
    id: number;
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    duration: string;
    categoryIds: string[];
    categoryPaths: any;
  }>;

  // Metadata
  currentStep: number;
  isDraft: boolean;
  listingId?: string; // If editing existing draft
}

interface DraftListingContextType {
  data: DraftListingData;
  updateData: (updates: Partial<DraftListingData>) => void;
  setCurrentStep: (step: number) => void;
  saveDraft: () => Promise<void>;
  resetDraft: () => void;
  canProceedToNext: (step: number) => boolean;
  getStepValidationErrors: (step: number) => string[];
}

// Initial state
const initialData: DraftListingData = {
  // Step 1
  title: "",
  contactNumber: "",
  whatsappNumber: "",
  categoryIds: [],
  categoryPaths: [],
  description: "",
  image: null,

  // Step 2
  businessHours: {
    monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    saturday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
  },
  selectedAddressId: null,

  // Step 3
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

  // Metadata
  currentStep: 1,
  isDraft: true,
};

// Action types
type DraftAction =
  | { type: "UPDATE_DATA"; payload: Partial<DraftListingData> }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "RESET_DRAFT" }
  | { type: "SET_LISTING_ID"; payload: string };

// Reducer
const draftReducer = (
  state: DraftListingData,
  action: DraftAction
): DraftListingData => {
  switch (action.type) {
    case "UPDATE_DATA":
      return { ...state, ...action.payload };
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "RESET_DRAFT":
      return { ...initialData };
    case "SET_LISTING_ID":
      return { ...state, listingId: action.payload };
    default:
      return state;
  }
};

// Context
const DraftListingContext = createContext<DraftListingContextType | undefined>(
  undefined
);

// Provider
export const DraftListingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, dispatch] = useReducer(draftReducer, initialData);

  const updateData = (updates: Partial<DraftListingData>) => {
    dispatch({ type: "UPDATE_DATA", payload: updates });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  };

  const resetDraft = () => {
    dispatch({ type: "RESET_DRAFT" });
  };

  // Validation functions
  const validateStep1 = (): string[] => {
    const errors: string[] = [];

    if (!data.title.trim()) {
      errors.push("Shop name is required");
    } else if (data.title.trim().length < 3 || data.title.trim().length > 100) {
      errors.push("Shop name must be between 3 and 100 characters");
    }

    if (!data.contactNumber.trim()) {
      errors.push("Contact number is required");
    } else if (!validateIndianPhoneNumber(data.contactNumber)) {
      errors.push("Please enter a valid Indian mobile number");
    }

    if (!data.whatsappNumber.trim()) {
      errors.push("WhatsApp number is required");
    } else if (!validateIndianPhoneNumber(data.whatsappNumber)) {
      errors.push("Please enter a valid Indian WhatsApp number");
    }

    if (!data.description.trim()) {
      errors.push("Service description is required");
    } else if (
      data.description.trim().length < 5 ||
      data.description.trim().length > 1000
    ) {
      errors.push("Description must be between 5 and 1000 characters");
    }

    return errors;
  };

  const validateStep2 = (): string[] => {
    const errors: string[] = [];

    if (!data.selectedAddressId) {
      errors.push("Please select a business address");
    }

    return errors;
  };

  const validateStep3 = (): string[] => {
    const errors: string[] = [];

    const validServices = data.services.filter((service) => {
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

    if (validServices.length === 0) {
      errors.push(
        "Please add at least one service with valid name, description, and category"
      );
    }

    return errors;
  };

  const getStepValidationErrors = (step: number): string[] => {
    switch (step) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      default:
        return [];
    }
  };

  const canProceedToNext = (step: number): boolean => {
    return getStepValidationErrors(step).length === 0;
  };

  const saveDraft = async (): Promise<void> => {
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
        currentStep: data.currentStep, // Include current step for backend validation
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
            categoryIds:
              service.categoryIds && service.categoryIds.length > 0
                ? service.categoryIds
                : [],
            categoryPaths:
              service.categoryPaths && service.categoryPaths.length > 0
                ? service.categoryPaths
                : [],
          })),
        status: "DRAFT" as const,
      };

      console.log("=== DRAFT DATA BEING SENT ===");
      console.log("Draft data:", JSON.stringify(draftData, null, 2));
      console.log("Services count:", draftData.services.length);
      console.log("Services data:", draftData.services);
      console.log("=============================");

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
          categoryId: draftData.categoryId,
          categoryPath: draftData.categoryPath,
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

      Alert.alert("Success", "Draft saved successfully!");
    } catch (error) {
      console.error("=== DRAFT SAVE ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", (error as any)?.message);
      console.error("Error response:", (error as any)?.response?.data);
      console.error("=========================");

      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Unknown error occurred";
      Alert.alert("Error", `Failed to save draft: ${errorMessage}`);
    }
  };

  // Indian phone number validation
  const validateIndianPhoneNumber = (phoneNumber: string): boolean => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const mobilePattern = /^(\+91|91)?[6-9]\d{9}$/;
    return mobilePattern.test(cleanNumber);
  };

  const contextValue: DraftListingContextType = {
    data,
    updateData,
    setCurrentStep,
    saveDraft,
    resetDraft,
    canProceedToNext,
    getStepValidationErrors,
  };

  return (
    <DraftListingContext.Provider value={contextValue}>
      {children}
    </DraftListingContext.Provider>
  );
};

// Hook
export const useDraftListing = (): DraftListingContextType => {
  const context = useContext(DraftListingContext);
  if (context === undefined) {
    throw new Error(
      "useDraftListing must be used within a DraftListingProvider"
    );
  }
  return context;
};
