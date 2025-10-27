import React, { useState, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Alert } from "react-native";
import { ProfileScreen, ProfileData, SettingItem } from "../../../components";
import { COLORS } from "../../../constants";
import { logout } from "../../../utils/authUtils";
import { useSalesman } from "../../../hooks/useSalesman";
import { useQueryClient } from "@tanstack/react-query";

export default function SalesmanProfileScreen() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();

  // Use React Query to fetch salesman data
  const { data: salesmanUser, isLoading, error, refetch } = useSalesman();

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Transform salesman data to ProfileData format
  const salesmanProfileData: ProfileData | null = salesmanUser
    ? {
        id: salesmanUser.id,
        name: salesmanUser.name,
        email: salesmanUser.email,
        username: salesmanUser.username,
        role: "salesman",
        status: salesmanUser.status as
          | "ACTIVE"
          | "PENDING"
          | "INACTIVE"
          | "SUSPENDED"
          | "VERIFIED",
        isEmailVerified: true,
        phone: salesmanUser.phone || "",
        address: "",
        avatar: salesmanUser.avatar,
      }
    : null;

  const handleEditProfile = () => {
    router.push("/(dashboard)/(salesman)/edit-profile");
  };

  // Salesman-specific settings
  const salesmanSettings: SettingItem[] = [
    {
      id: "personal-details",
      title: "Personal Details",
      description: "Update your personal information",
      icon: "person",
      iconColor: COLORS.warning[600],
      iconBackground: COLORS.warning[100],
      onPress: handleEditProfile,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage your notification preferences",
      icon: "notifications",
      iconColor: COLORS.info[600],
      iconBackground: COLORS.info[100],
      onPress: () => {
        // TODO: Navigate to notifications settings
        Alert.alert(
          "Coming Soon",
          "Notifications settings will be available soon."
        );
      },
    },
    {
      id: "privacy-security",
      title: "Privacy & Security",
      description: "Control your privacy settings",
      icon: "shield-checkmark",
      iconColor: COLORS.success[600],
      iconBackground: COLORS.success[100],
      onPress: () => {
        // TODO: Navigate to privacy settings screen
        Alert.alert("Coming Soon", "Privacy settings will be available soon.");
      },
    },
    {
      id: "about-app",
      title: "About App",
      description: "App version and information",
      icon: "information-circle",
      iconColor: COLORS.info[600],
      iconBackground: COLORS.info[100],
      onPress: () => {
        // TODO: Navigate to about app screen
        Alert.alert("Coming Soon", "About app screen will be available soon.");
      },
    },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call backend logout API first
      const { authService } = await import("../../../services/auth");
      await authService.logout();

      // Clear React Query cache
      queryClient.clear();

      // Navigate to role selection only after successful API response
      router.replace("/(auth)/role-selection");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, clear local data and navigate
      queryClient.clear();
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading state or return early if no profile data
  if (isLoading || !salesmanProfileData) {
    return (
      <ProfileScreen
        profileData={{
          id: "loading",
          name: "Loading...",
          email: "loading@example.com",
          role: "salesman",
          status: "PENDING",
          isEmailVerified: false,
        }}
        settings={[]}
        onEditProfile={() => {}}
        onLogout={() => {}}
        title="Manage Account"
        roleSwitchOption={undefined}
      />
    );
  }

  return (
    <ProfileScreen
      profileData={salesmanProfileData}
      settings={salesmanSettings}
      onEditProfile={handleEditProfile}
      onLogout={handleLogout}
      title="Manage Account"
      roleSwitchOption={undefined}
      isLoggingOut={isLoggingOut}
    />
  );
}
