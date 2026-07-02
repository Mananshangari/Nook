import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/context/ProfileContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type CommentCategory = 'requests' | 'questions' | 'constructive' | 'ambiguous';

interface MockComment {
  id: string;
  text: string;
  category: CommentCategory;
  channel: string;
  videoTitle: string;
  upvotes: number;
  hidden?: boolean;
}

const MOCK_COMMENTS: MockComment[] = [
  { id: '1', text: 'Please make a Part 2 of this! I need to know what happens next.', category: 'requests', channel: 'YouTube', videoTitle: 'My Creative Process', upvotes: 847 },
  { id: '2', text: 'Could you do a tutorial on your editing workflow? The cuts in this video are insane', category: 'requests', channel: 'YouTube', videoTitle: 'Behind the Scenes', upvotes: 612 },
  { id: '3', text: 'What camera do you use? The footage looks incredible', category: 'questions', channel: 'YouTube', videoTitle: 'Vlog #42', upvotes: 423 },
  { id: '4', text: 'How long does it take you to film a video like this?', category: 'questions', channel: 'YouTube', videoTitle: 'My Creative Process', upvotes: 318 },
  { id: '5', text: 'Would love to see you collaborate with other creators in your niche', category: 'requests', channel: 'YouTube', videoTitle: 'Q&A Video', upvotes: 291 },
  { id: '6', text: 'The first 3 minutes felt slow — could you get to the point faster? Still loved it though', category: 'constructive', channel: 'YouTube', videoTitle: 'My Creative Process', upvotes: 156 },
  { id: '7', text: 'Audio quality dropped a bit around the 8-min mark, not sure if you noticed', category: 'constructive', channel: 'YouTube', videoTitle: 'Behind the Scenes', upvotes: 89 },
  { id: '8', text: 'Not your best video tbh', category: 'ambiguous', channel: 'YouTube', videoTitle: 'Vlog #42', upvotes: 12 },
  { id: '9', text: 'Series on monetizing as a small creator please!!', category: 'requests', channel: 'YouTube', videoTitle: 'Q&A Video', upvotes: 534 },
  { id: '10', text: 'What does your daily routine look like?', category: 'questions', channel: 'YouTube', videoTitle: 'Q&A Video', upvotes: 267 },
];

const CATEGORIES: { id: CommentCategory; label: string; icon: keyof typeof Feather.glyphMap; desc: string }[] = [
  { id: 'requests', label: 'Requests', icon: 'star', desc: 'Video ideas your audience is asking for' },
  { id: 'questions', label: 'Questions', icon: 'help-circle', desc: 'FAQ your audience has' },
  { id: 'constructive', label: 'Constructive', icon: 'tool', desc: 'Useful feedback to act on' },
  { id: 'ambiguous', label: 'Ambiguous', icon: 'alert-circle', desc: 'Unclear signal — review manually' },
];

const CATEGORY_COLORS: Record<CommentCategory, string> = {
  requests: '#37D67A',
  questions: '#60A5FA',
  constructive: '#FBBF24',
  ambiguous: '#9CA3AF',
};

