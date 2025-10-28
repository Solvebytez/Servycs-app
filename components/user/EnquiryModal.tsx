import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";
import { ResponsiveText, ResponsiveButton } from "../UI";
import { enquiryService, EnquiryChannel } from "../../services/enquiry";

interface EnquiryModalProps {
  visible: boolean;
  onClose: () => void;
  serviceTitle: string;
  contactNumber?: string;
  whatsappNumber?: string;
  // Enquiry tracking props
  vendorId?: string;
  listingId?: string;
  serviceId?: string;
  userId?: string;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  visible,
  onClose,
  serviceTitle,
  contactNumber,
  whatsappNumber,
  vendorId,
  listingId,
  serviceId,
  userId,
}) => {
  // Loading states for tracking
  const [isTrackingCall, setIsTrackingCall] = useState(false);
  const [isTrackingWhatsApp, setIsTrackingWhatsApp] = useState(false);
  const handleCall = async () => {
    if (!contactNumber) {
      Alert.alert("Error", "Contact number not available for this service.");
      return;
    }

    // Start loading state for tracking
    setIsTrackingCall(true);

    // Start background enquiry tracking (non-blocking)
    if (vendorId && listingId && userId) {
      enquiryService.createEnquiryInBackground({
        vendorId,
        listingId,
        serviceId,
        userId,
        channel: EnquiryChannel.PHONE,
        message: `Interested in ${serviceTitle}`,
      });
    }

    try {
      const phoneUrl = `tel:${contactNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
        onClose(); // Close modal immediately
      } else {
        Alert.alert("Error", "Unable to make phone calls on this device.");
      }
    } catch (error) {
      console.error("Error opening phone app:", error);
      Alert.alert("Error", "Failed to open phone app. Please try again.");
    } finally {
      // Reset loading state after external app opens
      setIsTrackingCall(false);
    }
  };

  const handleWhatsApp = async () => {
    const number = whatsappNumber || contactNumber;

    if (!number) {
      Alert.alert("Error", "WhatsApp number not available for this service.");
      return;
    }

    // Start loading state for tracking
    setIsTrackingWhatsApp(true);

    // Start background enquiry tracking (non-blocking)
    if (vendorId && listingId && userId) {
      enquiryService.createEnquiryInBackground({
        vendorId,
        listingId,
        serviceId,
        userId,
        channel: EnquiryChannel.WHATSAPP,
        message: `Hi, I'm interested in your service: ${serviceTitle}`,
      });
    }

    try {
      // Remove any non-digit characters and ensure it starts with country code
      const cleanNumber = number.replace(/\D/g, "");
      const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=Hi, I'm interested in your service: ${serviceTitle}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        onClose(); // Close modal immediately
      } else {
        // Fallback to WhatsApp Web
        const webUrl = `https://wa.me/${cleanNumber}?text=Hi, I'm interested in your service: ${serviceTitle}`;
        await Linking.openURL(webUrl);
        onClose(); // Close modal immediately
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      Alert.alert("Error", "Failed to open WhatsApp. Please try again.");
    } finally {
      // Reset loading state after external app opens
      setIsTrackingWhatsApp(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.container}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>

            <ResponsiveText
              variant="h6"
              weight="semiBold"
              color={COLORS.text.primary}
              style={styles.headerTitle}
            >
              Contact Service Provider
            </ResponsiveText>

            <View style={styles.headerRight} />
          </View>

          {/* Service Info */}
          <View style={styles.serviceInfo}>
            <ResponsiveText
              variant="body2"
              color={COLORS.text.secondary}
              style={styles.serviceInfoText}
            >
              You're contacting about:
            </ResponsiveText>
            <ResponsiveText
              variant="body1"
              weight="medium"
              color={COLORS.text.primary}
              numberOfLines={2}
            >
              {serviceTitle}
            </ResponsiveText>
          </View>

          {/* Contact Options */}
          <View style={styles.optionsContainer}>
            {/* Call Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                (!contactNumber || isTrackingCall) && styles.disabledOption,
              ]}
              onPress={handleCall}
              disabled={!contactNumber || isTrackingCall}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: COLORS.success[500] },
                    (!contactNumber || isTrackingCall) && styles.disabledIcon,
                  ]}
                >
                  {isTrackingCall ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name="call"
                      size={24}
                      color={!contactNumber ? COLORS.text.light : COLORS.white}
                    />
                  )}
                </View>

                <View style={styles.optionInfo}>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={
                      !contactNumber || isTrackingCall
                        ? COLORS.text.light
                        : COLORS.text.primary
                    }
                  >
                    {isTrackingCall ? "Connecting..." : "Call Now"}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={
                      !contactNumber || isTrackingCall
                        ? COLORS.text.light
                        : COLORS.text.secondary
                    }
                  >
                    {contactNumber || "Number not available"}
                  </ResponsiveText>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    !contactNumber || isTrackingCall
                      ? COLORS.text.light
                      : COLORS.text.secondary
                  }
                />
              </View>
            </TouchableOpacity>

            {/* WhatsApp Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                (!whatsappNumber && !contactNumber) || isTrackingWhatsApp
                  ? styles.disabledOption
                  : null,
              ]}
              onPress={handleWhatsApp}
              disabled={
                (!whatsappNumber && !contactNumber) || isTrackingWhatsApp
              }
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: "#25D366" }, // WhatsApp green
                    (!whatsappNumber && !contactNumber) || isTrackingWhatsApp
                      ? styles.disabledIcon
                      : null,
                  ]}
                >
                  {isTrackingWhatsApp ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name="logo-whatsapp"
                      size={24}
                      color={
                        !whatsappNumber && !contactNumber
                          ? COLORS.text.light
                          : COLORS.white
                      }
                    />
                  )}
                </View>

                <View style={styles.optionInfo}>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={
                      (!whatsappNumber && !contactNumber) || isTrackingWhatsApp
                        ? COLORS.text.light
                        : COLORS.text.primary
                    }
                  >
                    {isTrackingWhatsApp ? "Connecting..." : "WhatsApp"}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={
                      (!whatsappNumber && !contactNumber) || isTrackingWhatsApp
                        ? COLORS.text.light
                        : COLORS.text.secondary
                    }
                  >
                    {whatsappNumber || contactNumber || "Number not available"}
                  </ResponsiveText>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    (!whatsappNumber && !contactNumber) || isTrackingWhatsApp
                      ? COLORS.text.light
                      : COLORS.text.secondary
                  }
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.text.secondary}
            />
            <ResponsiveText
              variant="caption1"
              color={COLORS.text.secondary}
              style={styles.footerText}
            >
              Choose your preferred way to contact the service provider
            </ResponsiveText>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 36,
  },
  serviceInfo: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    backgroundColor: COLORS.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  serviceInfoText: {
    marginBottom: MARGIN.xs,
  },
  optionsContainer: {
    padding: PADDING.lg,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: MARGIN.md,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledOption: {
    backgroundColor: COLORS.neutral[100],
    borderColor: COLORS.neutral[200],
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: PADDING.lg,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.md,
  },
  disabledIcon: {
    backgroundColor: COLORS.neutral[300],
  },
  optionInfo: {
    flex: 1,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    backgroundColor: COLORS.neutral[50],
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  footerText: {
    marginLeft: MARGIN.sm,
    flex: 1,
    lineHeight: 16,
  },
});

export default EnquiryModal;
