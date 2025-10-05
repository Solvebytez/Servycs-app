import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResponsiveText } from "./ResponsiveText";
import { BackButton } from "../BackButton";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS, LAYOUT } from "@/constants";

interface AppHeaderProps {
  /** Function to call when back button is pressed */
  onBackPress?: () => void;
  /** Title to display in the header */
  title?: string;
  /** Subtitle text to display below the title */
  subtext?: string;
  /** Show back button (default: true) */
  showBackButton?: boolean;
  /** Custom back button icon name */
  backIconName?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  /** Header background color */
  backgroundColor?: string;
  /** Header text color */
  textColor?: string;
  /** Right side component (optional) */
  rightComponent?: React.ReactNode;
  /** Right action button configuration */
  rightActionButton?: {
    iconName: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
    onPress: () => void;
    backgroundColor?: string;
    iconColor?: string;
  };
  /** Additional styles for the header container */
  style?: ViewStyle;
  /** Additional styles for the navigation container */
  navigationStyle?: ViewStyle;
}

/**
 * Flexible App Header Component
 *
 * A reusable header component that can be used across the entire app.
 * Supports customizable colors, back button, title, and right components.
 *
 * @example
 * // Basic header with back button
 * <AppHeader
 *   onBackPress={() => router.back()}
 *   title="Edit Profile"
 * />
 *
 * // Header without back button
 * <AppHeader
 *   title="Dashboard"
 *   showBackButton={false}
 * />
 *
 * // Custom colored header
 * <AppHeader
 *   title="Settings"
 *   backgroundColor={COLORS.primary[600]}
 *   textColor={COLORS.white}
 * />
 *
 * // Header with right component
 * <AppHeader
 *   title="Profile"
 *   rightComponent={<UserProfileButton />}
 * />
 *
 * // Header with right action button
 * <AppHeader
 *   title="My Listings"
 *   rightActionButton={{
 *     iconName: "add",
 *     onPress: () => router.push("/add-listing"),
 *     backgroundColor: COLORS.primary[300],
 *     iconColor: COLORS.white
 *   }}
 * />
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  onBackPress,
  title,
  subtext,
  showBackButton = true,
  backIconName = "arrow-back",
  backgroundColor = COLORS.primary[200],
  textColor = COLORS.white,
  rightComponent,
  rightActionButton,
  style,
  navigationStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { backgroundColor, paddingTop: insets.top + MARGIN.sm },
        style,
      ]}
    >
      {/* Top Navigation */}
      <View style={[styles.topNavigation, navigationStyle]}>
        {/* Left side - Back button or placeholder */}
        {showBackButton && onBackPress ? (
          <BackButton
            onPress={onBackPress}
            variant="default"
            size="medium"
            showText={false}
            showIcon={true}
            iconName={backIconName}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* Center - Title and Subtext */}
        {(title || subtext) && (
          <View style={styles.titleContainer}>
            {title && (
              <ResponsiveText
                variant="h5"
                weight="bold"
                color={textColor}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </ResponsiveText>
            )}
            {subtext && (
              <ResponsiveText
                variant="body2"
                color={textColor}
                style={styles.subtext}
              >
                {subtext}
              </ResponsiveText>
            )}
          </View>
        )}

        {/* Right side - Custom component, action button, or placeholder */}
        {rightComponent ? (
          rightComponent
        ) : rightActionButton ? (
          <TouchableOpacity
            style={[
              styles.rightActionButton,
              {
                backgroundColor:
                  rightActionButton.backgroundColor || COLORS.primary[300],
              },
            ]}
            onPress={rightActionButton.onPress}
          >
            <Ionicons
              name={rightActionButton.iconName}
              size={LAYOUT.iconMedium}
              color={rightActionButton.iconColor || COLORS.white}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: MARGIN.md - 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  topNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.screen,
    marginBottom: MARGIN.sm,
  },
  placeholder: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: MARGIN.sm,
  },
  subtext: {
    marginTop: MARGIN.xs,
    textAlign: "center",
    opacity: 0.9,
  },
  rightActionButton: {
    width: LAYOUT.buttonHeightSmall,
    height: LAYOUT.buttonHeightSmall,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppHeader;