function CommentItem({ comment, colors }: { comment: MockComment; colors: ReturnType<typeof useColors> }) {
  const [saved, setSaved] = useState(false);

  return (
    <View style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: CATEGORY_COLORS[comment.category] + '22' },
          ]}
        >
          <Feather
            name={CATEGORIES.find((c) => c.id === comment.category)?.icon ?? 'message-circle'}
            size={11}
            color={CATEGORY_COLORS[comment.category]}
          />
        </View>
        <View style={styles.commentMeta}>
          <Text style={[styles.videoTitle, { color: colors.textMuted }]} numberOfLines={1}>
            {comment.videoTitle}
          </Text>
        </View>
        <View style={styles.upvotes}>
          <Feather name="thumbs-up" size={11} color={colors.textMuted} />
          <Text style={[styles.upvoteCount, { color: colors.textMuted }]}>{comment.upvotes.toLocaleString()}</Text>
        </View>
      </View>
      <Text style={[styles.commentText, { color: colors.foreground }]}>{comment.text}</Text>
      <View style={styles.commentActions}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setSaved(!saved);
          }}
          style={({ pressed }) => [
            styles.saveAction,
            {
              backgroundColor: saved ? colors.primary + '22' : colors.muted,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name={saved ? 'check' : 'bookmark'} size={13} color={saved ? colors.primary : colors.textMuted} />
          <Text
            style={[styles.saveActionText, { color: saved ? colors.primary : colors.textMuted }]}
          >
            {saved ? 'Saved as idea' : 'Save as idea'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AudienceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, connectPlatform } = useProfile();

  const [activeCategory, setActiveCategory] = useState<CommentCategory>('requests');
  const [showAll, setShowAll] = useState(false);

  const isConnected = profile.connectedPlatforms.length > 0;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPadding = 80 + (Platform.OS === 'web' ? 34 : 0);

  const filteredComments = MOCK_COMMENTS.filter((c) => c.category === activeCategory);

  if (!isConnected) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.headerArea, { paddingTop: topPadding + 16 }]}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Pulse</Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
            What your audience is actually asking for
          </Text>
        </View>

        <ScrollView contentContainerStyle={[styles.connectContent, { paddingBottom: bottomPadding }]}>
          {/* How it works */}
          <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.howTitle, { color: colors.foreground }]}>How Nook reads your audience</Text>
            {[
              { icon: 'download-cloud', text: 'Scans your comment sections automatically' },
              { icon: 'filter', text: 'Classifies by actionability — requests, questions, feedback' },
              { icon: 'eye-off', text: 'Hides spam and hate by default (you can always see everything)' },
              { icon: 'zap', text: 'Surfaces your next video ideas from what they\'re asking for' },
            ].map((item, i) => (
              <View key={i} style={styles.howRow}>
                <View style={[styles.howIcon, { backgroundColor: colors.muted }]}>
                  <Feather name={item.icon as keyof typeof Feather.glyphMap} size={14} color={colors.primary} />
                </View>
                <Text style={[styles.howText, { color: colors.textSecondary }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Connect platforms */}
          <Text style={[styles.platformsTitle, { color: colors.textSecondary }]}>Connect your channel</Text>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              connectPlatform({ name: 'YouTube', handle: '@yourchannel' });
            }}
            style={({ pressed }) => [
              styles.platformBtn,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.platformIcon, { backgroundColor: '#FF000022' }]}>
              <Feather name="youtube" size={20} color="#FF4444" />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: colors.foreground }]}>YouTube</Text>
              <Text style={[styles.platformSub, { color: colors.textMuted }]}>Full comment access</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.platformBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.5 }]}
          >
            <View style={[styles.platformIcon, { backgroundColor: '#E1306C22' }]}>
              <Feather name="instagram" size={20} color="#E1306C" />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: colors.foreground }]}>Instagram</Text>
              <Text style={[styles.platformSub, { color: colors.textMuted }]}>Requires Creator account · Coming soon</Text>
            </View>
          </Pressable>

        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.headerArea, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Pulse</Text>
          <View style={[styles.connectedBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.connectedText, { color: colors.primary }]}>YouTube</Text>
          </View>
        </View>

        {/* Show all toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleInfo}>
            <Feather name="eye" size={14} color={colors.textSecondary} />
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show filtered comments</Text>
          </View>
          <Switch
            value={showAll}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              setShowAll(v);
            }}
            trackColor={{ false: colors.muted, true: colors.primary + '66' }}
            thumbColor={showAll ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {CATEGORIES.map((cat) => {
            const count = MOCK_COMMENTS.filter((c) => c.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: active ? CATEGORY_COLORS[cat.id] + '18' : colors.card,
                    borderColor: active ? CATEGORY_COLORS[cat.id] + '44' : colors.border,
                  },
                ]}
              >
                <Feather name={cat.icon} size={16} color={CATEGORY_COLORS[cat.id]} />
                <Text style={[styles.statCount, { color: colors.foreground }]}>{count}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Category description */}
      <View style={[styles.catDesc, { borderBottomColor: colors.border }]}>
        <Text style={[styles.catDescText, { color: colors.textSecondary }]}>
          {CATEGORIES.find((c) => c.id === activeCategory)?.desc}
        </Text>
      </View>

      {/* Comments */}
      <FlatList
        data={filteredComments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem comment={item} colors={colors} />}
        contentContainerStyle={[styles.commentsList, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerArea: { paddingHorizontal: 20, gap: 14, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  screenSub: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  connectContent: { padding: 20, gap: 14 },
  howCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  howTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  howIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  howText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 19 },
  platformsTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  platformBtn: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  platformIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  platformSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  connectedText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsRow: { gap: 10, paddingRight: 20, paddingBottom: 2 },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
  },
  statCount: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  catDesc: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  catDescText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  commentsList: { padding: 16, gap: 10 },
  commentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  commentMeta: { flex: 1 },
  videoTitle: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  upvotes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upvoteCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  commentText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  commentActions: { flexDirection: 'row' },
  saveAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveActionText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
