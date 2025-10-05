import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import { PopularServiceCard } from "./PopularServiceCard";
import { COLORS, MARGIN, PADDING } from "@/constants";

interface PopularService {
  id: string;
  title: string;
  image?: string;
  vendorName: string;
  category: string;
  price?: number;
  rating?: number;
  totalReviews?: number;
}

interface PopularServicesSectionProps {
  services: PopularService[];
  onViewMore?: () => void;
  onServicePress?: (service: PopularService) => void;
  isLoading?: boolean;
  error?: string;
}

export const PopularServicesSection: React.FC<PopularServicesSectionProps> = ({
  services,
  onViewMore,
  onServicePress,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.title}
          >
            Popular Services
          </ResponsiveText>
        </View>
        <View style={styles.loadingContainer}>
          <ResponsiveText variant="body2" color={COLORS.text.secondary}>
            Loading services...
          </ResponsiveText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.title}
          >
            Popular Services
          </ResponsiveText>
        </View>
        <View style={styles.errorContainer}>
          <ResponsiveText variant="body2" color={COLORS.error[500]}>
            {error}
          </ResponsiveText>
        </View>
      </View>
    );
  }

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="star"
            size={20}
            color={COLORS.primary[500]}
            style={styles.titleIcon}
          />
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.title}
          >
            Popular Services
          </ResponsiveText>
        </View>
        <TouchableOpacity style={styles.seeMoreButton} onPress={onViewMore}>
          <ResponsiveText
            variant="body2"
            weight="medium"
            color={COLORS.text.secondary}
            style={styles.seeMoreText}
          >
            View more
          </ResponsiveText>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.servicesContainer}
      >
        {services.map((service) => (
          <PopularServiceCard
            key={service.id}
            service={service}
            onPress={() => onServicePress?.(service)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: MARGIN.md,
    paddingHorizontal: PADDING.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    lineHeight: 24,
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeMoreText: {
    marginRight: 4,
    fontSize: 12,
  },
  servicesContainer: {
    paddingRight: PADDING.screen,
  },
  loadingContainer: {
    paddingVertical: MARGIN.xl,
    alignItems: "center",
  },
  errorContainer: {
    paddingVertical: MARGIN.xl,
    alignItems: "center",
  },
});
