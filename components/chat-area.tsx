"use client";

import React, { useEffect, useRef, useState } from "react";

// ALIGNED WITH BACKEND SCHEMAS (role includes tool execution telemetry)
interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: string;
}

interface ChatAreaProps {
  messages: Message[];
  isThinking: boolean;
  onSendPrompt: (prompt: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

const MODELS = [
  { id: "nexus-v1", name: "Nexus-AI v1.0", desc: "Our core dynamic intelligence model" },
  { id: "swarm-orchestration", name: "Swarm Orchestrator", desc: "Collaborative multi-agent swarm agent" },
  { id: "wasm-sandboxed", name: "WASM Sandbox", desc: "Isolated environment agent for code execution" },
];

const SUGGESTIONS = [
  {
    title: "Design glassmorphism CSS",
    desc: "Create a modern premium CSS card style with blur and saturation.",
    prompt: "Design a premium CSS glassmorphism card style with vibrant backdrop blurs, HSL shadows, and smooth hover scales.",
    color: "from-blue-500/20 to-indigo-500/20 text-indigo-500",
  },
  {
    title: "React LocalStorage hook",
    desc: "Write a complete TypeScript custom hook with hydrations handles.",
    prompt: "Write a high-quality React custom hook called useLocalStorage in TypeScript that handles server-side rendering (SSR) hydration, JSON parsing safely, and triggers updates across tabs.",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-500",
  },
  {
    title: "Hydration errors guide",
    desc: "Explain Next.js mismatch errors and provide simple visual fixes.",
    prompt: "Explain why Next.js hydration errors happen, specifically showing the 'server vs client text rendering mismatch', and provide the three best ways to fix it (including useEffect and dynamic imports).",
    color: "from-amber-500/20 to-orange-500/20 text-amber-500",
  },
  {
    title: "Optimize SQL transaction",
    desc: "Refactor a high-volume database concurrency lock loop.",
    prompt: "Optimize this SQL transaction pattern to prevent concurrent deadlock locks in high-volume banking deposit triggers.",
    color: "from-rose-500/20 to-pink-500/20 text-rose-500",
  },
];

export default function ChatArea({
  messages,
  isThinking,
  onSendPrompt,
  setSidebarOpen,
}: ChatAreaProps) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isModelDropdownOpen, setModelDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter out internal background tool telemetry messages from the direct chat bubbles
  const visibleMessages = messages.filter((msg) => msg.role === "user" || msg.role === "assistant");

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-card-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-card-border hover:bg-card-border text-foreground lg:hidden"
            aria-label="Open Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-card-border hover:bg-card-border/50 text-foreground transition-all duration-200"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald animate-pulse" />
              <span className="text-sm font-semibold">{selectedModel.name}</span>
              <svg className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${isModelDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isModelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl glass-effect border border-card-border/80 shadow-2xl p-2 z-50 animate-fade-in-up">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                      setModelDropdownOpen(false);
                    }}
                    className={`flex flex-col items-start w-full p-3 rounded-xl transition-all duration-200 text-left ${
                      model.id === selectedModel.id
                        ? "bg-accent-glow text-accent-indigo"
                        : "hover:bg-card-border/40 text-foreground"
                    }`}
                  >
                    <span className="text-sm font-bold">{model.name}</span>
                    <span className="text-xs text-foreground/60 mt-0.5 leading-relaxed">{model.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-foreground/55">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-indigo" />
            <span>Agent Engine Active</span>
          </div>
          <div className="w-[1px] h-4 bg-card-border hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-card-border font-mono text-[10px]">Client Mode</span>
          </div>
        </div>
      </header>

      {/* Main chat window content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {visibleMessages.length === 0 ? (
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-8 animate-fade-in-up">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-tr from-accent-indigo via-purple-500 to-accent-emerald rounded-full" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-indigo to-accent-emerald text-white text-3xl font-extrabold shadow-xl shadow-accent-indigo/25">
                N
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                What can I <span className="text-gradient-premium">build</span> for you?
              </h1>
              <p className="text-base md:text-lg text-foreground/60 max-w-xl mx-auto">
                Welcome to Nexus Intelligence. Select a card below or type a query to get an instant sandbox design response.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendPrompt(sug.prompt)}
                  className="flex flex-col p-5 rounded-2xl border border-card-border bg-card-bg/30 hover:bg-card-bg hover:border-accent-indigo/20 shadow-sm hover:shadow-md transition-all duration-300 text-left hover:-translate-y-1 relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr ${sug.color} opacity-5 blur-xl group-hover:opacity-15 transition-all`} />
                  <span className="text-sm font-bold text-foreground mb-1 group-hover:text-accent-indigo transition-colors">
                    {sug.title}
                  </span>
                  <span className="text-xs text-foreground/60 leading-relaxed">
                    {sug.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {visibleMessages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex gap-4 w-full animate-fade-in-up ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-accent-indigo to-accent-emerald text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      N
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm leading-relaxed border ${
                      isUser
                        ? "bg-accent-indigo border-accent-indigo/10 text-white shadow-accent-indigo/5"
                        : "bg-bot-msg-bg border-card-border text-foreground"
                    }`}
                  >
                    <div className={`text-[10px] mb-1 font-mono font-semibold ${isUser ? "text-white/60 text-right" : "text-foreground/45"}`}>
                      {isUser ? "You" : selectedModel.name} • {message.timestamp}
                    </div>

                    <div className="text-sm space-y-3 whitespace-pre-wrap selection:bg-accent-indigo/30 select-text">
                      {isUser ? (
                        message.content
                      ) : (
                        <MarkdownFormatter content={message.content} />
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shadow-inner">
                      ME
                    </div>
                  )}
                </div>
              );
            })}

            {isThinking && (
              <div className="flex gap-4 w-full justify-start animate-fade-in-up">
                <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-accent-indigo to-accent-emerald text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  N
                </div>
                
                <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-bot-msg-bg border border-card-border shadow-sm">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-accent-indigo animate-pulse-dots" style={{ animationDelay: "0s" }} />
                    <span className="w-2 h-2 rounded-full bg-accent-indigo animate-pulse-dots" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-accent-indigo animate-pulse-dots" style={{ animationDelay: "0.4s" }} />
                    <span className="text-xs text-foreground/45 font-semibold ml-2 font-mono">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownFormatter({ content }: { content: string }) {
  const parts = content.split("```");
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const lines = part.split("\n");
          const language = lines[0].trim() || "code";
          const codeContent = lines.slice(1).join("\n").trim();
          return <CodeBlock key={index} language={language} code={codeContent} />;
        }
        return <TextFormatter key={index} text={part} />;
      })}
    </>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-card-border/80 overflow-hidden shadow-md bg-neutral-900 text-neutral-100 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 text-[10px] uppercase font-bold tracking-wider text-neutral-400 select-none">
        <span>{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white transition-colors">
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-accent-emerald animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-accent-emerald normal-case font-bold">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed select-all">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextFormatter({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIdx) => {
        const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
        const isNumbered = /^\d+\.\s/.test(line.trim());
        
        let processedLine = line;
        if (isBullet) {
          processedLine = line.trim().substring(2);
        } else if (isNumbered) {
          processedLine = line.trim().replace(/^\d+\.\s/, "");
        }

        const segments = processedLine.split(/(\*\*|`)/g);
        let inBold = false;
        let inCode = false;

        const renderedLine = segments.map((seg, segIdx) => {
          if (seg === "**") {
            inBold = !inBold;
            return null;
          }
          if (seg === "`") {
            inCode = !inCode;
            return null;
          }

          if (inCode) {
            return (
              <code key={segIdx} className="px-1.5 py-0.5 rounded bg-card-border/80 text-accent-indigo border border-card-border font-mono text-[11px] font-semibold">
                {seg}
              </code>
            );
          }
          if (inBold) {
            return <strong key={segIdx} className="font-extrabold text-foreground">{seg}</strong>;
          }
          return <span key={segIdx}>{seg}</span>;
        });

        if (isBullet) {
          return (
            <li key={lineIdx} className="list-disc ml-6 mt-1 text-foreground/90 pl-1 leading-relaxed">
              {renderedLine}
            </li>
          );
        }

        if (isNumbered) {
          return (
            <li key={lineIdx} className="list-decimal ml-6 mt-1 text-foreground/90 pl-1 leading-relaxed">
              {renderedLine}
            </li>
          );
        }

        return (
          <p key={lineIdx} className="leading-relaxed min-h-[1rem]">
            {renderedLine}
          </p>
        );
      })}
    </>
  );
}