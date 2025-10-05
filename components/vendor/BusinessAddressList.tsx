import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import { ResponsiveCard } from "../UI/ResponsiveCard";
import { ResponsiveButton } from "../UI/ResponsiveButton";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";
import {
  useBusinessAddresses,
  useDeleteBusinessAddress,
} from "../../hooks/useBusinessAddresses";
import { BusinessAddress } from "../../services/user";
import { BusinessAddressForm } from "./BusinessAddressForm";

interface BusinessAddressListProps {
  selectedAddressId: string | null;
  onAddressSelect: (addressId: string) => void;
  onAddressDeselect: () => void;
}

export const BusinessAddressList: React.FC<BusinessAddressListProps> = ({
  selectedAddressId,
  onAddressSelect,
  onAddressDeselect,
}) => {
  const { data: addresses, isLoading, error, refetch } = useBusinessAddresses();
  const deleteAddressMutation = useDeleteBusinessAddress();
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  const handleDeleteAddress = (addressId: string, addressName: string) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete "${addressName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAddressMutation.mutate(addressId);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary[500]} />
        <ResponsiveText variant="body1" style={styles.loadingText}>
          Loading addresses...
        </ResponsiveText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={24}
          color={COLORS.error[500]}
        />
        <ResponsiveText variant="body1" style={styles.errorText}>
          Failed to load addresses
        </ResponsiveText>
      </View>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="location-outline"
          size={48}
          color={COLORS.text.secondary}
        />
        <ResponsiveText variant="body1" style={styles.emptyText}>
          No addresses found. Add your first address below.
        </ResponsiveText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {addresses.map((address) => (
        <ResponsiveCard
          key={address.id}
          variant="elevated"
          style={[
            styles.addressCard,
            selectedAddressId === address.id && styles.selectedCard,
          ]}
        >
          <TouchableOpacity
            style={styles.addressContent}
            onPress={() => {
              if (selectedAddressId === address.id) {
                onAddressDeselect();
              } else {
                onAddressSelect(address.id);
              }
            }}
          >
            <View style={styles.addressHeader}>
              <View style={styles.addressTitleContainer}>
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.addressTitle}
                >
                  {address.name}
                </ResponsiveText>
                {address.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <ResponsiveText
                      variant="caption1"
                      style={styles.primaryText}
                    >
                      Primary
                    </ResponsiveText>
                  </View>
                )}
              </View>

              <View style={styles.selectionIndicator}>
                {selectedAddressId === address.id ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary[500]}
                  />
                ) : (
                  <Ionicons
                    name="ellipse-outline"
                    size={24}
                    color={COLORS.text.secondary}
                  />
                )}
              </View>
            </View>

            <ResponsiveText
              variant="body2"
              color={COLORS.text.primary}
              style={styles.addressText}
            >
              {address.address}
            </ResponsiveText>

            <ResponsiveText
              variant="body2"
              color={COLORS.text.secondary}
              style={styles.locationText}
            >
              {address.city}, {address.state}
              {address.zipCode && ` - ${address.zipCode}`}
            </ResponsiveText>

            {address.country && (
              <ResponsiveText
                variant="caption1"
                color={COLORS.text.secondary}
                style={styles.countryText}
              >
                {address.country}
              </ResponsiveText>
            )}

            {address.description && (
              <ResponsiveText
                variant="caption1"
                color={COLORS.text.secondary}
                style={styles.descriptionText}
              >
                {address.description}
              </ResponsiveText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAddress(address.id, address.name)}
            disabled={deleteAddressMutation.isPending}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={COLORS.error[500]}
            />
          </TouchableOpacity>
        </ResponsiveCard>
      ))}

      {/* Add New Address Button */}
      <ResponsiveButton
        variant="outline"
        size="medium"
        shape="rounded"
        title={showAddAddressForm ? "Cancel" : "Add New Address"}
        onPress={() => setShowAddAddressForm(!showAddAddressForm)}
        style={styles.addButton}
        leftIcon={
          showAddAddressForm ? (
            <Ionicons name="close" size={20} color={COLORS.primary[500]} />
          ) : (
            <Ionicons name="add" size={20} color={COLORS.primary[500]} />
          )
        }
      />

      {/* Add New Address Form - Inline */}
      {showAddAddressForm && (
        <ResponsiveCard variant="elevated" style={styles.formCard}>
          <BusinessAddressForm
            onSuccess={() => {
              setShowAddAddressForm(false);
              refetch(); // Refresh the addresses list
            }}
            onCancel={() => setShowAddAddressForm(false)}
            existingAddresses={addresses || []}
          />
        </ResponsiveCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: MARGIN.md,
  },
  loadingContainer: {
    padding: PADDING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: MARGIN.sm,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    padding: PADDING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginLeft: MARGIN.sm,
    color: COLORS.error[500],
  },
  emptyContainer: {
    padding: PADDING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: MARGIN.md,
    textAlign: "center",
    color: COLORS.text.secondary,
  },
  addressCard: {
    position: "relative",
  },
  selectedCard: {
    borderColor: COLORS.primary[500],
    borderWidth: 2,
  },
  addressContent: {
    flex: 1,
    paddingRight: 40, // Space for delete button
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: MARGIN.sm,
  },
  addressTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  addressTitle: {
    marginRight: MARGIN.sm,
  },
  primaryBadge: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: MARGIN.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  primaryText: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  selectionIndicator: {
    marginLeft: MARGIN.sm,
  },
  addressText: {
    marginBottom: MARGIN.xs,
    lineHeight: 20,
  },
  locationText: {
    marginBottom: MARGIN.xs,
  },
  countryText: {
    marginBottom: MARGIN.xs,
  },
  descriptionText: {
    fontStyle: "italic",
    lineHeight: 16,
  },
  deleteButton: {
    position: "absolute",
    top: PADDING.md,
    right: PADDING.md,
    padding: MARGIN.xs,
  },
  addButton: {
    marginTop: MARGIN.md,
  },
  formCard: {
    marginTop: MARGIN.md,
  },
});

export default BusinessAddressList;
