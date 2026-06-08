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
  useEffect(() => {
    const savedSessions = localStorage.getItem("nexus_chatSessions");
    const savedActiveId = localStorage.getItem("nexus_activeChatId");
    const savedMessages = localStorage.getItem("nexus_sessionMessages");

    // If we have saved data in the browser, hydrate the React state
    if (savedSessions && savedActiveId && savedMessages) {
      setChatSessions(JSON.parse(savedSessions));
      setActiveChatId(savedActiveId);
      setSessionMessages(JSON.parse(savedMessages));
    } else {
      // If no saved data exists (first time visitor), create the default session
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
  }, []); 

  // 2. SAVE TO LOCAL STORAGE (Runs automatically whenever your chat data changes)
  useEffect(() => {
    // Only save if we actually have data (prevents overwriting with empty states on boot)
    if (chatSessions.length > 0) {
      localStorage.setItem("nexus_chatSessions", JSON.stringify(chatSessions));
      localStorage.setItem("nexus_activeChatId", activeChatId || "");
      localStorage.setItem("nexus_sessionMessages", JSON.stringify(sessionMessages));
    }
  }, [chatSessions, activeChatId, sessionMessages]);

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
  // Backend URL configuration for production and development
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/agent";
  const BACKEND_URL = `${BASE_URL}/api/agent`;
  const BACKEND_RESUME_URL = `${BASE_URL}/api/agent/resume`;

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
      const response = await fetch(`${BACKEND_URL}/api/agent`, {
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
  // =====================================================================
  // 🛑 PHASE 5: THE HIBERNATION RESUME HANDLER
  // =====================================================================
  const handleResumeAction = async (pendingAction: any, isApproved: boolean) => {
    if (!activeChatId || isThinking) return;
    setIsThinking(true);

    // 1. Instantly add a user message to the UI showing what they clicked
    const userFeedbackMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: isApproved ? "✅ Action Approved by User." : "❌ Action Rejected by User.",
      timestamp: getFormattedTime(),
    };

    setSessionMessages((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), userFeedbackMessage],
    }));

    try {
      // 2. Send the human's decision to the new backend route
      const response = await fetch(BACKEND_RESUME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeChatId,
          tool_name: pendingAction.tool_name,
          tool_args: pendingAction.tool_args,
          tool_call_id: pendingAction.tool_call_id,
          is_approved: isApproved,
        }),
      });

      if (!response.ok) throw new Error("Resume endpoint failed.");
      
      const result = await response.json();

      // 3. Parse the resumed ReAct loop output and append it
      let finalizedContent = "";
      if (result.data && result.data.ui_pipeline) {
        finalizedContent = JSON.stringify(result.data.ui_pipeline);
      } else {
        finalizedContent = JSON.stringify(result);
      }

      const assistantMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: finalizedContent,
        timestamp: getFormattedTime(),
      };

      setSessionMessages((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), assistantMessage],
      }));

    } catch (error) {
      console.error("Failed to resume:", error);
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
          onResumeAction={handleResumeAction}
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