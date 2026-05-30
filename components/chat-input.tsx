"use client";

import React, { useRef, useState, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height first to calculate correct scroll height
    textarea.style.height = "auto";
    // Adjust height based on content up to 160px max
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedValue = inputValue.trim();
    if (!trimmedValue || disabled) return;

    onSendMessage(trimmedValue);
    setInputValue("");

    // Refocus and reset height
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, unless Shift is pressed
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 md:p-6 border-t border-card-border bg-background/80 backdrop-blur-md sticky bottom-0 z-30"
    >
      <div className="max-w-3xl mx-auto relative rounded-2xl glass-effect border border-card-border/90 shadow-lg shadow-black/[0.02] focus-within:border-accent-indigo/40 focus-within:shadow-accent-indigo/5 focus-within:shadow-md transition-all duration-300">
        {/* Input Textarea wrapper */}
        <div className="flex items-end gap-2.5 px-4 py-3.5">
          {/* Attachment aesthetic button */}
          <button
            type="button"
            className="flex items-center justify-center w-8.5 h-8.5 rounded-xl hover:bg-card-border text-foreground/50 hover:text-foreground transition-all duration-200"
            title="Attach visual assets"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Core Text Input Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Nexus is writing a response..." : "Ask Nexus to build or explain anything..."}
            disabled={disabled}
            className="flex-1 bg-transparent text-foreground placeholder-foreground/45 border-0 focus:ring-0 focus:outline-none resize-none text-sm leading-relaxed max-h-40 min-h-[22px] py-[1px] select-text"
          />

          {/* Interactive Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className={`flex items-center justify-center w-8.5 h-8.5 rounded-xl transition-all duration-300 ${
              inputValue.trim() && !disabled
                ? "bg-accent-indigo text-white hover:bg-accent-indigo/90 shadow-md shadow-accent-indigo/25 hover:-translate-y-0.5"
                : "bg-card-border text-foreground/30 cursor-not-allowed"
            }`}
            title="Send query"
          >
            <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Dynamic bottom details row inside the input wrapper */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-card-border/40 text-[10px] font-semibold text-foreground/45 font-mono select-none bg-card-bg/20 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <span>Enter to send</span>
            <span className="opacity-40">•</span>
            <span>Shift + Enter for new line</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>{inputValue.length} chars</span>
          </div>
        </div>
      </div>
    </form>
  );
}
