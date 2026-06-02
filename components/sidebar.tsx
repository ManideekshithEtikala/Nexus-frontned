"use client";

import React from "react";

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
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 border-r transition-transform duration-300 lg:relative lg:translate-x-0 bg-white dark:bg-[#121214] border-zinc-200 dark:border-zinc-800 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header Panel */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Nexus-Agent System
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
            title="Toggle theme view mode"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M6.343 6.343l.707-.707m2.828 9.9a4 4 0 115.656 0 4 4 0 01-5.656 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Create Session Control Action */}
        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Initialize New Session</span>
          </button>
        </div>

        {/* History Tracker View List Grid */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chatSessions.map((session) => {
            const isActive = session.id === activeChatId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectChat(session.id)}
                className={`group flex flex-col p-3 rounded-xl cursor-pointer transition select-none ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate max-w-[180px]">
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500 transition"
                    title="Terminate matrix session"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v4M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {/* Dynamically monitors your real-time running rolling window text summary model logs */}
                {session.summary && (
                  <p className="text-[10px] mt-1 text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                    {session.summary}
                  </p>
                )}
                
                <span className="text-[9px] font-mono mt-1 opacity-60 text-right w-full block">
                  {session.createdAt}
                </span>
              </div>
            );
          })}
        </div>

        {/* System Reset Actions */}
        {chatSessions.length > 0 && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onClearChats}
              className="w-full text-center py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-red-500 transition rounded-lg"
            >
              Flush All Matrix Registers
            </button>
          </div>
        )}
      </aside>
    </>
  );
}