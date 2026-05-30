"use client";

import React from "react";

// MATCHES THE NEW RUNNING DATABASE SUMMARY PROPERTY MAPPED FROM MODEL.PY
interface ChatSession {
  id: string;
  title: string;
  summary?: string | null; 
  createdAt: string;
}

interface SidebarProps {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearChats: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function Sidebar({
  chatSessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearChats,
  isSidebarOpen,
  setSidebarOpen,
  isDarkMode,
  toggleTheme,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 glass-sidebar border-r border-card-border transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-card-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-indigo to-accent-emerald text-white font-bold shadow-md shadow-accent-indigo/25">
              N
            </div>
            <div>
              <span className="font-semibold tracking-wide text-foreground">Nexus</span>
              <span className="text-xs font-semibold text-accent-indigo ml-1 px-1.5 py-0.5 rounded-full bg-accent-glow">
                v1.0
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-card-border text-foreground/70 hover:text-foreground lg:hidden"
            aria-label="Close Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="px-4 py-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-accent-indigo hover:bg-accent-indigo/90 text-white font-medium shadow-md shadow-accent-indigo/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Conversation</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 font-mono text-[10px] font-bold text-white/80 bg-white/20 rounded border border-white/10">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 px-3 overflow-y-auto space-y-1.5">
          <div className="px-3 text-xs font-bold uppercase tracking-wider text-foreground/40 mt-2 mb-1">
            History
          </div>

          {chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-foreground/45 border border-dashed border-card-border/60 rounded-xl bg-card-bg/20">
              <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">No conversations yet</span>
            </div>
          ) : (
            chatSessions.map((session) => {
              const isActive = session.id === activeChatId;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between w-full rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-accent-glow text-accent-indigo border border-accent-indigo/10"
                      : "hover:bg-card-border/50 text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectChat(session.id);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className="flex-1 flex flex-col items-start px-4 py-3 text-left overflow-hidden"
                  >
                    <span className="w-full text-sm font-medium truncate">
                      {session.title || "Untitled Chat"}
                    </span>
                    <span className="text-[10px] text-foreground/45 mt-0.5 font-mono">
                      {session.createdAt}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(session.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg hover:bg-card-border text-foreground/50 hover:text-red-500 transition-all duration-200"
                    title="Delete chat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-card-border bg-card-bg/10 space-y-3">
          <div className="flex items-center justify-between">
            {chatSessions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all conversations?")) {
                    onClearChats();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500/80 hover:text-red-500 hover:underline px-2 py-1.5 rounded-lg hover:bg-red-500/5 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear History
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-card-border text-foreground/75 hover:text-foreground transition-all ml-auto"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-950 dark:text-zinc-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card-bg border border-card-border/60">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-accent-indigo to-accent-emerald text-white text-sm font-semibold shadow-inner">
              ME
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground leading-none truncate">
                Manideekshith E.
              </div>
              <div className="text-[10px] text-foreground/50 leading-tight truncate mt-1">
                Active Session
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}