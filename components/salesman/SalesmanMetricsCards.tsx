import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import {
  COLORS,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  SPACING,
} from "../../constants";

export interface SalesmanMetric {
  id: string;
  title: string;
  value: string;
  growth?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  target?: string; // For showing target vs actual
}

interface SalesmanMetricsCardsProps {
  metrics: SalesmanMetric[];
  onMetricPress?: (metric: SalesmanMetric) => void;
}

export const SalesmanMetricsCards: React.FC<SalesmanMetricsCardsProps> = ({
  metrics,
  onMetricPress,
}) => {
  return (
    <View style={styles.container}>
      {metrics.map((metric) => (
        <TouchableOpacity
          key={metric.id}
          style={styles.card}
          onPress={() => onMetricPress?.(metric)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            {/* Icon */}
            <View
              style={[styles.iconContainer, { backgroundColor: metric.color }]}
            >
              <Ionicons name={metric.icon} size={24} color={COLORS.white} />
            </View>

            {/* Value and Title */}
            <View style={styles.textContainer}>
              <ResponsiveText
                variant="h4"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.value}
              >
                {metric.value}
              </ResponsiveText>

              {metric.target && (
                <ResponsiveText
                  variant="caption"
                  color={COLORS.text.tertiary}
                  style={styles.target}
                >
                  / {metric.target}
                </ResponsiveText>
              )}

              <ResponsiveText
                variant="caption"
                color={COLORS.text.secondary}
                style={styles.title}
              >
                {metric.title}
              </ResponsiveText>
            </View>

            {/* Growth Indicator */}
            {metric.growth && (
              <View style={styles.growthContainer}>
                <Ionicons
                  name={
                    metric.growth.startsWith("+") ||
                    !metric.growth.startsWith("-")
                      ? "trending-up"
                      : "trending-down"
                  }
                  size={16}
                  color={
                    metric.growth.startsWith("+") ||
                    !metric.growth.startsWith("-")
                      ? COLORS.success[500]
                      : COLORS.error[500]
                  }
                />
                <ResponsiveText
                  variant="caption"
                  color={
                    metric.growth.startsWith("+") ||
                    !metric.growth.startsWith("-")
                      ? COLORS.success[500]
                      : COLORS.error[500]
                  }
                  weight="medium"
                  style={styles.growthText}
                >
                  {metric.growth}
                </ResponsiveText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: MARGIN.md,
    marginBottom: MARGIN.lg,
  },
  card: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.md,
    marginBottom: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    position: "relative",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
    marginBottom: SPACING.xs,
  },
  target: {
    fontSize: 14,
    marginLeft: SPACING.xs,
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: SPACING.xs,
  },
  growthContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xxs,
  },
  growthText: {
    fontSize: 12,
  },
});
