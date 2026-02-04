"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sparkles, X, Plus, MessageCircle, Trash2, Menu } from "lucide-react";
import { Chat, User as UserType, UserRole } from "./types";

function getDateCategory(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date >= today) return "امروز";
  if (date >= yesterday) return "دیروز";
  return "قبلی‌ها";
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  user: UserType;
  onCreateNewChat: () => string;
  onSwitchToChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  roleConfig: {
    title: string;
    color: string;
  };
  onBack?: () => void;
  sidebarOpen: boolean;
  sidebarWidth: number;
  setSidebarOpen: (open: boolean) => void;
  onSidebarWidthChange: (width: number) => void;
}

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "bg-blue-100 text-blue-800";
    case "teacher":
      return "bg-purple-100 text-purple-800";
    case "student":
      return "bg-green-100 text-green-800";
    case "parent":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ChatSidebar({
  chats,
  currentChatId,
  user,
  onCreateNewChat,
  onSwitchToChat,
  onDeleteChat,
  roleConfig,
  onBack,
  sidebarOpen,
  sidebarWidth,
  setSidebarOpen,
  onSidebarWidthChange,
}: ChatSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const canCreateChat =
    currentChat?.messages && currentChat.messages.length > 0;

  const filteredChats = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return chats.filter((chat) => {
      const inTitle = chat.title.toLowerCase().includes(term);
      const inMessages = chat.messages.some((msg) =>
        msg.content.toLowerCase().includes(term)
      );
      return inTitle || inMessages;
    });
  }, [searchTerm, chats]);

  const groupedChats = useMemo(() => {
    return filteredChats.reduce<Record<string, Chat[]>>((groups, chat) => {
      const createdDate =
        chat.createdAt instanceof Date
          ? chat.createdAt
          : new Date(chat.createdAt);
      const category = getDateCategory(createdDate);
      if (!groups[category]) groups[category] = [];
      groups[category].push({ ...chat, createdAt: createdDate });
      return groups;
    }, {});
  }, [filteredChats]);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 500) {
        onSidebarWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onSidebarWidthChange]);

  const categoryOrder = ["امروز", "دیروز", "قبلی‌ها"];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        style={{ width: sidebarWidth }}
        className={`${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        } fixed lg:relative inset-y-0 right-0 z-50 bg-white border-l border-slate-200 transition-all duration-300 ease-in-out shadow-lg lg:shadow-none flex-shrink-0 overflow-hidden`}
      >
        {/* Resize handle */}
        <div
          className="hidden lg:block absolute left-0 top-0 w-1 h-full bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-colors duration-200"
          onMouseDown={startResizing}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-slate-800 font-semibold">دستیار هوشمند</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
            title="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4">
          <button
            onClick={onCreateNewChat}
            disabled={!canCreateChat}
            className={`w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 text-white rounded-lg transition-all duration-200 mb-4 shadow-md ${
              canCreateChat
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg"
                : "bg-slate-400 cursor-not-allowed opacity-60"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>گفتگوی جدید</span>
          </button>

          <input
            type="text"
            placeholder="جستجو در گفتگوها..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full mb-4 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categoryOrder.map((category) =>
              groupedChats[category]?.length ? (
                <div key={category}>
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {groupedChats[category].map((chat) => (
                      <ChatListItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === currentChatId}
                        onDelete={onDeleteChat}
                        onSwitch={onSwitchToChat}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>

      </div>

      {/* Resizing overlay */}
      {isResizing && <div className="fixed inset-0 z-50 cursor-col-resize" />}
    </>
  );
}

function ChatListItem({
  chat,
  isActive,
  onDelete,
  onSwitch,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (id: string) => void;
  onSwitch: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSwitch(chat.id)}
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-slate-100 text-slate-900 border border-slate-200"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center space-x-2 space-x-reverse">
        <MessageCircle className="w-4 h-4 flex-shrink-0 text-slate-400" />
        <span className="flex-1 text-sm truncate">{chat.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chat.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-opacity"
          title="حذف گفتگو"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {chat.createdAt.toLocaleDateString("fa-IR")}
      </p>
    </div>
  );
}
