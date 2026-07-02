import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdeas } from '@/context/IdeasContext';
import { useProfile } from '@/context/ProfileContext';
import { IdeaCard } from '@/components/IdeaCard';
import { EmptyState } from '@/components/EmptyState';
import { QuickCaptureSheet } from '@/components/QuickCaptureSheet';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ideas, loading } = useIdeas();
  const { profile } = useProfile();
  const [captureVisible, setCaptureVisible] = useState(false);

  const workingIdeas = ideas.filter((i) => i.status === 'working').slice(0, 3);
  const recentIdeas = ideas.filter((i) => i.status === 'ideas').slice(0, 5);

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPadding = 100 + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16, paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {greeting()}{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </Text>
            <Text style={[styles.date, { color: colors.foreground }]}>{todayLabel()}</Text>
          </View>
          {profile.streak > 0 && (
            <View style={[styles.streak, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[styles.streakText, { color: colors.primary }]}>{profile.streak}</Text>
            </View>
          )}
        </View>

        {/* Continue Working */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Continue Working</Text>
          {workingIdeas.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
                Move an idea to "Working On" to see it here
              </Text>
            </View>
          ) : (
            workingIdeas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
          )}
        </View>

        {/* Recent Ideas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent Ideas</Text>
          {loading ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>Loading…</Text>
            </View>
          ) : recentIdeas.length === 0 ? (
            <View style={[styles.firstRunCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.firstRunIcon, { backgroundColor: colors.muted }]}>
                <Feather name="edit-3" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.firstRunTitle, { color: colors.foreground }]}>Capture your first idea</Text>
              <Text style={[styles.firstRunSub, { color: colors.textSecondary }]}>
                A voice note, a screenshot, a half-formed thought — everything belongs here.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCaptureVisible(true);
                }}
                style={({ pressed }) => [
                  styles.firstRunBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.firstRunBtnText, { color: colors.primaryForeground }]}>
                  Capture an Idea
                </Text>
              </Pressable>
            </View>
          ) : (
            recentIdeas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
          )}
        </View>

        {/* Audience teaser */}
        {profile.connectedPlatforms.length === 0 && (
          <View style={[styles.audienceTeaser, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={16} color={colors.textMuted} />
            <Text style={[styles.audienceTeaserText, { color: colors.textSecondary }]}>
              Connect your channel to see what your audience wants
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setCaptureVisible(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: bottomPadding - 40,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </Pressable>

      <QuickCaptureSheet visible={captureVisible} onClose={() => setCaptureVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  date: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  firstRunCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  firstRunIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  firstRunTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  firstRunSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  firstRunBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 6,
  },
  firstRunBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  audienceTeaser: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audienceTeaserText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#37D67A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
