import { useState, useEffect, useCallback, useRef } from "react";
import { Chat, Message, User } from "../types";

export const useChat = (user: User) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const storageKey = `ai_chats_${user.role}_${user.id}`;

  // Load chats from localStorage
  useEffect(() => {
    if (user && !initialized) {
      const savedChats = localStorage.getItem(storageKey);
      if (savedChats) {
        try {
          const parsed = JSON.parse(savedChats);

          // Convert dates back to Date objects
          const restored = parsed.map((chat: Chat) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map((m: Message) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }));

          setChats(restored);
          if (restored.length > 0 && !currentChatId) {
            setCurrentChatId(restored[0].id);
          }
        } catch (error) {
          console.error("Error parsing saved chats:", error);
        }
      } else if (!currentChatId) {
        // Create first chat if none exist
        const newChatId = createNewChat();
        setCurrentChatId(newChatId);
      }
      setInitialized(true);
    }
  }, [user, currentChatId, storageKey, initialized]);

  // Save chats to localStorage
  useEffect(() => {
    if (user && initialized && chats.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chats));
      } catch (error) {
        console.error("Error saving chats to localStorage:", error);
      }
    }
  }, [chats, user, storageKey, initialized]);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const createNewChat = useCallback((): string => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "گفتگوی جدید",
      messages: [],
      createdAt: new Date(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  const switchToChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      const updatedChats = chats.filter((chat) => chat.id !== chatId);
      setChats(updatedChats);

      if (currentChatId === chatId) {
        if (updatedChats.length > 0) {
          setCurrentChatId(updatedChats[0].id);
        } else {
          const newChatId = createNewChat();
          setCurrentChatId(newChatId);
        }
      }
    },
    [chats, currentChatId, createNewChat]
  );

  const updateChatTitle = useCallback(
    (chatId: string, firstMessage: string) => {
      const title =
        firstMessage.length > 30
          ? firstMessage.substring(0, 30) + "..."
          : firstMessage;

      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat))
      );
    },
    []
  );

  const updateLastMessage = useCallback(
    (chatId: string, lastMessage: string) => {
      const truncatedMessage =
        lastMessage.length > 50
          ? lastMessage.substring(0, 50) + "..."
          : lastMessage;

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, lastMessage: truncatedMessage } : chat
        )
      );
    },
    []
  );

  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              lastMessage: message.content,
            }
          : chat
      )
    );
  }, []);

  const updateMessageContent = useCallback(
    (chatId: string, messageId: string, content: string) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, content } : msg
                ),
                lastMessage: content.length > 50 ? content.substring(0, 50) + "..." : content,
              }
            : chat
        )
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading || !user) return;

      let chatId = currentChatId;

      // Create new chat if needed
      if (!chatId) {
        chatId = createNewChat();
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        timestamp: new Date(),
      };

      // Add user message to chat
      addMessage(chatId, userMessage);

      // Update title if this is the first message
      const currentChat = chats.find((chat) => chat.id === chatId);
      if (currentChat && currentChat.messages.length === 0) {
        updateChatTitle(chatId, input);
      }

      setIsLoading(true);
      setIsGenerating(true);

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Send request with streaming
        const response = await fetch("/api/ai-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...(currentChat?.messages || []), userMessage].map(
              (msg) => ({
                role: msg.role,
                content: msg.content,
              })
            ),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(response.statusText || "خطا در دریافت پاسخ");
        }

        // Create assistant message placeholder after successful connection
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        addMessage(chatId, assistantMessage);

        // Turn off loading indicator once stream starts
        setIsLoading(false);

        // Read the stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;

            // Update the assistant message content incrementally
            updateMessageContent(chatId!, assistantMessageId, accumulatedContent);
          }
        }

        if (!accumulatedContent) {
          throw new Error("پاسخی دریافت نشد");
        }

        updateLastMessage(chatId!, accumulatedContent);
      } catch (error: any) {
        console.error("Error sending message:", error);

        // Don't show error if request was aborted
        if (error.name === "AbortError") {
          return;
        }

        let errorMessage =
          "در دریافت پاسخ از سرور مشکلی پیش آمده. لطفاً بعداً تلاش کنید.";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Create error message
        const errorMessageId = (Date.now() + 1).toString();
        const errorMsg: Message = {
          id: errorMessageId,
          role: "assistant",
          content: `❌ خطا: ${errorMessage}`,
          timestamp: new Date(),
        };

        addMessage(chatId!, errorMsg);
        updateLastMessage(chatId!, errorMessage);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [
      currentChatId,
      chats,
      user,
      isLoading,
      createNewChat,
      addMessage,
      updateChatTitle,
      updateLastMessage,
      updateMessageContent,
    ]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsLoading(false);
  }, []);

  return {
    chats,
    currentChat,
    messages,
    currentChatId,
    isLoading,
    isGenerating,
    createNewChat,
    switchToChat,
    deleteChat,
    sendMessage,
    stopGeneration,
  };
};
