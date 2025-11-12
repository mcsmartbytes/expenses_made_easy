import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProfileType } from '../services/profileService';
import { theme } from '../theme/colors';

interface Props {
  activeProfile: ProfileType;
  onProfileChange: (profile: ProfileType) => void;
}

export default function ProfileSwitcher({ activeProfile, onProfileChange }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.profileButton,
          styles.businessButton,
          activeProfile === 'business' && styles.activeButton,
        ]}
        onPress={() => onProfileChange('business')}
      >
        <Text
          style={[
            styles.profileButtonText,
            activeProfile === 'business' && styles.activeButtonText,
          ]}
        >
          💼 Business
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.profileButton,
          styles.personalButton,
          activeProfile === 'personal' && styles.activeButton,
        ]}
        onPress={() => onProfileChange('personal')}
      >
        <Text
          style={[
            styles.profileButtonText,
            activeProfile === 'personal' && styles.activeButtonText,
          ]}
        >
          🏠 Personal
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  profileButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessButton: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.primary[600],
  },
  personalButton: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.secondary[600],
  },
  activeButton: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  profileButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
  },
  activeButtonText: {
    color: theme.colors.text.inverse,
  },
});
