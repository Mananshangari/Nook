import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdeas, Message, IdeaStatus } from '@/context/IdeasContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const STATUS_LABELS: Record<IdeaStatus, string> = {
  ideas: 'Ideas',
  working: 'Working On',
  published: 'Published',
};

const STATUS_COLORS: Record<IdeaStatus, string> = {
  ideas: '#6B6B6B',
  working: '#37D67A',
  published: '#60A5FA',
};

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const AI_PROMPTS = [
  'Expand this idea',
  'Give me 5 hooks',
  'Challenge this concept',
  'How could this be a series?',
  'Turn this into a script outline',
];

async function getMockAIResponse(userMsg: string, ideaTitle: string, ideaContent: string): Promise<string> {
  const delay = 900 + Math.random() * 700;
  await new Promise((r) => setTimeout(r, delay));

  const msg = userMsg.toLowerCase();

  if (msg.includes('expand') || msg.includes('explore') || msg.includes('more detail')) {
    return `Let me dig into the layers of "${ideaTitle}".\n\nThe core insight here is about tension — your audience feels it too, which is why this lands. A few directions to develop:\n\n**The human angle:** What personal story brought you here? Authentic origin makes ideas memorable.\n\n**The counterintuitive hook:** Most people assume the opposite of what you're arguing. Lead with that conflict.\n\n**The practical takeaway:** What can someone do differently tomorrow because of this idea? Ground it in a real action.\n\nWhich direction feels most alive to you?`;
  }

  if (msg.includes('hook') || msg.includes('title') || msg.includes('headline')) {
    return `5 hooks for "${ideaTitle}":\n\n1. "I tried this for 30 days. Here's what happened."\n\n2. "Everyone gets this wrong — including me, until now."\n\n3. "The thing nobody tells you about [${ideaTitle.split(' ').slice(0, 3).join(' ')}]"\n\n4. "Why [common belief] is actually backwards"\n\n5. "I wasted two years before I figured this out."\n\nThe strongest hook is usually the one that creates the most tension in the fewest words. Which one makes you want to keep reading?`;
  }

  if (msg.includes('challenge') || msg.includes('devil') || msg.includes('problem') || msg.includes('wrong')) {
    return `Playing devil's advocate on "${ideaTitle}":\n\n**The obvious objection:** Someone will say "this only works if you already have an audience." How do you answer that?\n\n**The timing question:** Why now? What's changed in the last 12 months that makes this relevant today vs. 2 years ago?\n\n**The edge case:** Who does this NOT work for? Acknowledging the limits makes the rest of your argument more credible.\n\n**The competitor:** Someone probably already made a version of this. What makes yours different — or better — or more honest?\n\nStrong ideas survive being poked. Which of these feels like the real weak spot?`;
  }

  if (msg.includes('series') || msg.includes('part') || msg.includes('multi') || msg.includes('sequel')) {
    return `"${ideaTitle}" has real series potential. Here's how I'd structure it:\n\n**Part 1 — The Problem** (this video): Establish the tension. Why does this matter? Make them feel the pain point.\n\n**Part 2 — The System** (follow-up): Your framework, method, or process. This is where you deliver the solution.\n\n**Part 3 — The Results** (proof): What happened when you or others applied this? Real outcomes, not theory.\n\n**Part 4 — The Edge Cases** (advanced): For the audience that went deep. Handle the exceptions and nuance.\n\nSeries work best when each episode stands alone AND leaves them wanting more. What's the cliffhanger at the end of Part 1?`;
  }

  if (msg.includes('script') || msg.includes('outline') || msg.includes('structure') || msg.includes('format')) {
    return `Script outline for "${ideaTitle}":\n\n**Hook (0:00–0:30):** Open with the most surprising or counterintuitive statement from your idea. No preamble.\n\n**Setup (0:30–2:00):** Why this matters. What problem does your audience have that this solves? Make them nod.\n\n**Core (2:00–8:00):** Your 3 main points. Each with a claim, evidence, and a concrete example. Keep B-roll in mind.\n\n**Application (8:00–10:00):** What does the audience do next? Make it specific and actionable.\n\n**Close (10:00–10:30):** Call to action + tease the next video.\n\nTotal runtime: ~10 min. Adjust the core section if you need more or less depth.`;
  }

  if (msg.includes('audience') || msg.includes('who') || msg.includes('target')) {
    return `Who cares about "${ideaTitle}"?\n\nYour core viewer is probably someone who already knows they have the problem — they just haven't found a framing that resonates. They've watched 5 videos on this. They've read the articles. They're frustrated that nothing quite clicks.\n\nThat's your opening: "You already know the advice. Here's why it's not working."\n\nSecondary audience: people who don't know they have this problem yet. These are your share-bait viewers — when the video lands for them, they'll send it to 3 friends who need it more.\n\nWhat does your primary viewer do right after watching this video? That's the outcome to design toward.`;
  }

  // Default thoughtful response
  return `Interesting direction with "${ideaTitle}".\n\nA few thoughts:\n\nThe tension at the center of this idea is what makes it shareable. People share things that articulate what they already feel but couldn't say.\n\nBefore you develop it further: what's the one sentence version? If you had to summarize the whole idea in 12 words, what would they be? Sometimes the constraint forces the clearest version of the concept.\n\nAlso — what's the stakes? Why does getting this right (or wrong) matter? The bigger the stakes, the more urgent the content feels.\n\nWhat aspect do you want to dig into?`;
}

