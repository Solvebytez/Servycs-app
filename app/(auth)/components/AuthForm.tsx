import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "@/components/UI/ResponsiveText";
import { ResponsiveButton } from "@/components/UI/ResponsiveButton";
import { COLORS } from "@/constants";
import { responsiveSpacing, responsiveScale } from "@/constants";

interface AuthFormProps {
  activeTab: "login" | "signup";
  isLoading?: boolean;
  onSubmit: (
    emailOrUsername: string,
    password: string,
    confirmPassword?: string,
    fullName?: string,
    phone?: string,
    username?: string
  ) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  activeTab,
  isLoading = false,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time validation states
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Refs for input fields to handle focus navigation
  const fullNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time validation functions
  const validateFullNameRealTime = (name: string) => {
    if (!name.trim()) {
      setFullNameError("");
      return;
    }
    if (name.trim().length < 2) {
      setFullNameError("Full name must be at least 2 characters long");
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      setFullNameError("Full name can only contain letters and spaces");
    } else {
      setFullNameError("");
    }
  };

  const validateEmailRealTime = (email: string) => {
    if (!email.trim()) {
      setEmailError("");
      return;
    }
    // For login, allow both email and username
    if (activeTab === "login") {
      setEmailError("");
      return;
    }
    // For signup, must be valid email
    if (!validateEmail(email)) {
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
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message);
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPasswordRealTime = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError("");
      return;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const validatePassword = (
    password: string
  ): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }
    return { isValid: true, message: "" };
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

  const handleSubmit = () => {
    if (activeTab === "login") {
      // Login validation - email or username
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }
      onSubmit(email, password);
    } else {
      // Signup validation
      if (
        !fullName ||
        !username ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      if (fullName.trim().length < 2) {
        Alert.alert("Error", "Full name must be at least 2 characters long");
        return;
      }

      // Validate username
      const usernameRegex = /^[a-z][a-z0-9_-]{4,29}$/;
      if (!usernameRegex.test(username.toLowerCase())) {
        Alert.alert(
          "Error",
          "Username must start with a letter and contain only lowercase letters, numbers, underscores, and hyphens (5-30 characters)"
        );
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        Alert.alert("Error", phoneValidation.message);
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        Alert.alert("Error", passwordValidation.message);
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      onSubmit(email, password, confirmPassword, fullName, phone, username);
    }
  };

  return (
    <View style={styles.container}>
      {activeTab === "signup" && (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              ref={fullNameRef}
              style={[styles.input, fullNameError ? styles.inputError : null]}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.text.secondary}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                validateFullNameRealTime(text);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            {fullNameError ? (
              <ResponsiveText
                variant="caption1"
                color={COLORS.error[500]}
                style={styles.errorText}
              >
                {fullNameError}
              </ResponsiveText>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              ref={phoneRef}
              style={[styles.input, phoneError ? styles.inputError : null]}
              placeholder="Enter your Indian phone number (e.g., 9876543210)"
              placeholderTextColor={COLORS.text.secondary}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                validatePhoneRealTime(text);
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              maxLength={13} // Allow for +91 prefix
            />
            {phoneError ? (
              <ResponsiveText
                variant="caption1"
                color={COLORS.error[500]}
                style={styles.errorText}
              >
                {phoneError}
              </ResponsiveText>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              ref={usernameRef}
              style={[styles.input, usernameError ? styles.inputError : null]}
              placeholder="Choose a username (e.g., john_doe123)"
              placeholderTextColor={COLORS.text.secondary}
              value={username}
              onChangeText={(text) => {
                // Convert to lowercase as user types
                setUsername(text.toLowerCase());
                validateUsernameRealTime(text.toLowerCase());
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              maxLength={30}
            />
            {usernameError ? (
              <ResponsiveText
                variant="caption1"
                color={COLORS.error[500]}
                style={styles.errorText}
              >
                {usernameError}
              </ResponsiveText>
            ) : null}
          </View>
        </>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={emailRef}
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder={
            activeTab === "login"
              ? "Enter email or username"
              : "Enter your email"
          }
          placeholderTextColor={COLORS.text.secondary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            validateEmailRealTime(text);
          }}
          keyboardType={activeTab === "login" ? "default" : "email-address"}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        {emailError ? (
          <ResponsiveText
            variant="caption1"
            color={COLORS.error[500]}
            style={styles.errorText}
          >
            {emailError}
          </ResponsiveText>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.passwordInputWrapper}>
          <TextInput
            ref={passwordRef}
            style={[
              styles.passwordInput,
              passwordError ? styles.inputError : null,
            ]}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.text.secondary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              validatePasswordRealTime(text);
              // Also validate confirm password if it exists
              if (confirmPassword) {
                validateConfirmPasswordRealTime(confirmPassword);
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType={activeTab === "signup" ? "next" : "done"}
            onSubmitEditing={() => {
              if (activeTab === "signup") {
                confirmPasswordRef.current?.focus();
              } else {
                handleSubmit();
              }
            }}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={responsiveScale(20)}
              color={COLORS.text.secondary}
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <ResponsiveText
            variant="caption1"
            color={COLORS.error[500]}
            style={styles.errorText}
          >
            {passwordError}
          </ResponsiveText>
        ) : null}
      </View>

      {activeTab === "signup" && (
        <View style={styles.inputContainer}>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              ref={confirmPasswordRef}
              style={[
                styles.passwordInput,
                confirmPasswordError ? styles.inputError : null,
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={COLORS.text.secondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                validateConfirmPasswordRealTime(text);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={responsiveScale(20)}
                color={COLORS.text.secondary}
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <ResponsiveText
              variant="caption1"
              color={COLORS.error[500]}
              style={styles.errorText}
            >
              {confirmPasswordError}
            </ResponsiveText>
          ) : null}
        </View>
      )}

      <ResponsiveButton
        title={
          isLoading
            ? "Please wait..."
            : activeTab === "login"
            ? "Log in"
            : "Sign up"
        }
        variant="primary"
        size="medium"
        fullWidth
        onPress={handleSubmit}
        disabled={isLoading}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: responsiveSpacing(16),
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: responsiveScale(8),
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(12),
    fontSize: responsiveScale(14),
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
  passwordInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: responsiveScale(8),
    paddingLeft: responsiveSpacing(16), // Keep left padding same as other inputs
    paddingRight: responsiveSpacing(50), // Make room for eye icon
    paddingVertical: responsiveSpacing(12),
    fontSize: responsiveScale(14),
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
  eyeIcon: {
    position: "absolute",
    right: responsiveSpacing(16),
    padding: responsiveSpacing(4),
  },
  submitButton: {
    marginTop: responsiveSpacing(8),
  },
  inputError: {
    borderColor: COLORS.error[500],
    borderWidth: 2,
  },
  errorText: {
    marginTop: responsiveSpacing(4),
    marginLeft: responsiveSpacing(4),
  },
});

export default AuthForm;
