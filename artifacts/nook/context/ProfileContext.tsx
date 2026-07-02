import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConnectedPlatform {
  id: string;
  name: 'YouTube' | 'Instagram' | 'TikTok';
  handle: string;
  connectedAt: number;
}

export interface Profile {
  name: string;
  bio: string;
  streak: number;
  lastActiveDate: string;
  connectedPlatforms: ConnectedPlatform[];
}

const STORAGE_KEY = '@nook_profile';

const DEFAULT_PROFILE: Profile = {
  name: '',
  bio: '',
  streak: 0,
  lastActiveDate: '',
  connectedPlatforms: [],
};

interface ProfileContextValue {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  connectPlatform: (platform: Omit<ConnectedPlatform, 'id' | 'connectedAt'>) => Promise<void>;
  disconnectPlatform: (id: string) => Promise<void>;
  bumpStreak: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setProfile(JSON.parse(raw));
    });
  }, []);

  const save = useCallback(async (next: Profile) => {
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => save({ ...profile, ...patch }),
    [profile, save],
  );

  const connectPlatform = useCallback(
    async (platform: Omit<ConnectedPlatform, 'id' | 'connectedAt'>) => {
      const p: ConnectedPlatform = { id: genId(), connectedAt: Date.now(), ...platform };
      await save({ ...profile, connectedPlatforms: [...profile.connectedPlatforms, p] });
    },
    [profile, save],
  );

  const disconnectPlatform = useCallback(
    async (id: string) => {
      await save({ ...profile, connectedPlatforms: profile.connectedPlatforms.filter((p) => p.id !== id) });
    },
    [profile, save],
  );

  const bumpStreak = useCallback(async () => {
    const today = new Date().toDateString();
    if (profile.lastActiveDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = profile.lastActiveDate === yesterday ? profile.streak + 1 : 1;
    await save({ ...profile, streak: newStreak, lastActiveDate: today });
  }, [profile, save]);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, connectPlatform, disconnectPlatform, bumpStreak }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be inside ProfileProvider');
  return ctx;
}
