import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfileService, ProfileType } from '../services/profileService';

interface ProfileContextType {
  activeProfile: ProfileType;
  setActiveProfile: (profile: ProfileType) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<ProfileType>('personal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await ProfileService.getActiveProfile();
      setActiveProfileState(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveProfile = async (profile: ProfileType) => {
    try {
      await ProfileService.setActiveProfile(profile);
      setActiveProfileState(profile);
    } catch (error) {
      console.error('Error setting profile:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
