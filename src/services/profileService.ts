import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileType = 'business' | 'personal';

const PROFILE_KEY = '@active_profile';

export const ProfileService = {
  async getActiveProfile(): Promise<ProfileType> {
    try {
      const profile = await AsyncStorage.getItem(PROFILE_KEY);
      return (profile as ProfileType) || 'personal';
    } catch (error) {
      console.error('Error getting active profile:', error);
      return 'personal';
    }
  },

  async setActiveProfile(profile: ProfileType): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, profile);
    } catch (error) {
      console.error('Error setting active profile:', error);
    }
  },

  async clearActiveProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      console.error('Error clearing active profile:', error);
    }
  },
};