export default function IdeaDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ideas, updateIdea, deleteIdea, getConversation, addMessage } = useIdeas();

  const idea = ideas.find((i) => i.id === id);
  const messages = getConversation(id ?? '');

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const bottomPadding = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msgText = (text ?? input).trim();
      if (!msgText || isTyping || !idea) return;

      Haptics.selectionAsync();
      setInput('');
      setIsTyping(true);

      await addMessage(id!, { role: 'user', content: msgText });

      try {
        const reply = await getMockAIResponse(msgText, idea.title, idea.content);
        await addMessage(id!, { role: 'assistant', content: reply });
      } catch (_) {
        await addMessage(id!, {
          role: 'assistant',
          content: 'Something went wrong. Try again.',
        });
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, idea, id, addMessage],
  );

  const changeStatus = () => {
    if (!idea) return;
    const opts: IdeaStatus[] = ['ideas', 'working', 'published'];
    Alert.alert('Move to…', undefined, [
      ...opts.filter((s) => s !== idea.status).map((s) => ({
        text: STATUS_LABELS[s],
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          updateIdea(idea.id, { status: s });
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert('Delete idea?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteIdea(idea!.id);
          router.back();
        },
      },
    ]);
  };

  if (!idea) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.notFound, { color: colors.textMuted }]}>Idea not found</Text>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '22' }]}>
            <Feather name="zap" size={12} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, alignSelf: 'flex-end' }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, alignSelf: 'flex-start' },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const allMessages = isTyping
    ? [...messages, { id: '__typing__', role: 'assistant' as const, content: '…', timestamp: Date.now() }]
    : messages;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.navBar, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.navCenter}>
          <Pressable
            onPress={changeStatus}
            style={[
              styles.statusPill,
              { backgroundColor: STATUS_COLORS[idea.status] + '22', borderColor: STATUS_COLORS[idea.status] + '44' },
            ]}
          >
            <Text style={[styles.statusText, { color: STATUS_COLORS[idea.status] }]}>
              {STATUS_LABELS[idea.status]}
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={confirmDelete} hitSlop={12}>
          <Feather name="trash-2" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {/* Inverted message list */}
        <FlatList
          ref={flatListRef}
          data={[...allMessages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          style={styles.flex}
          contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isTyping ? (
              <View style={[styles.msgRow]}>
                <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '22' }]}>
                  <Feather name="zap" size={12} color={colors.primary} />
                </View>
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.ideaHeader}>
              <Text style={[styles.ideaTitle, { color: colors.foreground }]}>{idea.title || 'Untitled'}</Text>
              {idea.content.length > 0 && (
                <Text style={[styles.ideaContent, { color: colors.textSecondary }]}>{idea.content}</Text>
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.aiIntro}>
                <View style={[styles.aiAvatarLarge, { backgroundColor: colors.primary + '22' }]}>
                  <Feather name="zap" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.aiName, { color: colors.foreground }]}>Nook AI</Text>
                  <Text style={[styles.aiSub, { color: colors.textMuted }]}>Your thinking partner</Text>
                </View>
              </View>
              {messages.length === 0 && (
                <View style={styles.promptsGrid}>
                  {AI_PROMPTS.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => sendMessage(p)}
                      style={({ pressed }) => [
                        styles.promptChip,
                        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[styles.promptChipText, { color: colors.textSecondary }]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          }
        />

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.secondary,
              borderTopColor: colors.border,
              paddingBottom: bottomPadding + 8,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Nook anything about this idea…"
            placeholderTextColor={colors.textMuted}
            style={[styles.chatInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage()}
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !isTyping ? colors.primary : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="arrow-up" size={18} color={input.trim() && !isTyping ? colors.primaryForeground : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  navCenter: { flex: 1, alignItems: 'center' },
  statusPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  messageList: { padding: 16, gap: 12, flexGrow: 1 },
  ideaHeader: { marginBottom: 16, gap: 12 },
  ideaTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, lineHeight: 30 },
  ideaContent: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  divider: { height: 1, marginVertical: 4 },
  aiIntro: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  aiSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  promptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  promptChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptChipText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
  },
  bubbleText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    lineHeight: 21,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: { fontSize: 16, fontFamily: 'Inter_400Regular' },
});
