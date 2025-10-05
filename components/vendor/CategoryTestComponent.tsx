import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ResponsiveText, ResponsiveButton } from "../UI";
import { CategorySelector } from "./CategorySelector";
import { COLORS } from "../../constants";

/**
 * Test component to verify the category selector functionality
 * This can be used for testing the cascading category system
 */
export const CategoryTestComponent: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const handleCategorySelect = (
    categoryId: string | null,
    categoryPath: string[]
  ) => {
    setSelectedCategoryId(categoryId);
    setSelectedPath(categoryPath);
    setError("");

    if (categoryId) {
      Alert.alert(
        "Category Selected",
        `Selected: ${categoryPath.join(" > ")}\nID: ${categoryId}`,
        [{ text: "OK" }]
      );
    }
  };

  const handleTestValidation = () => {
    if (!selectedCategoryId) {
      setError("Please select a category");
    } else {
      setError("");
      Alert.alert("Success", "Category validation passed!");
    }
  };

  return (
    <View style={styles.container}>
      <ResponsiveText
        variant="heading"
        weight="bold"
        color={COLORS.text.primary}
        style={styles.title}
      >
        Category Selector Test
      </ResponsiveText>

      <CategorySelector
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        error={error}
      />

      <View style={styles.infoContainer}>
        <ResponsiveText
          variant="body1"
          color={COLORS.text.secondary}
          style={styles.infoLabel}
        >
          Selected Category ID:
        </ResponsiveText>
        <ResponsiveText
          variant="body1"
          color={COLORS.text.primary}
          style={styles.infoValue}
        >
          {selectedCategoryId || "None"}
        </ResponsiveText>

        <ResponsiveText
          variant="body1"
          color={COLORS.text.secondary}
          style={styles.infoLabel}
        >
          Selected Path:
        </ResponsiveText>
        <ResponsiveText
          variant="body1"
          color={COLORS.text.primary}
          style={styles.infoValue}
        >
          {selectedPath.length > 0 ? selectedPath.join(" > ") : "None"}
        </ResponsiveText>
      </View>

      <ResponsiveButton
        variant="primary"
        size="medium"
        onPress={handleTestValidation}
        style={styles.testButton}
      >
        Test Validation
      </ResponsiveButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  infoContainer: {
    marginVertical: 20,
    padding: 16,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
  },
  infoLabel: {
    marginBottom: 4,
    fontWeight: "600",
  },
  infoValue: {
    marginBottom: 12,
    fontFamily: "monospace",
  },
  testButton: {
    marginTop: 16,
  },
});

export default CategoryTestComponent;
