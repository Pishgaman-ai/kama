"use client";

import ChatContainer from "./ChatContainer";
import { AIChatComponentProps } from "./types";

// This is the main export component that will be used in pages
export default function AIChatComponent(props: AIChatComponentProps) {
  return <ChatContainer {...props} />;
}
