import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdeas, IdeaType, IdeaStatus, Idea } from '@/context/IdeasContext';
import { IdeaCard } from '@/components/IdeaCard';
import { EmptyState } from '@/components/EmptyState';
import { QuickCaptureSheet } from '@/components/QuickCaptureSheet';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type FilterTab = 'all' | IdeaType;

const FILTER_TABS: { id: FilterTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'layers' },
  { id: 'text', label: 'Text', icon: 'file-text' },
  { id: 'link', label: 'Links', icon: 'link' },
  { id: 'voice', label: 'Voice', icon: 'mic' },
  { id: 'photo', label: 'Photos', icon: 'image' },
];

type WorkspaceStatus = 'ideas' | 'working' | 'published';
const WORKSPACE: { id: WorkspaceStatus; label: string }[] = [
  { id: 'ideas', label: 'Ideas' },
  { id: 'working', label: 'Working On' },
  { id: 'published', label: 'Published' },
];

export default function IdeasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ideas, deleteIdea, moveIdea } = useIdeas();

  const [captureVisible, setCaptureVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>('ideas');

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPadding = 100 + (Platform.OS === 'web' ? 34 : 0);

  const filtered = useMemo(() => {
    let list = ideas.filter((i) => i.status === workspaceStatus);
    if (filterTab !== 'all') list = list.filter((i) => i.type === filterTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [ideas, filterTab, search, workspaceStatus]);

  const handleLongPress = (idea: Idea) => {
    const nextStatuses: Record<WorkspaceStatus, IdeaStatus[]> = {
      ideas: ['working', 'published'],
      working: ['ideas', 'published'],
      published: ['ideas', 'working'],
    };
    Alert.alert(idea.title || 'Idea', undefined, [
      ...nextStatuses[workspaceStatus].map((s) => ({
        text: `Move to "${WORKSPACE.find((w) => w.id === s)?.label}"`,
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          moveIdea(idea.id, s);
        },
      })),
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteIdea(idea.id);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerArea, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Ideas</Text>
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {ideas.length} saved
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search ideas…"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Workspace tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workspaceTabs}>
          {WORKSPACE.map((w) => {
            const count = ideas.filter((i) => i.status === w.id).length;
            const active = workspaceStatus === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setWorkspaceStatus(w.id);
                }}
                style={[
                  styles.workspaceTab,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.workspaceTabText,
                    { color: active ? colors.primaryForeground : colors.textSecondary },
                  ]}
                >
                  {w.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: active ? 'rgba(0,0,0,0.2)' : colors.muted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: active ? colors.primaryForeground : colors.textMuted },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_TABS.map((f) => {
            const active = filterTab === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilterTab(f.id);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.muted : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name={f.icon} size={12} color={active ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.filterLabel,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IdeaCard idea={item} onLongPress={() => handleLongPress(item)} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding },
          filtered.length === 0 && styles.centered,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="zap"
            title={search ? 'No ideas match' : `No ${WORKSPACE.find((w) => w.id === workspaceStatus)?.label.toLowerCase()} yet`}
            subtitle={search ? 'Try a different search.' : 'Long-press an idea to move it here.'}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
      />

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
  headerArea: { paddingHorizontal: 20, gap: 14, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  workspaceTabs: { gap: 8, paddingRight: 20 },
  workspaceTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  workspaceTabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  badge: {
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  filterRow: { gap: 6, paddingRight: 20 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  listContent: { paddingHorizontal: 20, paddingTop: 4 },
  centered: { flex: 1, justifyContent: 'center' },
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
