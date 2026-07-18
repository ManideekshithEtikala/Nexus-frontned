"use client";

import React, { useRef, useState, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSendMessage, disabled, placeholder }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    // When cleared after submit, restore focus
    if (inputValue === "") {
      textarea.focus();
    }
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || disabled) return;

    onSendMessage(trimmedValue);
    setInputValue("");
    // Focus is restored by the useEffect below when inputValue becomes ""
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 md:px-8 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-900">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#121214] shadow-sm">
        <div className="flex items-center px-4 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Submit a prompt execution prompt..."}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed max-h-40 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 disabled:cursor-not-allowed py-1"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              inputValue.trim() && !disabled
                ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
                : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[10px] font-semibold text-zinc-400 font-mono bg-zinc-50/50 dark:bg-[#151518]/20 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <span>Enter to send</span>
            <span className="opacity-40">•</span>
            <span>Shift + Enter for newline</span>
          </div>
          <div>Type-Safe Polymorphic View Layer</div>
        </div>
      </form>
    </div>
  );
}