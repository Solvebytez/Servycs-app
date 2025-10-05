import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";
import { ResponsiveText, ResponsiveButton } from "../UI";

interface EnquiryModalProps {
  visible: boolean;
  onClose: () => void;
  serviceTitle: string;
  contactNumber?: string;
  whatsappNumber?: string;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  visible,
  onClose,
  serviceTitle,
  contactNumber,
  whatsappNumber,
}) => {
  const handleCall = async () => {
    if (!contactNumber) {
      Alert.alert("Error", "Contact number not available for this service.");
      return;
    }

    try {
      const phoneUrl = `tel:${contactNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
        onClose();
      } else {
        Alert.alert("Error", "Unable to make phone calls on this device.");
      }
    } catch (error) {
      console.error("Error opening phone app:", error);
      Alert.alert("Error", "Failed to open phone app. Please try again.");
    }
  };

  const handleWhatsApp = async () => {
    const number = whatsappNumber || contactNumber;

    if (!number) {
      Alert.alert("Error", "WhatsApp number not available for this service.");
      return;
    }

    try {
      // Remove any non-digit characters and ensure it starts with country code
      const cleanNumber = number.replace(/\D/g, "");
      const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=Hi, I'm interested in your service: ${serviceTitle}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        onClose();
      } else {
        // Fallback to WhatsApp Web
        const webUrl = `https://wa.me/${cleanNumber}?text=Hi, I'm interested in your service: ${serviceTitle}`;
        await Linking.openURL(webUrl);
        onClose();
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      Alert.alert("Error", "Failed to open WhatsApp. Please try again.");
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
                !contactNumber && styles.disabledOption,
              ]}
              onPress={handleCall}
              disabled={!contactNumber}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: COLORS.success[500] },
                    !contactNumber && styles.disabledIcon,
                  ]}
                >
                  <Ionicons
                    name="call"
                    size={24}
                    color={!contactNumber ? COLORS.text.light : COLORS.white}
                  />
                </View>

                <View style={styles.optionInfo}>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={
                      !contactNumber ? COLORS.text.light : COLORS.text.primary
                    }
                  >
                    Call Now
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={
                      !contactNumber ? COLORS.text.light : COLORS.text.secondary
                    }
                  >
                    {contactNumber || "Number not available"}
                  </ResponsiveText>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    !contactNumber ? COLORS.text.light : COLORS.text.secondary
                  }
                />
              </View>
            </TouchableOpacity>

            {/* WhatsApp Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                !whatsappNumber && !contactNumber && styles.disabledOption,
              ]}
              onPress={handleWhatsApp}
              disabled={!whatsappNumber && !contactNumber}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: "#25D366" }, // WhatsApp green
                    !whatsappNumber && !contactNumber && styles.disabledIcon,
                  ]}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={24}
                    color={
                      !whatsappNumber && !contactNumber
                        ? COLORS.text.light
                        : COLORS.white
                    }
                  />
                </View>

                <View style={styles.optionInfo}>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={
                      !whatsappNumber && !contactNumber
                        ? COLORS.text.light
                        : COLORS.text.primary
                    }
                  >
                    WhatsApp
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={
                      !whatsappNumber && !contactNumber
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
                    !whatsappNumber && !contactNumber
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
