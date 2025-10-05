import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../constants";
import { ResponsiveText, ResponsiveButton } from "../UI";

interface OfflinePlaceholderProps {
  onReconnect?: () => void;
  availableListsCount?: number;
  savedLists?: Array<{
    id: string;
    name: string;
    itemCount: number;
    color?: string;
    icon?: string;
  }>;
}

export const OfflinePlaceholder: React.FC<OfflinePlaceholderProps> = ({
  onReconnect,
  availableListsCount = 0,
  savedLists = [],
}) => {
  const handleReconnect = () => {
    onReconnect?.();
  };

  return (
    <View style={styles.container}>
      {/* Offline Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.phoneContainer}>
          <View style={styles.phoneScreen}>
            <View style={styles.phoneHeader}>
              <View style={styles.phoneStatusBar}>
                <View style={styles.phoneTime}>9:41</View>
                <View style={styles.phoneIcons}>
                  <Ionicons
                    name="wifi-off"
                    size={16}
                    color={COLORS.text.primary}
                  />
                  <Ionicons
                    name="battery-half"
                    size={16}
                    color={COLORS.text.primary}
                  />
                </View>
              </View>
            </View>
            <View style={styles.phoneContent}>
              <View style={styles.phoneProfile}>
                <Ionicons
                  name="person-circle"
                  size={32}
                  color={COLORS.primary[200]}
                />
                <Ionicons
                  name="exit-outline"
                  size={16}
                  color={COLORS.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Offline Message */}
      <View style={styles.messageContainer}>
        <ResponsiveText
          variant="h3"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.offlineTitle}
        >
          You're Offline
        </ResponsiveText>

        <ResponsiveText
          variant="body1"
          color={COLORS.text.secondary}
          style={styles.offlineMessage}
        >
          Your saved lists are here for you.
        </ResponsiveText>
      </View>

      {/* Reconnect Button */}
      <ResponsiveButton
        variant="outline"
        size="large"
        onPress={handleReconnect}
        style={styles.reconnectButton}
      >
        <Ionicons name="refresh" size={20} color={COLORS.primary[200]} />
        <ResponsiveText
          variant="body2"
          weight="medium"
          color={COLORS.primary[200]}
          style={styles.reconnectText}
        >
          Try to Reconnect
        </ResponsiveText>
      </ResponsiveButton>

      {/* Available Lists Section */}
      {availableListsCount > 0 && (
        <View style={styles.availableListsContainer}>
          <ResponsiveText
            variant="h5"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.availableListsTitle}
          >
            Your Saved Lists
          </ResponsiveText>

          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.availableListsSubtitle}
          >
            ({availableListsCount} lists available)
          </ResponsiveText>

          {/* Sample List Cards */}
          {savedLists.slice(0, 2).map((list, index) => (
            <View key={list.id} style={styles.sampleListCard}>
              <View style={styles.sampleListHeader}>
                <View
                  style={[
                    styles.sampleListIcon,
                    { backgroundColor: list.color || COLORS.primary[200] },
                  ]}
                >
                  <Ionicons
                    name={
                      (list.icon as keyof typeof Ionicons.glyphMap) || "list"
                    }
                    size={16}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.sampleListInfo}>
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={COLORS.text.primary}
                    numberOfLines={1}
                  >
                    {list.name}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="caption2"
                    color={COLORS.text.secondary}
                  >
                    {list.itemCount} {list.itemCount === 1 ? "Place" : "Places"}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.sampleListDetails}>
                <ResponsiveText
                  variant="caption2"
                  color={COLORS.text.secondary}
                  style={styles.sampleListDetail}
                >
                  • Perfect place for short trip
                </ResponsiveText>
                <ResponsiveText
                  variant="caption2"
                  color={COLORS.text.secondary}
                  style={styles.sampleListDetail}
                >
                  • Created Jan 15
                </ResponsiveText>
                <ResponsiveText
                  variant="caption2"
                  color={COLORS.success[500]}
                  style={styles.sampleListDetail}
                >
                  • Available Offline
                </ResponsiveText>
                <ResponsiveText
                  variant="caption2"
                  color={COLORS.text.secondary}
                  style={styles.sampleListDetail}
                >
                  • Sync when connected
                </ResponsiveText>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: PADDING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationContainer: {
    marginBottom: MARGIN.xl,
  },
  phoneContainer: {
    width: 120,
    height: 200,
    backgroundColor: COLORS.neutral[800],
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  phoneHeader: {
    backgroundColor: COLORS.neutral[100],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
  },
  phoneStatusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneTime: {
    fontSize: FONT_SIZE.caption1,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  phoneIcons: {
    flexDirection: "row",
    gap: MARGIN.xs,
  },
  phoneContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.md,
  },
  phoneProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: MARGIN.xl,
  },
  offlineTitle: {
    marginBottom: MARGIN.sm,
    textAlign: "center",
  },
  offlineMessage: {
    textAlign: "center",
    lineHeight: 20,
  },
  reconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
    marginBottom: MARGIN.xl,
  },
  reconnectText: {
    marginLeft: MARGIN.xs,
  },
  availableListsContainer: {
    width: "100%",
    maxWidth: 300,
  },
  availableListsTitle: {
    marginBottom: MARGIN.xs,
  },
  availableListsSubtitle: {
    marginBottom: MARGIN.md,
  },
  sampleListCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: PADDING.md,
    marginBottom: MARGIN.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sampleListHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  sampleListIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.sm,
  },
  sampleListInfo: {
    flex: 1,
  },
  sampleListDetails: {
    gap: MARGIN.xs,
  },
  sampleListDetail: {
    lineHeight: 16,
  },
});

export default OfflinePlaceholder;
