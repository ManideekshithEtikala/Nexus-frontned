"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import ChatArea from "../components/chat-area";
import ChatInput from "../components/chat-input";

interface ChatSession {
  id: string; // RFC4122 UUID String
  title: string;
  summary: string;
  createdAt: string;
}

interface Message {
  id: string; // RFC4122 UUID String
  role: "user" | "assistant";
  content: string; // Holds raw markdown or the structured pipeline JSON string
  timestamp: string;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getFormattedDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFormattedTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Home() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize with a blank default session if empty
  useEffect(() => {
    if (chatSessions.length === 0) {
      const initialId = generateUUID();
      const newSession: ChatSession = {
        id: initialId,
        title: "New Agent Session",
        summary: "A fresh workflow execution matrix instance",
        createdAt: getFormattedDate(),
      };
      setChatSessions([newSession]);
      setActiveChatId(initialId);
      setSessionMessages({ [initialId]: [] });
    }
  }, [chatSessions]);

  // Sync Dark/Light visual application class lists
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    const newId = generateUUID();
    const newSession: ChatSession = {
      id: newId,
      title: "New Agent Session",
      summary: "A fresh workflow execution matrix instance",
      createdAt: getFormattedDate(),
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newId);
    setSessionMessages((prev) => ({ ...prev, [newId]: [] }));
  };

  const handleDeleteChat = (id: string) => {
    const remaining = chatSessions.filter((s) => s.id !== id);
    setChatSessions(remaining);
    
    const updatedMessages = { ...sessionMessages };
    delete updatedMessages[id];
    setSessionMessages(updatedMessages);

    if (activeChatId === id) {
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearChats = () => {
    setChatSessions([]);
    setActiveChatId(null);
    setSessionMessages({});
  };

  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || isThinking) return;

    let currentSessionId = activeChatId;
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      const newSession: ChatSession = {
        id: currentSessionId,
        title: prompt.length > 24 ? prompt.substring(0, 24) + "..." : prompt,
        summary: "Processing active context flow...",
        createdAt: getFormattedDate(),
      };
      setChatSessions([newSession]);
      setActiveChatId(currentSessionId);
      setSessionMessages({ [currentSessionId]: [] });
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: prompt,
      timestamp: getFormattedTime(),
    };

    // Append User message directly to local component track state
    setSessionMessages((prev) => ({
      ...prev,
      [currentSessionId!]: [...(prev[currentSessionId!] || []), userMessage],
    }));

    // Dynamic Title Auto-Update for placeholder names
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId && s.title === "New Agent Session"
          ? { ...s, title: prompt.length > 22 ? prompt.substring(0, 22) + "..." : prompt }
          : s
      )
    );

    setIsThinking(true);

    try {
      // Connects directly to your Python FastAPI / Flask Agent Orchestrator Route
      const response = await fetch("http://localhost:8000/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Orchestration engine returned code fault status: ${response.status}`);
      }

      const result = await response.json();
      
      // Extract string contents safely regardless of structure
      let finalizedContent = "";
      if (result.data && result.data.ui_pipeline) {
        // Enforce parsing object payload cleanly back to string for standard engine storage array map
        finalizedContent = JSON.stringify(result.data.ui_pipeline);
      } else if (typeof result.data === "string") {
        finalizedContent = result.data;
      } else {
        finalizedContent = JSON.stringify(result);
      }

      // Update Session running summary properties on-the-fly from backend state
      if (result.current_summary) {
        setChatSessions((prev) =>
          prev.map((s) => (s.id === currentSessionId ? { ...s, summary: result.current_summary } : s))
        );
      }

      const assistantMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: finalizedContent,
        timestamp: getFormattedTime(),
      };

      setSessionMessages((prev) => ({
        ...prev,
        [currentSessionId!]: [...(prev[currentSessionId!] || []), assistantMessage],
      }));

    } catch (error) {
      console.error("Backend pipeline runtime communication failure:", error);
      
      const errorMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: `Error: Unable to coordinate with pipeline agent engine. Make sure the backend endpoint server is running correctly.`,
        timestamp: getFormattedTime(),
      };

      setSessionMessages((prev) => ({
        ...prev,
        [currentSessionId!]: [...(prev[currentSessionId!] || []), errorMessage],
      }));
    } finally {
      setIsThinking(false);
    }
  };

  const activeMessages = activeChatId ? sessionMessages[activeChatId] || [] : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      <Sidebar
        chatSessions={chatSessions}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onClearChats={handleClearChats}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setIsSidebarOpen}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatArea
          messages={activeMessages}
          isThinking={isThinking}
          onSendPrompt={handleSendMessage}
          setSidebarOpen={setIsSidebarOpen}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isThinking}
          placeholder={isThinking ? "Agent is processing workflow logs..." : "Ask the agent anything..."}
        />
      </div>
    </div>
  );
}