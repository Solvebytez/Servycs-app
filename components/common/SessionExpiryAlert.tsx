import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import { COLORS, FONT_SIZE, MARGIN, PADDING, BORDER_RADIUS } from '@/constants';
import { ResponsiveText } from '../UI/ResponsiveText';
import { Ionicons } from '@expo/vector-icons';

export const SessionExpiryAlert: React.FC = () => {
  const { isSessionExpired, message, clearMessage } = useSessionExpiry();

  if (!isSessionExpired || !message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.alertBox}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={20} color={COLORS.warning[500]} />
        </View>
        <View style={styles.messageContainer}>
          <ResponsiveText variant="body2" style={styles.message}>
            {message}
          </ResponsiveText>
        </View>
        <View style={styles.closeContainer}>
          <Ionicons 
            name="close" 
            size={18} 
            color={COLORS.neutral[600]} 
            onPress={clearMessage}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.screen,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning[50],
    borderColor: COLORS.warning[200],
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: PADDING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: MARGIN.sm,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    color: COLORS.warning[700],
    lineHeight: 20,
  },
  closeContainer: {
    marginLeft: MARGIN.sm,
    padding: 4,
  },
});
