import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import { ResponsiveButton } from "../UI/ResponsiveButton";
import {
  COLORS,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "../../constants";
import { useUpdateProfile } from "../../hooks/useProfile";

interface BusinessAddressFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  existingAddresses?: any[];
}

interface AddressFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description: string;
  isPrimary: boolean;
}

export const BusinessAddressForm: React.FC<BusinessAddressFormProps> = ({
  onSuccess,
  onCancel,
  existingAddresses = [],
}) => {
  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    description: "",
    isPrimary: false,
  });

  const [errors, setErrors] = useState<Partial<AddressFormData>>({});

  const updateProfileMutation = useUpdateProfile();

  const handleInputChange = (
    field: keyof AddressFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Address type is required";
    } else if (
      formData.name.trim().length < 2 ||
      formData.name.trim().length > 50
    ) {
      newErrors.name = "Address type must be between 2 and 50 characters";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Landmark is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required";
    } else if (!/^[1-9][0-9]{5}$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid Indian zip code (6 digits)";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create new address object
      const newAddress = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim(),
        description: formData.description.trim() || "",
        isPrimary: existingAddresses.length === 0, // Set as primary if no existing addresses
      };

      // Only send the new address - backend will add it to existing ones
      await updateProfileMutation.mutateAsync({
        businessAddresses: [newAddress],
      });

      Alert.alert("Success", "Business address saved successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Error saving business address:", error);
      Alert.alert(
        "Error",
        "Failed to save business address. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Form Header with Title and Close Button */}
      <View style={styles.formHeader}>
        <ResponsiveText
          variant="h6"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.title}
        >
          Add New Address
        </ResponsiveText>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={COLORS.error[500]} />
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
          Address Type *
        </ResponsiveText>
        <TextInput
          style={[styles.textInput, errors.name && styles.inputError]}
          placeholder="e.g., Home, Shop 1, Shop 2, Shop 3, Office"
          placeholderTextColor={COLORS.text.secondary}
          value={formData.name}
          onChangeText={(text) => handleInputChange("name", text)}
          maxLength={50}
        />
        {errors.name && (
          <ResponsiveText
            variant="inputHelper"
            color={COLORS.error[500]}
            style={styles.errorText}
          >
            {errors.name}
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
            City *
          </ResponsiveText>
          <TextInput
            style={[styles.textInput, errors.city && styles.inputError]}
            placeholder="City"
            placeholderTextColor={COLORS.text.secondary}
            value={formData.city}
            onChangeText={(text) => handleInputChange("city", text)}
            maxLength={100}
          />
          {errors.city && (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.error[500]}
              style={styles.errorText}
            >
              {errors.city}
            </ResponsiveText>
          )}
        </View>

        <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
          <ResponsiveText
            variant="inputLabel"
            weight="medium"
            color={COLORS.text.primary}
            style={styles.inputLabel}
          >
            State *
          </ResponsiveText>
          <TextInput
            style={[styles.textInput, errors.state && styles.inputError]}
            placeholder="State"
            placeholderTextColor={COLORS.text.secondary}
            value={formData.state}
            onChangeText={(text) => handleInputChange("state", text)}
            maxLength={100}
          />
          {errors.state && (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.error[500]}
              style={styles.errorText}
            >
              {errors.state}
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
            Zip Code *
          </ResponsiveText>
          <TextInput
            style={[styles.textInput, errors.zipCode && styles.inputError]}
            placeholder="Zip Code"
            placeholderTextColor={COLORS.text.secondary}
            value={formData.zipCode}
            onChangeText={(text) => handleInputChange("zipCode", text)}
            keyboardType="numeric"
            maxLength={6}
          />
          {errors.zipCode && (
            <ResponsiveText
              variant="inputHelper"
              color={COLORS.error[500]}
              style={styles.errorText}
            >
              {errors.zipCode}
            </ResponsiveText>
          )}
        </View>

        <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
          <ResponsiveText
            variant="inputLabel"
            weight="medium"
            color={COLORS.text.primary}
            style={styles.inputLabel}
          >
            Country *
          </ResponsiveText>
          <TextInput
            style={styles.textInput}
            placeholder="Country"
            placeholderTextColor={COLORS.text.secondary}
            value={formData.country}
            onChangeText={(text) => handleInputChange("country", text)}
            maxLength={100}
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
          Landmark *
        </ResponsiveText>
        <TextInput
          style={[
            styles.textInput,
            styles.textArea,
            errors.address && styles.inputError,
          ]}
          placeholder="Enter your landmark"
          placeholderTextColor={COLORS.text.secondary}
          value={formData.address}
          onChangeText={(text) => handleInputChange("address", text)}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          maxLength={500}
        />
        {errors.address && (
          <ResponsiveText
            variant="inputHelper"
            color={COLORS.error[500]}
            style={styles.errorText}
          >
            {errors.address}
          </ResponsiveText>
        )}
      </View>

      {/* Form Actions */}
      <View style={styles.formActions}>
        <ResponsiveButton
          title={updateProfileMutation.isPending ? "Saving..." : "Save Address"}
          variant="primary"
          size="medium"
          onPress={handleSubmit}
          loading={updateProfileMutation.isPending}
          disabled={updateProfileMutation.isPending}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: PADDING.md,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.error[50],
    justifyContent: "center",
    alignItems: "center",
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
  errorText: {
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 10,
  },
  formActions: {
    marginTop: MARGIN.lg,
  },
  submitButton: {
    // Primary button styling
  },
});

export default BusinessAddressForm;
