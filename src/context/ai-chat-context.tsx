import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getLocalJsonItem, setLocalJsonItem } from '@/utils/local-json-store';

export interface AiChatResult {
  trustScore: number;
  fraudRisk: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface AiChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  result?: AiChatResult;
  streaming?: boolean;
  createdAt: string;
}

export interface AiChatConversation {
  id: string;
  title: string;
  messages: AiChatMessage[];
  updatedAt: string;
}

interface AiChatContextValue {
  conversations: AiChatConversation[];
  activeConversationId: string;
  activeConversation: AiChatConversation;
  createConversation: () => Promise<AiChatConversation>;
  setActiveConversation: (id: string) => void;
  appendMessage: (message: Omit<AiChatMessage, 'createdAt'>, conversationId?: string) => Promise<void>;
  updateMessage: (id: string, patch: Partial<AiChatMessage>, conversationId?: string) => Promise<void>;
  deleteMessage: (id: string, conversationId?: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearConversations: () => Promise<void>;
}

const STORE_KEY = 'deltex_ai_chat_history_v1';
const WELCOME_TEXT = 'Hi, I am Deltex AI. Share a link, website, message, profile, or family safety concern and I will explain the risk clearly.';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function welcomeMessage(): AiChatMessage {
  return {
    id: 'welcome',
    role: 'ai',
    text: WELCOME_TEXT,
    createdAt: nowIso(),
  };
}

function createDefaultConversation(): AiChatConversation {
  return {
    id: createId('chat'),
    title: 'New security chat',
    messages: [welcomeMessage()],
    updatedAt: nowIso(),
  };
}

function titleFromMessages(messages: AiChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.text.trim();
  if (!firstUserMessage) return 'New security chat';
  return firstUserMessage.length > 42 ? `${firstUserMessage.slice(0, 42)}...` : firstUserMessage;
}

async function getStoredHistory() {
  return getLocalJsonItem(STORE_KEY);
}

async function setStoredHistory(conversations: AiChatConversation[], activeConversationId: string) {
  await setLocalJsonItem(STORE_KEY, JSON.stringify({ conversations, activeConversationId }));
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

export function AiChatProvider({ children }: { children: ReactNode }) {
  const initialConversation = useMemo(() => createDefaultConversation(), []);
  const [conversations, setConversations] = useState<AiChatConversation[]>([initialConversation]);
  const [activeConversationId, setActiveConversationId] = useState(initialConversation.id);
  const conversationsRef = useRef(conversations);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await getStoredHistory();
        if (!stored) return;

        const parsed = JSON.parse(stored) as { conversations?: AiChatConversation[]; activeConversationId?: string };
        const nextConversations = Array.isArray(parsed.conversations) && parsed.conversations.length ? parsed.conversations : [createDefaultConversation()];
        const nextActiveId = nextConversations.some((conversation) => conversation.id === parsed.activeConversationId)
          ? parsed.activeConversationId || nextConversations[0].id
          : nextConversations[0].id;

        if (mounted) {
          conversationsRef.current = nextConversations;
          activeConversationIdRef.current = nextActiveId;
          setConversations(nextConversations);
          setActiveConversationId(nextActiveId);
        }
      } catch {
        const fallback = createDefaultConversation();
        if (mounted) {
          conversationsRef.current = [fallback];
          activeConversationIdRef.current = fallback.id;
          setConversations([fallback]);
          setActiveConversationId(fallback.id);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (nextConversations: AiChatConversation[], nextActiveId = activeConversationIdRef.current) => {
    conversationsRef.current = nextConversations;
    activeConversationIdRef.current = nextActiveId;
    setConversations(nextConversations);
    setActiveConversationId(nextActiveId);
    await setStoredHistory(nextConversations, nextActiveId);
  }, []);

  const createConversation = useCallback(async () => {
    const created = createDefaultConversation();
    await persist([created, ...conversationsRef.current], created.id);
    return created;
  }, [persist]);

  const appendMessage = useCallback(
    async (message: Omit<AiChatMessage, 'createdAt'>, conversationId = activeConversationIdRef.current) => {
      const createdMessage: AiChatMessage = { ...message, createdAt: nowIso() };
      const nextConversations = conversationsRef.current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const messages = [...conversation.messages, createdMessage];

        return {
          ...conversation,
          messages,
          title: titleFromMessages(messages),
          updatedAt: createdMessage.createdAt,
        };
      });

      await persist(nextConversations, conversationId);
    },
    [persist],
  );

  const updateMessage = useCallback(
    async (id: string, patch: Partial<AiChatMessage>, conversationId = activeConversationIdRef.current) => {
      const updatedAt = nowIso();
      const nextConversations = conversationsRef.current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const messages = conversation.messages.map((message) => (message.id === id ? { ...message, ...patch } : message));

        return {
          ...conversation,
          messages,
          title: titleFromMessages(messages),
          updatedAt,
        };
      });

      await persist(nextConversations, conversationId);
    },
    [persist],
  );

  const deleteMessage = useCallback(
    async (id: string, conversationId = activeConversationIdRef.current) => {
      const nextConversations = conversationsRef.current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const messages = conversation.messages.filter((message) => message.id !== id || message.id === 'welcome');

        return {
          ...conversation,
          messages: messages.length ? messages : [welcomeMessage()],
          title: titleFromMessages(messages),
          updatedAt: nowIso(),
        };
      });

      await persist(nextConversations, conversationId);
    },
    [persist],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      const nextConversations = conversationsRef.current.filter((conversation) => conversation.id !== id);
      const fallback = nextConversations.length ? nextConversations : [createDefaultConversation()];
      const nextActiveId = activeConversationIdRef.current === id ? fallback[0].id : activeConversationIdRef.current;

      await persist(fallback, nextActiveId);
    },
    [persist],
  );

  const clearConversations = useCallback(async () => {
    const fallback = createDefaultConversation();
    await persist([fallback], fallback.id);
  }, [persist]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0] || initialConversation;

  const value = useMemo<AiChatContextValue>(
    () => ({
      conversations,
      activeConversationId,
      activeConversation,
      createConversation,
      setActiveConversation: setActiveConversationId,
      appendMessage,
      updateMessage,
      deleteMessage,
      deleteConversation,
      clearConversations,
    }),
    [activeConversation, activeConversationId, appendMessage, clearConversations, conversations, createConversation, deleteConversation, deleteMessage, updateMessage],
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChat() {
  const context = useContext(AiChatContext);

  if (!context) {
    throw new Error('useAiChat must be used within AiChatProvider');
  }

  return context;
}
