import { useState, useEffect } from "react";
import { Chat } from "../types";

export const useChatStorage = (storageKey: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chats from localStorage
  useEffect(() => {
    const loadChats = () => {
      try {
        const savedChats = localStorage.getItem(storageKey);
        if (savedChats) {
          const parsed = JSON.parse(savedChats);

          // Convert dates back to Date objects
          const restored = parsed.map((chat: Chat) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map((m) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }));

          setChats(restored);
        }
      } catch (error) {
        console.error("Error loading chats from localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [storageKey]);

  // Save chats to localStorage
  const saveChats = (chatsToSave: Chat[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(chatsToSave));
      setChats(chatsToSave);
    } catch (error) {
      console.error("Error saving chats to localStorage:", error);
    }
  };

  const deleteChat = (chatId: string) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    saveChats(updatedChats);
    return updatedChats;
  };

  const addChat = (chat: Chat) => {
    const updatedChats = [chat, ...chats];
    saveChats(updatedChats);
    return updatedChats;
  };

  const updateChat = (updatedChat: Chat) => {
    const updatedChats = chats.map((chat) =>
      chat.id === updatedChat.id ? updatedChat : chat
    );
    saveChats(updatedChats);
    return updatedChats;
  };

  return {
    chats,
    loading,
    saveChats,
    deleteChat,
    addChat,
    updateChat,
  };
};
