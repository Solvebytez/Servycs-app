import React, { useState, useEffect } from "react";
import {
  View,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
} from "@/components";
import {
  COLORS,
  PADDING,
  FONT_SIZE,
  LINE_HEIGHT,
  FONT_FAMILY,
  responsiveSpacing,
  responsiveScale,
} from "@/constants";
import { AuthHeader, AuthTabs, AuthForm, AuthButtons } from "./components";
import {
  authHandle,
  registerHandle,
  navigateToDashboard,
} from "@/utils/authUtils";

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);

  const selectedRole = (params.role as string) || "user";

  // Get screen dimensions to ensure gradient covers full height
  const { height: screenHeight } = Dimensions.get("window");

  const handleTabChange = (tab: "login" | "signup") => {
    setActiveTab(tab);
  };

  const handleAuthSubmit = async (
    emailOrUsername: string,
    password: string,
    confirmPassword?: string,
    fullName?: string,
    phone?: string,
    username?: string
  ) => {
    if (isLoading) return; // Prevent multiple submissions

    setIsLoading(true);

    try {
      const userData = {
        name: fullName || emailOrUsername.split("@")[0] || "User",
        email: emailOrUsername.toLowerCase().trim(),
        username: username?.toLowerCase(), // Include username for signup
        avatar: "",
        provider: "LOCAL" as const,
        phone: phone || "", // Include phone field
      };

      let response;
      if (activeTab === "login") {
        // Add password to userData for login
        const loginUserData = {
          ...userData,
          password: password, // Include password for validation
        };
        response = await authHandle(loginUserData);
      } else {
        // Add password and username to userData for registration
        const registerUserData = {
          ...userData,
          username: username?.toLowerCase(), // Include username
          password: password, // Include password for registration
        };
        response = await registerHandle(registerUserData);
      }

      if (response.success) {
        if (activeTab === "login") {
          // For login, navigate to dashboard directly
          const userRole = response.data.user.role || selectedRole;
          navigateToDashboard(userRole);
        } else {
          // For registration, check if email verification is needed
          const user = response.data.user;
          if (user.provider === "LOCAL" && !user.isEmailVerified) {
            // Redirect to OTP verification screen
            router.push({
              pathname: "/(auth)/otp-verification",
              params: { email: user.email },
            });
          } else {
            // Navigate to dashboard for verified users
            const userRole = user.role || selectedRole;
            navigateToDashboard(userRole);
          }
        }
      } else {
        throw new Error(response.message || "Authentication failed");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      Alert.alert(
        "Authentication Error",
        error.message ||
          "An error occurred during authentication. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In is now handled by AuthButtons component
  // No need for a separate handler here

  const handleBackToRoleSelection = () => {
    router.back();
  };

  return (
    <>
      <GlobalStatusBar />
      <LinearGradient
        colors={[COLORS.primary[200], "#E0F7FF", COLORS.white]}
        style={{ flex: 1, height: screenHeight }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.7, 1]}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={60}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, minHeight: screenHeight }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: responsiveSpacing(PADDING.screen),
              paddingTop: responsiveSpacing(40),
              paddingBottom: responsiveSpacing(20),
            }}
          >
            <AuthHeader
              selectedRole={selectedRole}
              onBackPress={handleBackToRoleSelection}
            />

            {/* Logo Section - Centered */}
            <View
              style={{
                alignItems: "center",
                marginBottom: responsiveSpacing(15),
              }}
            >
              <Image
                source={require("../../assets/logo.png")}
                style={{
                  width: responsiveScale(120),
                  height: responsiveScale(120),
                }}
                resizeMode="contain"
              />
            </View>

            <AuthTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <ResponsiveCard
              variant="elevated"
              size="auto"
              padding="large"
              margin="none"
              style={{
                borderRadius: responsiveScale(25),
                alignSelf: "center",
                width: "100%",
              }}
            >
              <AuthForm
                activeTab={activeTab}
                isLoading={isLoading}
                onSubmit={handleAuthSubmit}
              />

              <AuthButtons />
            </ResponsiveCard>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </>
  );
}
