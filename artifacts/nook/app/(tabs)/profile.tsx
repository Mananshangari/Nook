import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdeas } from '@/context/IdeasContext';
import { useProfile } from '@/context/ProfileContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ideas } = useIdeas();
  const { profile, updateProfile, bumpStreak, disconnectPlatform } = useProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  useEffect(() => {
    bumpStreak();
  }, []);

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPadding = 100 + (Platform.OS === 'web' ? 34 : 0);

  const saveName = async () => {
    await updateProfile({ name: nameInput.trim() });
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const statsData = [
    { label: 'Ideas', value: ideas.length.toString(), icon: 'zap' as const },
    { label: 'Working', value: ideas.filter((i) => i.status === 'working').length.toString(), icon: 'edit-3' as const },
    { label: 'Published', value: ideas.filter((i) => i.status === 'published').length.toString(), icon: 'check-circle' as const },
    { label: 'Day streak', value: profile.streak.toString(), icon: 'activity' as const },
  ];

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPadding + 16, paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Profile</Text>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <Pressable
          style={[styles.avatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </Pressable>

        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.primary }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <Pressable onPress={saveName} hitSlop={12}>
              <Feather name="check" size={20} color={colors.primary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setNameInput(profile.name);
              setEditingName(true);
            }}
            style={styles.nameRow}
          >
            <Text style={[styles.name, { color: colors.foreground }]}>
              {profile.name || 'Add your name'}
            </Text>
            <Feather name="edit-2" size={14} color={colors.textMuted} />
          </Pressable>
        )}

        <Text style={[styles.creatorLabel, { color: colors.textMuted }]}>Creator</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {statsData.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={s.icon} size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Connected Platforms */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Connected Platforms</Text>
        {profile.connectedPlatforms.length === 0 ? (
          <View style={[styles.emptyPlatforms, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="link" size={18} color={colors.textMuted} />
            <Text style={[styles.emptyPlatformsText, { color: colors.textMuted }]}>
              Connect platforms in the Pulse tab
            </Text>
          </View>
        ) : (
          profile.connectedPlatforms.map((p) => (
            <View key={p.id} style={[styles.platformRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.platformIcon, { backgroundColor: colors.muted }]}>
                <Feather name="youtube" size={16} color={colors.primary} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={[styles.platformName, { color: colors.foreground }]}>{p.name}</Text>
                <Text style={[styles.platformHandle, { color: colors.textMuted }]}>{p.handle}</Text>
              </View>
              <Pressable
                onPress={() => {
                  Alert.alert('Disconnect', `Remove ${p.name} from Nook?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Disconnect',
                      style: 'destructive',
                      onPress: () => disconnectPlatform(p.id),
                    },
                  ]);
                }}
              >
                <Feather name="x" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Nook principles */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>The Nook Principles</Text>
        <View style={[styles.principlesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            'Capture ideas faster',
            'Develop ideas with AI',
            'Read audience demand via Pulse',
            'Move ideas closer to publishing',
          ].map((p, i) => (
            <View key={i} style={styles.principle}>
              <View style={[styles.principleNum, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.principleNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.principleText, { color: colors.textSecondary }]}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* App version */}
      <Text style={[styles.version, { color: colors.textMuted }]}>Nook V1 · Built for Creators</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    borderBottomWidth: 2,
    paddingBottom: 4,
    minWidth: 160,
  },
  creatorLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyPlatforms: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  emptyPlatformsText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  platformRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  platformHandle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  principlesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  principle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  principleNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  principleText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  version: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingTop: 8 },
});
