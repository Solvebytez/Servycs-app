import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";

// Components
import {
  ResponsiveText,
  GlobalStatusBar,
  AppHeader,
  ResponsiveButton as Button,
} from "@/components";

// Constants
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

// Services and Hooks
import { authService } from "@/services/auth";
import { useSalesman } from "@/hooks/useSalesman";

interface VendorFormData {
  // User Account Information
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function AddVendorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current salesman data
  const { data: salesmanUser } = useSalesman();

  const [formData, setFormData] = useState<VendorFormData>({
    // User Account Information
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Real-time validation states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: (vendorData: VendorFormData) =>
      authService.registerUser({
        name: vendorData.name,
        email: vendorData.email,
        password: vendorData.password,
        phone: vendorData.phone,
        username: vendorData.username,
        role: "VENDOR",
        createdBy: salesmanUser?.id, // Pass salesman ID as createdBy
      }),
    onSuccess: (response) => {
      // Invalidate and refetch salesman data to update metrics
      queryClient.invalidateQueries({ queryKey: ["salesman"] });

      // Check if email verification is needed
      const user = response.data.user;
      // registerUser is always for LOCAL provider registrations that need email verification
      if (user) {
        // Navigate to OTP verification screen for vendor email verification
        router.push({
          pathname: "/(auth)/otp-verification",
          params: {
            email: user.email,
            context: "vendor-creation", // Context to identify this is vendor creation
            vendorId: user.id,
            salesmanId: salesmanUser?.id,
          },
        });
      } else {
        // Vendor email is already verified (shouldn't happen for LOCAL provider)
        Alert.alert("Success", "Vendor has been successfully added!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    },
    onError: (error: any) => {
      console.error("Error creating vendor:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to add vendor. Please try again.";
      Alert.alert("Error", errorMessage);
    },
  });

  // Real-time validation functions
  const validateNameRealTime = (name: string) => {
    if (!name.trim()) {
      setNameError("");
      return;
    }
    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters long");
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      setNameError("Name can only contain letters and spaces");
    } else {
      setNameError("");
    }
  };

  const validateEmailRealTime = (email: string) => {
    if (!email.trim()) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const validateUsernameRealTime = (username: string) => {
    if (!username.trim()) {
      setUsernameError("");
      return;
    }
    const usernameRegex = /^[a-z][a-z0-9_-]{4,29}$/;
    if (username.length < 5) {
      setUsernameError("Username must be at least 5 characters");
    } else if (username.length > 30) {
      setUsernameError("Username must not exceed 30 characters");
    } else if (!usernameRegex.test(username.toLowerCase())) {
      setUsernameError(
        "Username must start with a letter and contain only lowercase letters, numbers, underscores, and hyphens"
      );
    } else {
      setUsernameError("");
    }
  };

  const validatePhone = (
    phone: string
  ): { isValid: boolean; message: string } => {
    // Remove all spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Indian phone number validation
    // Valid formats: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;

    if (!cleanPhone) {
      return { isValid: false, message: "Phone number is required" };
    }

    if (!indianPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        message:
          "Please enter a valid Indian phone number (10 digits starting with 6-9)",
      };
    }

    // Additional validation for length
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return {
        isValid: false,
        message:
          "Phone number should be 10 digits (with or without country code)",
      };
    }

    return { isValid: true, message: "" };
  };

  const validatePhoneRealTime = (phone: string) => {
    if (!phone.trim()) {
      setPhoneError("");
      return;
    }
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
    } else {
      setPhoneError("");
    }
  };

  const validatePasswordRealTime = (password: string) => {
    if (!password) {
      setPasswordError("");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPasswordRealTime = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError("");
      return;
    }
    if (confirmPassword !== formData.password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Trigger real-time validation
    switch (field) {
      case "name":
        validateNameRealTime(value);
        break;
      case "email":
        validateEmailRealTime(value);
        break;
      case "username":
        validateUsernameRealTime(value.toLowerCase());
        break;
      case "phone":
        validatePhoneRealTime(value);
        break;
      case "password":
        validatePasswordRealTime(value);
        // Also validate confirm password when password changes
        validateConfirmPasswordRealTime(formData.confirmPassword);
        break;
      case "confirmPassword":
        validateConfirmPasswordRealTime(value);
        break;
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.username ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 8 characters long"
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Validation Error", "Please provide a valid email address");
      return;
    }

    // Username validation (if provided)
    if (formData.username && formData.username.trim()) {
      const usernameRegex = /^[a-z][a-z0-9_-]{4,29}$/;
      if (!usernameRegex.test(formData.username.toLowerCase())) {
        Alert.alert(
          "Validation Error",
          "Username must start with a letter and contain only lowercase letters, numbers, underscores, and hyphens (5-30 characters)"
        );
        return;
      }
    }

    // Check if salesman data is available
    if (!salesmanUser?.id) {
      Alert.alert("Error", "Unable to identify salesman. Please try again.");
      return;
    }

    // Call the API using the mutation
    createVendorMutation.mutate(formData);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <GlobalStatusBar />

      {/* Header */}
      <AppHeader
        onBackPress={() => router.back()}
        title="Add New Vendor"
        backgroundColor={COLORS.primary[200]}
        textColor={COLORS.white}
        style={styles.headerNoBorder}
      />

      {/* Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={60}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* User Account Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <ResponsiveText
                variant="h3"
                weight="bold"
                color={COLORS.primary[200]}
                style={styles.sectionTitle}
              >
                User Account Information
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.sectionSubtitle}
              >
                Create vendor login credentials
              </ResponsiveText>
            </View>

            <View style={styles.inputGroup}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Full Name *
              </ResponsiveText>
              <TextInput
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholder="Enter full name"
                style={[
                  styles.textInput,
                  nameError && { borderColor: "#ef4444" },
                ]}
                placeholderTextColor={COLORS.text.secondary}
              />
              {nameError ? (
                <ResponsiveText
                  variant="caption1"
                  color={"#ef4444"}
                  style={styles.errorText}
                >
                  {nameError}
                </ResponsiveText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Username *
              </ResponsiveText>
              <TextInput
                value={formData.username}
                onChangeText={(value) =>
                  handleInputChange("username", value.toLowerCase())
                }
                placeholder="Enter username (lowercase letters, numbers, _ -)"
                autoCapitalize="none"
                style={[
                  styles.textInput,
                  usernameError && { borderColor: "#ef4444" },
                ]}
                placeholderTextColor={COLORS.text.secondary}
              />
              {usernameError ? (
                <ResponsiveText
                  variant="caption1"
                  color={"#ef4444"}
                  style={styles.errorText}
                >
                  {usernameError}
                </ResponsiveText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Email *
              </ResponsiveText>
              <TextInput
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.textInput,
                  emailError && { borderColor: "#ef4444" },
                ]}
                placeholderTextColor={COLORS.text.secondary}
              />
              {emailError ? (
                <ResponsiveText
                  variant="caption1"
                  color={"#ef4444"}
                  style={styles.errorText}
                >
                  {emailError}
                </ResponsiveText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Phone *
              </ResponsiveText>
              <TextInput
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                placeholder="Enter your Indian phone number (e.g., 9876543210)"
                keyboardType="phone-pad"
                maxLength={13}
                style={[
                  styles.textInput,
                  phoneError && { borderColor: "#ef4444" },
                ]}
                placeholderTextColor={COLORS.text.secondary}
              />
              {phoneError ? (
                <ResponsiveText
                  variant="caption1"
                  color={"#ef4444"}
                  style={styles.errorText}
                >
                  {phoneError}
                </ResponsiveText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Password *
              </ResponsiveText>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  placeholder="Enter password (min 8 chars)"
                  secureTextEntry={!showPassword}
                  style={[
                    styles.passwordInput,
                    passwordError && { borderColor: "#ef4444" },
                  ]}
                  placeholderTextColor={COLORS.text.secondary}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <ResponsiveText
                  variant="caption1"
                  color={"#ef4444"}
                  style={styles.errorText}
                >
                  {passwordError}
                </ResponsiveText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ResponsiveText
                variant="inputLabel"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.inputLabel}
              >
                Confirm Password *
              </ResponsiveText>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirmPassword}
                  style={[
                    styles.passwordInput,
                    confirmPasswordError && { borderColor: "#ef4444" },
                  ]}
                  placeholderTextColor={COLORS.text.secondary}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <ResponsiveText
                  variant="caption1"
                  color={"#ef4444"}
                  style={styles.errorText}
                >
                  {confirmPasswordError}
                </ResponsiveText>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Fixed Footer with Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Add Vendor"
            onPress={handleSubmit}
            loading={createVendorMutation.isPending}
            style={styles.submitButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  headerNoBorder: {
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: PADDING.lg,
  },
  section: {
    marginBottom: MARGIN.xl,
  },
  sectionTitleContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: PADDING.xl,
    marginBottom: MARGIN.lg,
    borderWidth: 2,
    borderColor: COLORS.primary[200],
    shadowColor: COLORS.primary[200],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: MARGIN.xs,
  },
  sectionSubtitle: {
    textAlign: "center",
    opacity: 0.9,
  },
  inputGroup: {
    marginBottom: MARGIN.md,
  },
  inputLabel: {
    marginBottom: MARGIN.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    height: 48, // Fixed height for consistent alignment
    textAlignVertical: "center", // Center text vertically
    includeFontPadding: false, // Remove extra font padding
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50, // Make room for eye icon
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    height: 48, // Fixed height for consistent alignment
    textAlignVertical: "center", // Center text vertically
    includeFontPadding: false, // Remove extra font padding
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    marginHorizontal: MARGIN.xs,
    marginRight: MARGIN.sm,
  },
  submitButton: {
    flex: 1,
    marginHorizontal: MARGIN.xs,
    marginLeft: MARGIN.sm,
  },
});
