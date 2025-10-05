import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DatePicker from "react-native-date-picker";
import { ResponsiveText, ResponsiveCard, ResponsiveButton } from "../UI";
import { COLORS, FONT_SIZE, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

// Business hours interface
export interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface BusinessHoursProps {
  businessHours: BusinessHours;
  onBusinessHoursChange: (businessHours: BusinessHours) => void;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  saturday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
};

export default function BusinessHoursComponent({
  businessHours,
  onBusinessHoursChange,
}: BusinessHoursProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTimeType, setSelectedTimeType] = useState<"open" | "close">(
    "open"
  );
  const [tempTime, setTempTime] = useState(new Date());

  // Initialize with default hours if not provided
  const currentHours =
    Object.keys(businessHours).length > 0
      ? businessHours
      : DEFAULT_BUSINESS_HOURS;

  const handleToggleDay = (day: string) => {
    const updatedHours = {
      ...currentHours,
      [day]: {
        ...currentHours[day],
        isOpen: !currentHours[day].isOpen,
      },
    };
    onBusinessHoursChange(updatedHours);
  };

  const handleTimeChange = (
    day: string,
    timeType: "open" | "close",
    time: string
  ) => {
    const updatedHours = {
      ...currentHours,
      [day]: {
        ...currentHours[day],
        [timeType === "open" ? "openTime" : "closeTime"]: time,
      },
    };
    onBusinessHoursChange(updatedHours);
  };

  const openTimePicker = (day: string, timeType: "open" | "close") => {
    const currentTime =
      currentHours[day][timeType === "open" ? "openTime" : "closeTime"];
    const [hours, minutes] = currentTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    setSelectedDay(day);
    setSelectedTimeType(timeType);
    setTempTime(date);
    setShowTimePicker(true);
  };

  const handleTimePickerConfirm = () => {
    const timeString = `${tempTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${tempTime.getMinutes().toString().padStart(2, "0")}`;
    handleTimeChange(selectedDay, selectedTimeType, timeString);
    setShowTimePicker(false);
  };

  const handleTimePickerCancel = () => {
    setShowTimePicker(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = currentHours[sourceDay];
    const updatedHours = { ...currentHours };

    DAYS_OF_WEEK.forEach((day) => {
      if (day.key !== sourceDay) {
        updatedHours[day.key] = {
          isOpen: sourceHours.isOpen,
          openTime: sourceHours.openTime,
          closeTime: sourceHours.closeTime,
        };
      }
    });

    onBusinessHoursChange(updatedHours);
  };

  return (
    <View style={styles.container}>
      {DAYS_OF_WEEK.map((day) => (
        <View key={day.key} style={styles.dayRow}>
          {/* Day Label */}
          <View style={styles.dayLabel}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.primary}
            >
              {day.short}
            </ResponsiveText>
          </View>

          {/* Toggle Switch */}
          <View style={styles.toggleContainer}>
            <Switch
              value={currentHours[day.key]?.isOpen || false}
              onValueChange={() => handleToggleDay(day.key)}
              trackColor={{
                false: COLORS.neutral[300],
                true: COLORS.primary[200],
              }}
              thumbColor={
                currentHours[day.key]?.isOpen
                  ? COLORS.primary[500]
                  : COLORS.neutral[500]
              }
            />
          </View>

          {/* Time Pickers */}
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={[
                styles.timeButton,
                !currentHours[day.key]?.isOpen && styles.timeButtonDisabled,
              ]}
              onPress={() => openTimePicker(day.key, "open")}
              disabled={!currentHours[day.key]?.isOpen}
            >
              <ResponsiveText
                variant="body2"
                color={
                  currentHours[day.key]?.isOpen
                    ? COLORS.text.primary
                    : COLORS.text.secondary
                }
              >
                {formatTime(currentHours[day.key]?.openTime || "09:00")}
              </ResponsiveText>
              <Ionicons
                name="chevron-down"
                size={16}
                color={
                  currentHours[day.key]?.isOpen
                    ? COLORS.text.secondary
                    : COLORS.neutral[400]
                }
              />
            </TouchableOpacity>

            <ResponsiveText
              variant="body2"
              color={COLORS.text.secondary}
              style={styles.timeSeparator}
            >
              to
            </ResponsiveText>

            <TouchableOpacity
              style={[
                styles.timeButton,
                !currentHours[day.key]?.isOpen && styles.timeButtonDisabled,
              ]}
              onPress={() => openTimePicker(day.key, "close")}
              disabled={!currentHours[day.key]?.isOpen}
            >
              <ResponsiveText
                variant="body2"
                color={
                  currentHours[day.key]?.isOpen
                    ? COLORS.text.primary
                    : COLORS.text.secondary
                }
              >
                {formatTime(currentHours[day.key]?.closeTime || "18:00")}
              </ResponsiveText>
              <Ionicons
                name="chevron-down"
                size={16}
                color={
                  currentHours[day.key]?.isOpen
                    ? COLORS.text.secondary
                    : COLORS.neutral[400]
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ResponsiveButton
          title="Set All Days Same"
          variant="outline"
          size="small"
          onPress={() => {
            const mondayHours = currentHours.monday;
            copyToAllDays("monday");
          }}
          leftIcon={
            <Ionicons name="copy" size={14} color={COLORS.primary[500]} />
          }
        />

        <ResponsiveButton
          title="Close All Weekends"
          variant="outline"
          size="small"
          onPress={() => {
            const updatedHours = { ...currentHours };
            updatedHours.saturday.isOpen = false;
            updatedHours.sunday.isOpen = false;
            onBusinessHoursChange(updatedHours);
          }}
          leftIcon={
            <Ionicons name="close-circle" size={14} color={COLORS.error[500]} />
          }
        />
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleTimePickerCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ResponsiveText
              variant="h6"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.modalTitle}
            >
              Select {selectedTimeType === "open" ? "Opening" : "Closing"} Time
            </ResponsiveText>

            <ResponsiveText
              variant="body2"
              color={COLORS.text.secondary}
              style={styles.modalSubtitle}
            >
              {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label}
            </ResponsiveText>

            <DatePicker
              date={tempTime}
              onDateChange={setTempTime}
              mode="time"
              style={styles.timePicker}
            />

            <View style={styles.modalActions}>
              <ResponsiveButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={handleTimePickerCancel}
                style={styles.modalButton}
              />
              <ResponsiveButton
                title="Confirm"
                variant="primary"
                size="medium"
                onPress={handleTimePickerConfirm}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: MARGIN.lg,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: PADDING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dayLabel: {
    width: 45,
  },
  toggleContainer: {
    marginRight: MARGIN.xs,
  },
  timeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.primary,
    gap: MARGIN.xs,
  },
  timeButtonDisabled: {
    backgroundColor: COLORS.neutral[100],
    borderColor: COLORS.neutral[200],
  },
  timeSeparator: {
    marginHorizontal: MARGIN.xs,
  },
  quickActions: {
    flexDirection: "column",
    gap: MARGIN.sm,
    marginTop: MARGIN.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    margin: PADDING.screen,
    minWidth: 300,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
  },
  modalSubtitle: {
    textAlign: "center",
    marginBottom: MARGIN.lg,
  },
  timePicker: {
    height: 200,
    marginBottom: MARGIN.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: MARGIN.sm,
  },
  modalButton: {
    flex: 1,
  },
});
