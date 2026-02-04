export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessage?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: string;
  school_id: string;
  profile_picture_url?: string;
  created_at?: Date;
  national_code?: string; // Added for AI service integration
}

export interface AIChatComponentProps {
  user: User;
  onBack?: () => void;
}

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface RoleConfig {
  title: string;
  description: string;
  color: string;
  greeting: string;
  sampleQuestions: string[];
}
