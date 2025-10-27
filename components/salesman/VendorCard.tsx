import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { ResponsiveText, ResponsiveCard } from "@/components";

interface VendorCardProps {
  vendor: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
    status: "ACTIVE" | "PENDING" | "INACTIVE" | "SUSPENDED";
    isVerified: boolean;
    rating: number;
    totalReviews: number;
    serviceListingsCount: number;
    createdAt: string;
    profilePicture?: string;
  };
  onPress: () => void;
  onResendOTP?: (vendorId: string) => Promise<void>;
}

export const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  onPress,
  onResendOTP,
}) => {
  const [isResendingOTP, setIsResendingOTP] = React.useState(false);
  const [canResend, setCanResend] = React.useState(true);
  const [cooldownTime, setCooldownTime] = React.useState(0);

  // Cooldown timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownTime]);

  const handleResendOTP = async (vendorId: string) => {
    if (!onResendOTP || !canResend) return;

    setIsResendingOTP(true);
    setCanResend(false);

    try {
      await onResendOTP(vendorId);
      // Start 60-second cooldown after successful send
      setCooldownTime(60);
    } catch (error) {
      console.error("Error resending OTP:", error);
      // Reset on error
      setCanResend(true);
    } finally {
      setIsResendingOTP(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return COLORS.success[500];
      case "PENDING":
        return COLORS.warning[500];
      case "INACTIVE":
        return COLORS.error[500];
      case "VERIFIED":
        return COLORS.primary[500];
      default:
        return COLORS.neutral[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "checkmark-circle";
      case "PENDING":
        return "time";
      case "INACTIVE":
        return "pause-circle";
      case "SUSPENDED":
        return "ban";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starIndex = index + 1;
      let iconName = "star-outline";

      if (starIndex <= Math.floor(rating)) {
        iconName = "star";
      } else if (starIndex === Math.ceil(rating) && rating % 1 !== 0) {
        iconName = "star-half";
      }

      return (
        <Ionicons
          key={index}
          name={iconName as any}
          size={12}
          color="#FF8C00"
          style={{ marginRight: 1 }}
        />
      );
    });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <ResponsiveCard variant="elevated" style={styles.card}>
        <View style={styles.cardContent}>
          {/* Header with Avatar and Status */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {vendor.profilePicture ? (
                <Image
                  source={{ uri: vendor.profilePicture }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={24}
                    color={COLORS.primary[500]}
                  />
                </View>
              )}
              {vendor.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color={COLORS.white} />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.vendorName}
                  numberOfLines={1}
                >
                  {vendor.businessName || vendor.name}
                </ResponsiveText>
              </View>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(vendor.status) + "15" },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(vendor.status) as any}
                    size={10}
                    color={getStatusColor(vendor.status)}
                  />
                  <ResponsiveText
                    variant="caption2"
                    weight="medium"
                    color={getStatusColor(vendor.status)}
                    style={styles.statusText}
                  >
                    {vendor.status}
                  </ResponsiveText>
                </View>
              </View>
            </View>
          </View>

          {/* Business Info */}
          <View style={styles.businessInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail" size={12} color={COLORS.primary[500]} />
              </View>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.infoText}
                numberOfLines={1}
              >
                {vendor.businessEmail || vendor.email}
              </ResponsiveText>
              <View style={styles.emailVerifiedBadge}>
                <Ionicons
                  name={vendor.isVerified ? "checkmark-circle" : "close-circle"}
                  size={12}
                  color={
                    vendor.isVerified
                      ? COLORS.success[500]
                      : COLORS.warning[500]
                  }
                />
                <ResponsiveText
                  variant="caption3"
                  weight="medium"
                  color={
                    vendor.isVerified
                      ? COLORS.success[500]
                      : COLORS.warning[500]
                  }
                  style={styles.emailVerifiedText}
                >
                  {vendor.isVerified ? "Email Verified" : "Not Verified"}
                </ResponsiveText>
              </View>
            </View>

            {vendor.businessPhone && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call" size={12} color={COLORS.primary[500]} />
                </View>
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.infoText}
                >
                  {vendor.businessPhone}
                </ResponsiveText>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={12} color="#FF8C00" />
              </View>
              <ResponsiveText
                variant="caption2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.statText}
              >
                {vendor.rating.toFixed(1)}
              </ResponsiveText>
              <ResponsiveText
                variant="caption3"
                color={COLORS.text.secondary}
                style={styles.statSubText}
              >
                ({vendor.totalReviews})
              </ResponsiveText>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="grid" size={12} color={COLORS.primary[500]} />
              </View>
              <ResponsiveText
                variant="caption2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.statText}
              >
                {vendor.serviceListingsCount}
              </ResponsiveText>
              <ResponsiveText
                variant="caption3"
                color={COLORS.text.secondary}
                style={styles.statSubText}
              >
                services
              </ResponsiveText>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="calendar"
                  size={12}
                  color={COLORS.primary[500]}
                />
              </View>
              <ResponsiveText
                variant="caption2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.statText}
              >
                {formatDate(vendor.createdAt)}
              </ResponsiveText>
            </View>
          </View>

          {/* Resend OTP Button for Unverified Vendors */}
          {!vendor.isVerified && (
            <View style={styles.resendOtpContainer}>
              <TouchableOpacity
                style={[
                  styles.resendOtpButton,
                  (!canResend || isResendingOTP) &&
                    styles.resendOtpButtonDisabled,
                ]}
                onPress={() => handleResendOTP(vendor.id)}
                disabled={!canResend || isResendingOTP}
              >
                <Ionicons
                  name="mail"
                  size={14}
                  color={
                    canResend && !isResendingOTP
                      ? COLORS.primary[500]
                      : COLORS.text.secondary
                  }
                />
                <ResponsiveText
                  variant="caption2"
                  weight="medium"
                  color={
                    canResend && !isResendingOTP
                      ? COLORS.primary[500]
                      : COLORS.text.secondary
                  }
                  style={styles.resendOtpText}
                >
                  {isResendingOTP
                    ? "Sending..."
                    : cooldownTime > 0
                    ? `Resend in ${cooldownTime}s`
                    : "Resend OTP"}
                </ResponsiveText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ResponsiveCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: MARGIN.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    padding: PADDING.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: MARGIN.sm,
  },
  avatarContainer: {
    position: "relative",
    marginRight: MARGIN.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary[100],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary[100],
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary[500],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  vendorName: {
    flex: 1,
    fontSize: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  statusText: {
    marginLeft: MARGIN.xs,
    fontSize: 11,
    fontWeight: "600",
  },
  businessInfo: {
    marginBottom: MARGIN.sm,
    paddingVertical: PADDING.xs,
    paddingHorizontal: PADDING.sm,
    backgroundColor: COLORS.background.light,
    borderRadius: BORDER_RADIUS.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  infoIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: MARGIN.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: PADDING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  statIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: MARGIN.xs,
  },
  statText: {
    marginRight: MARGIN.xs,
    fontSize: 12,
    fontWeight: "600",
  },
  statSubText: {
    fontSize: 10,
  },
  emailVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: MARGIN.sm,
  },
  emailVerifiedText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: MARGIN.xs,
  },
  resendOtpContainer: {
    marginTop: MARGIN.sm,
    paddingTop: MARGIN.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  resendOtpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.xs,
    paddingHorizontal: PADDING.sm,
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  resendOtpText: {
    marginLeft: MARGIN.xs,
    fontSize: 11,
  },
  resendOtpButtonDisabled: {
    backgroundColor: COLORS.neutral[100],
    borderColor: COLORS.neutral[200],
    opacity: 0.6,
  },
});

export default VendorCard;
