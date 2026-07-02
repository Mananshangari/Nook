import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Idea } from '@/context/IdeasContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  text: 'file-text',
  link: 'link',
  voice: 'mic',
  photo: 'image',
};

interface Props {
  idea: Idea;
  onLongPress?: () => void;
  compact?: boolean;
}

export function IdeaCard({ idea, onLongPress, compact }: Props) {
  const colors = useColors();
  const router = useRouter();

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/idea/${idea.id}`);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        compact && styles.compact,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.typeIcon, { backgroundColor: colors.muted }]}>
          <Feather name={TYPE_ICONS[idea.type] ?? 'file-text'} size={12} color={colors.primary} />
        </View>
        <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(idea.createdAt)}</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {idea.title || 'Untitled idea'}
      </Text>
      {!compact && idea.content.length > 0 && (
        <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={2}>
          {idea.content}
        </Text>
      )}
      {idea.tags.length > 0 && (
        <View style={styles.tags}>
          {idea.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  compact: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginLeft: 'auto',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 21,
  },
  preview: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
