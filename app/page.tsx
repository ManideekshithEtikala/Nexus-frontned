"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import ChatArea from "../components/chat-area";
import ChatInput from "../components/chat-input";

// 1. Aligned strictly with your backend structures
interface ChatSession {
  id: string; // Valid RFC4122 UUID String
  title: string;
  summary: string;
  createdAt: string;
}

interface Message {
  id: string; // Valid RFC4122 UUID String
  role: "user" | "assistant"; // Matches backend literal strings exactly
  content: string;
  timestamp: string;
}

// FIX 1: Generate a true, cryptographically secure RFC4122 v4 UUID string
// This prevents SQLAlchemy/PostgreSQL from throwing 500 Data Type validation errors.
function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Safe programmatic fallback matching strict xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx layout
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

const MOCK_ANSWERS: Record<string, string> = {
  glassmorphism: `Here is a premium **Glassmorphism CSS template**: \n\n\`\`\`css\n.glass-panel {\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(12px) saturate(180%);\n}\n\`\`\``,
  reacthook: `Here is a safe **useLocalStorage Hook template**:\n\n\`\`\`typescript\nexport function useLocalStorage<T>(key: string, initialValue: T) {\n  const [value, setValue] = useState<T>(initialValue);\n  return [value, setValue] as const;\n}\n\`\`\``,
  hydration: `**Hydration mismatch** is fixed in React by waiting until client mounting:\n\n\`\`\`tsx\nconst [mounted, setMounted] = useState(false);\nuseEffect(() => setMounted(true), []);\nif (!mounted) return null;\n\`\`\``,
  sql: `Here is a standard **FOR UPDATE exclusive lock trigger**:\n\n\`\`\`sql\nSELECT balance FROM bank_accounts WHERE id = 123 FOR UPDATE;\n\`\`\``,
};

export default function Home() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
  
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load initial theme and establish initial valid session
  useEffect(() => {
    const isDark =
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // Initialize with a clean, structurally sound UUID session
    const defaultId = generateUUID();
    const defaultSession: ChatSession = {
      id: defaultId,
      title: "Chat Session 1",
      summary: "",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatSessions([defaultSession]);
    setActiveChatId(defaultId);
    setSessionMessages({ [defaultId]: [] });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatSessions]);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  const handleNewChat = () => {
    const newSessionId = generateUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: "New Conversation",
      summary: "",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSessionId);
    setSessionMessages((prev) => ({ ...prev, [newSessionId]: [] }));
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
  };

  const handleDeleteChat = (id: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== id));
    setSessionMessages((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    if (activeChatId === id) {
      const remaining = chatSessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        setActiveChatId(null);
      }
    }
  };

  const handleClearChats = () => {
    setChatSessions([]);
    setActiveChatId(null);
    setSessionMessages({});
  };

  const activeMessages = activeChatId ? sessionMessages[activeChatId] || [] : [];

  // CORE STREAM & CONNECTION MANAGER
  const handleSendMessage = async (userContent: string) => {
    if (!userContent.trim()) return;

    let currentSessionId = activeChatId;
    let currentSessions = [...chatSessions];

    // Auto-build structural session state if none exists active
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      const newSession: ChatSession = {
        id: currentSessionId,
        title: userContent.length > 25 ? userContent.substring(0, 25) + "..." : userContent,
        summary: "",
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      currentSessions = [newSession, ...currentSessions];
      setChatSessions(currentSessions);
      setActiveChatId(currentSessionId);
      setSessionMessages((prev) => ({ ...prev, [currentSessionId!]: [] }));
    }

    const currentTimestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: userContent,
      timestamp: currentTimestamp,
    };

    // Update UI state with user message immediately
    setSessionMessages((prev) => ({
      ...prev,
      [currentSessionId!]: [...(prev[currentSessionId!] || []), userMessage],
    }));

    // Perform title update transitions if currently on defaults
    const sessionToUpdate = currentSessions.find((s) => s.id === currentSessionId);
    if (sessionToUpdate && (sessionToUpdate.title === "New Conversation" || sessionToUpdate.title === "Chat Session 1")) {
      sessionToUpdate.title = userContent.length > 25 ? userContent.substring(0, 25) + "..." : userContent;
      setChatSessions(currentSessions);
    }

    setIsThinking(true);

    try {
      // FIX 2: Explicitly matches your Pydantic "UserMessage" structure in main.py:
      // message: str
      // sessionId: str (maps directly to your camelCase JSON check)
      const response = await fetch("http://localhost:8000/api/agent", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: userContent,
          sessionId: currentSessionId, 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      const data = await response.json();
      
      // Pull response and update state securely
      const assistantReply = data.response || "No response received.";
      const assistantMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      setSessionMessages((prev) => ({
        ...prev,
        [currentSessionId!]: [...(prev[currentSessionId!] || []), assistantMessage],
      }));

    } catch (err) {
      console.warn("Backend unavailable or timed out. Dropping back to developer offline fallbacks.", err);
      
      // Safe development fallback calculation
      const lookupKey = userContent.toLowerCase().replace(/\s+/g, "");
      let fallbackText = "Connection to your agent backend failed. Check terminal processes.";
      
      if (lookupKey.includes("glass")) fallbackText = MOCK_ANSWERS.glassmorphism;
      else if (lookupKey.includes("hook")) fallbackText = MOCK_ANSWERS.reacthook;
      else if (lookupKey.includes("hydra")) fallbackText = MOCK_ANSWERS.hydration;
      else if (lookupKey.includes("sql")) fallbackText = MOCK_ANSWERS.sql;

      const fallbackMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      setSessionMessages((prev) => ({
        ...prev,
        [currentSessionId!]: [...(prev[currentSessionId!] || []), fallbackMessage],
      }));

    } finally {
      // Guarantee thinking indicator is shut down cleanly on complete cycles
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        chatSessions={chatSessions}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onClearChats={handleClearChats}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatArea
          messages={activeMessages}
          isThinking={isThinking}
          onSendPrompt={handleSendMessage}
          setSidebarOpen={setSidebarOpen}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isThinking}
        />
      </div>
    </div>
  );
}