import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type IdeaType = 'text' | 'link' | 'voice' | 'photo';
export type IdeaStatus = 'ideas' | 'working' | 'published';

export interface Idea {
  id: string;
  title: string;
  content: string;
  type: IdeaType;
  tags: string[];
  status: IdeaStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY_IDEAS = '@nook_ideas';
const STORAGE_KEY_CONVOS = '@nook_conversations';

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface IdeasContextValue {
  ideas: Idea[];
  loading: boolean;
  addIdea: (partial: { title: string; content: string; type: IdeaType; tags?: string[] }) => Promise<Idea>;
  updateIdea: (id: string, patch: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  moveIdea: (id: string, status: IdeaStatus) => Promise<void>;
  getConversation: (ideaId: string) => Message[];
  addMessage: (ideaId: string, msg: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  clearConversation: (ideaId: string) => Promise<void>;
}

const IdeasContext = createContext<IdeasContextValue | null>(null);

export function IdeasProvider({ children }: { children: React.ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rawIdeas, rawConvos] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_IDEAS),
          AsyncStorage.getItem(STORAGE_KEY_CONVOS),
        ]);
        if (rawIdeas) setIdeas(JSON.parse(rawIdeas));
        if (rawConvos) setConversations(JSON.parse(rawConvos));
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const saveIdeas = useCallback(async (next: Idea[]) => {
    setIdeas(next);
    await AsyncStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(next));
  }, []);

  const saveConvos = useCallback(async (next: Record<string, Message[]>) => {
    setConversations(next);
    await AsyncStorage.setItem(STORAGE_KEY_CONVOS, JSON.stringify(next));
  }, []);

  const addIdea = useCallback(
    async (partial: { title: string; content: string; type: IdeaType; tags?: string[] }) => {
      const idea: Idea = {
        id: genId(),
        title: partial.title,
        content: partial.content,
        type: partial.type,
        tags: partial.tags ?? [],
        status: 'ideas',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveIdeas([idea, ...ideas]);
      return idea;
    },
    [ideas, saveIdeas],
  );

  const updateIdea = useCallback(
    async (id: string, patch: Partial<Idea>) => {
      await saveIdeas(ideas.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)));
    },
    [ideas, saveIdeas],
  );

  const deleteIdea = useCallback(
    async (id: string) => {
      await saveIdeas(ideas.filter((i) => i.id !== id));
      const next = { ...conversations };
      delete next[id];
      await saveConvos(next);
    },
    [ideas, conversations, saveIdeas, saveConvos],
  );

  const moveIdea = useCallback(
    async (id: string, status: IdeaStatus) => {
      await saveIdeas(ideas.map((i) => (i.id === id ? { ...i, status, updatedAt: Date.now() } : i)));
    },
    [ideas, saveIdeas],
  );

  const getConversation = useCallback((ideaId: string) => conversations[ideaId] ?? [], [conversations]);

  const addMessage = useCallback(
    async (ideaId: string, msg: Omit<Message, 'id' | 'timestamp'>) => {
      const message: Message = { id: genId(), timestamp: Date.now(), ...msg };
      const existing = conversations[ideaId] ?? [];
      const next = { ...conversations, [ideaId]: [...existing, message] };
      await saveConvos(next);
      return message;
    },
    [conversations, saveConvos],
  );

  const clearConversation = useCallback(
    async (ideaId: string) => {
      const next = { ...conversations };
      delete next[ideaId];
      await saveConvos(next);
    },
    [conversations, saveConvos],
  );

  return (
    <IdeasContext.Provider
      value={{ ideas, loading, addIdea, updateIdea, deleteIdea, moveIdea, getConversation, addMessage, clearConversation }}
    >
      {children}
    </IdeasContext.Provider>
  );
}

export function useIdeas() {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error('useIdeas must be inside IdeasProvider');
  return ctx;
}
