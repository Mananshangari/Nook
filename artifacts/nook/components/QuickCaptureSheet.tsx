import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useIdeas, IdeaType } from '@/context/IdeasContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CaptureTab = 'text' | 'link' | 'voice' | 'photo';

const TABS: { id: CaptureTab; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { id: 'text', icon: 'edit-3', label: 'Text' },
  { id: 'link', icon: 'link', label: 'Link' },
  { id: 'voice', icon: 'mic', label: 'Voice' },
  { id: 'photo', icon: 'camera', label: 'Photo' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function QuickCaptureSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addIdea } = useIdeas();

  const [activeTab, setActiveTab] = useState<CaptureTab>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<TextInput>(null);

  const reset = () => {
    setTitle('');
    setContent('');
    setLink('');
    setActiveTab('text');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = useCallback(async () => {
    const t = activeTab === 'link' ? (link.split('/').pop() ?? 'Link idea') : title;
    const c = activeTab === 'link' ? link : content;
    if (!t.trim() && !c.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    await addIdea({ title: t.trim() || c.trim().slice(0, 60), content: c.trim(), type: activeTab as IdeaType });
    setSaving(false);
    handleClose();
  }, [activeTab, title, content, link, addIdea]);

  const canSave = activeTab === 'link' ? link.trim().length > 0 : (title.trim().length > 0 || content.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { backgroundColor: colors.secondary, paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Quick Capture</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Type tabs */}
          <View style={[styles.typeTabs, { backgroundColor: colors.muted }]}>
            {TABS.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab.id);
                }}
                style={[
                  styles.typeTab,
                  activeTab === tab.id && { backgroundColor: colors.card },
                ]}
              >
                <Feather
                  name={tab.icon}
                  size={15}
                  color={activeTab === tab.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: activeTab === tab.id ? colors.primary : colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Input area */}
          {activeTab === 'text' && (
            <View style={styles.inputGroup}>
              <TextInput
                ref={titleRef}
                value={title}
                onChangeText={setTitle}
                placeholder="Title (optional)"
                placeholderTextColor={colors.textMuted}
                style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                returnKeyType="next"
                autoFocus
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Your idea, half-thought, or rough concept..."
                placeholderTextColor={colors.textMuted}
                style={[styles.contentInput, { color: colors.foreground }]}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {activeTab === 'link' && (
            <View style={styles.inputGroup}>
              <View style={[styles.linkInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="link" size={16} color={colors.textMuted} />
                <TextInput
                  value={link}
                  onChangeText={setLink}
                  placeholder="Paste a URL..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.linkField, { color: colors.foreground }]}
                  autoCapitalize="none"
                  keyboardType="url"
                  autoFocus
                />
              </View>
              {link.length > 0 && (
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.notesField, { color: colors.foreground, borderColor: colors.border }]}
                  multiline
                  textAlignVertical="top"
                />
              )}
            </View>
          )}

          {(activeTab === 'voice' || activeTab === 'photo') && (
            <View style={styles.comingSoon}>
              <View style={[styles.comingSoonIcon, { backgroundColor: colors.muted }]}>
                <Feather name={activeTab === 'voice' ? 'mic' : 'camera'} size={28} color={colors.primary} />
              </View>
              <Text style={[styles.comingSoonText, { color: colors.foreground }]}>
                {activeTab === 'voice' ? 'Voice capture' : 'Camera capture'}
              </Text>
              <Text style={[styles.comingSoonSub, { color: colors.textMuted }]}>Coming soon</Text>
            </View>
          )}

          {/* Save button */}
          {(activeTab === 'text' || activeTab === 'link') && (
            <Pressable
              onPress={handleSave}
              disabled={!canSave || saving}
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  backgroundColor: canSave ? colors.primary : colors.muted,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  { color: canSave ? colors.primaryForeground : colors.textMuted },
                ]}
              >
                {saving ? 'Saving…' : 'Save Idea'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  typeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 9,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  inputGroup: {
    gap: 12,
  },
  titleInput: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  contentInput: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
    lineHeight: 22,
  },
  linkInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  linkField: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  notesField: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    lineHeight: 20,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  comingSoonIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  comingSoonText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  comingSoonSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
