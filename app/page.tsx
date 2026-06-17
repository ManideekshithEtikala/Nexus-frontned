"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../components/sidebar";
import ChatArea from "../components/chat-area";
import ChatInput from "../components/chat-input";
import { apiFetch } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface ChatSession {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface PendingAction {
  tool_name: string;
  tool_args: Record<string, unknown>;
  tool_call_id: string;
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
  const { user, signOut } = useAuth();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. HYDRATION — keyed per user so each user gets their own localStorage
  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadData = async () => {
      await Promise.resolve();
      if (!active) return;

      // Use user.id as key so sessions don't bleed between users
      const storageKey = `nexus_${user.id}`;
      const savedSessions = localStorage.getItem(`${storageKey}_chatSessions`);
      const savedActiveId = localStorage.getItem(`${storageKey}_activeChatId`);
      const savedMessages = localStorage.getItem(`${storageKey}_sessionMessages`);

      if (savedSessions && savedActiveId && savedMessages) {
        setChatSessions(JSON.parse(savedSessions));
        setActiveChatId(savedActiveId);
        setSessionMessages(JSON.parse(savedMessages));
      } else {
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
      setIsHydrated(true);
    };

    loadData();
    return () => { active = false; };
  }, [user]);

  // 2. SAVE TO LOCAL STORAGE — also keyed per user
  useEffect(() => {
    if (!isHydrated || !user || chatSessions.length === 0) return;
    const storageKey = `nexus_${user.id}`;
    localStorage.setItem(`${storageKey}_chatSessions`, JSON.stringify(chatSessions));
    localStorage.setItem(`${storageKey}_activeChatId`, activeChatId || "");
    localStorage.setItem(`${storageKey}_sessionMessages`, JSON.stringify(sessionMessages));
  }, [chatSessions, activeChatId, sessionMessages, isHydrated, user]);

  // Dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    isDarkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
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
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChatSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeChatId === id) {
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    setSessionMessages((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, [activeChatId]);

  const handleClearChats = useCallback(() => {
    setChatSessions([]);
    setActiveChatId(null);
    setSessionMessages({});
  }, []);

  // ✅ MAIN CHANGE: replaced raw fetch() with apiFetch() which auto-attaches the token
  const handleSendMessage = useCallback(async (prompt: string) => {
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

    setSessionMessages((prev) => ({
      ...prev,
      [currentSessionId!]: [...(prev[currentSessionId!] || []), userMessage],
    }));

    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId && s.title === "New Agent Session"
          ? { ...s, title: prompt.length > 22 ? prompt.substring(0, 22) + "..." : prompt }
          : s
      )
    );

    setIsThinking(true);

    try {
      // apiFetch automatically attaches Authorization: Bearer <token>
      const result = await apiFetch("/api/agent", {
        method: "POST",
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: prompt,
        }),
      });

      let finalizedContent = "";
      if (result.data && result.data.ui_pipeline) {
        finalizedContent = JSON.stringify(result.data.ui_pipeline);
      } else if (typeof result.data === "string") {
        finalizedContent = result.data;
      } else {
        finalizedContent = JSON.stringify(result);
      }

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
  }, [activeChatId, isThinking]);

  // ✅ MAIN CHANGE: replaced raw fetch() with apiFetch() which auto-attaches the token
  const handleResumeAction = useCallback(async (pendingAction: PendingAction, isApproved: boolean) => {
    if (!activeChatId || isThinking) return;
    setIsThinking(true);

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
      const result = await apiFetch("/api/agent/resume", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeChatId,
          tool_name: pendingAction.tool_name,
          tool_args: pendingAction.tool_args,
          tool_call_id: pendingAction.tool_call_id,
          is_approved: isApproved,
        }),
      });

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
  }, [activeChatId, isThinking]);

  const activeMessages = activeChatId ? sessionMessages[activeChatId] || [] : [];
  const activeSession = chatSessions.find((s) => s.id === activeChatId);
  const activeSessionTitle = activeSession ? activeSession.title : "Workspace Matrix Core";

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
        onSignOut={signOut}        // pass signOut so sidebar can show a sign-out button
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatArea
          messages={activeMessages}
          isThinking={isThinking}
          activeSessionTitle={activeSessionTitle}
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