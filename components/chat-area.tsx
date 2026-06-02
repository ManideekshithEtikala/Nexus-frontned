"use client";

import React, { useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface UIBlockTableData {
  columns: Array<{ id: string; name: string }>;
  rows: Array<Record<string, any>>; 
}

interface UIBlock {
  block_type: "markdown_text" | "data_table";
  markdown_text?: string | null;
  content?: string | null; 
  table_data?: UIBlockTableData | null;
}

interface ChatAreaProps {
  messages: Message[];
  isThinking: boolean;
  onSendPrompt: (prompt: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

export default function ChatArea({ messages, isThinking, onSendPrompt, setSidebarOpen }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Safe Polymorphic JSON Pipeline Parser
  const parsePipelineContent = (content: string): UIBlock[] | null => {
    const trimmed = content.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.length > 0 && "block_type" in parsed[0] ? parsed : null;
      }

      if (parsed && typeof parsed === "object") {
        if (parsed.data?.ui_pipeline && Array.isArray(parsed.data.ui_pipeline)) {
          return parsed.data.ui_pipeline;
        }
        if (parsed.ui_pipeline && Array.isArray(parsed.ui_pipeline)) {
          return parsed.ui_pipeline;
        }
      }
      
      return null;
    } catch (e) {
      return null; 
    }
  };

  // Safe Link Formatter & Extractor
  const renderTextSegmentWithLinks = (textSegment: string, key: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = textSegment.split(urlRegex);

    if (parts.length === 1) return textSegment;

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={`${key}-link-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 underline break-all font-medium inline-flex items-center gap-0.5 transition-colors duration-200"
          >
            {part}
            <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      }
      return part;
    });
  };

  // Safe Inline Markdown Segment Parser (Bold & Inline Code Backticks)
  const renderInlineMarkdown = (text: string, baseKey: string) => {
    if (!text) return "";
    const segments = text.split(/(\*\*|`)/g);
    let inBold = false;
    let inCode = false;

    return segments.map((seg, idx) => {
      if (seg === "**") { inBold = !inBold; return null; }
      if (seg === "`") { inCode = !inCode; return null; }

      const segKey = `${baseKey}-seg-${idx}`;
      if (inCode) {
        return (
          <code key={segKey} className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-500 dark:text-indigo-400 font-mono text-[11px] font-semibold border border-zinc-200/50 dark:border-zinc-700/30">
            {seg}
          </code>
        );
      }
      if (inBold) {
        return <strong key={segKey} className="font-extrabold text-zinc-900 dark:text-zinc-50">{renderTextSegmentWithLinks(seg, segKey)}</strong>;
      }
      return <span key={segKey}>{renderTextSegmentWithLinks(seg, segKey)}</span>;
    });
  };

  // ADVANCED: Stateful Block Parser capturing code snippets, section layouts, and lists safely
  const renderAdvancedContentBlocks = (text: string, msgKey: string = "block") => {
    if (!text) return null;

    const lines = text.split("\n");
    const components: React.ReactNode[] = [];
    
    let activeCodeLines: string[] = [];
    let isInsideCodeMode = false;
    let currentLanguage = "code";

    const programmingLanguages = ["python", "javascript", "typescript", "html", "css", "json", "bash", "sql"];

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      const trimmedLine = currentLine.trim();

      // Case A: Detect Standard Markdown Code Fences
      if (trimmedLine.startsWith("```")) {
        if (isInsideCodeMode) {
          // Flush complete code block structure
          components.push(
            <div key={`${msgKey}-codeframe-${i}`} className="my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950 text-zinc-100 font-mono text-xs">
              <div className="bg-zinc-900/90 px-4 py-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-400 select-none border-b border-zinc-800">
                <span>{currentLanguage}</span>
                <span className="text-zinc-600 lowercase font-normal">source code</span>
              </div>
              <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed font-mono select-text tab-size-4">
                <code>{activeCodeLines.join("\n")}</code>
              </pre>
            </div>
          );
          activeCodeLines = [];
          isInsideCodeMode = false;
        } else {
          isInsideCodeMode = true;
          currentLanguage = trimmedLine.replace("```", "").trim() || "code";
        }
        continue;
      }

      // Case B: Fallback Catch for Implicit/Raw Code Headers (e.g. standalone word "python")
      if (!isInsideCodeMode && programmingLanguages.includes(trimmedLine.toLowerCase()) && i < lines.length - 1) {
        const nextLineTrimmed = lines[i + 1].trim();
        // Lookahead checking if following statements look like structural programming statements
        if (
          nextLineTrimmed.startsWith("import ") || 
          nextLineTrimmed.startsWith("def ") || 
          nextLineTrimmed.startsWith("async ") ||
          nextLineTrimmed.startsWith("//") ||
          nextLineTrimmed.startsWith("#") ||
          nextLineTrimmed.startsWith("function ") ||
          nextLineTrimmed.startsWith("const ")
        ) {
          isInsideCodeMode = true;
          currentLanguage = trimmedLine.toLowerCase();
          continue;
        }
      }

      // Append lines to the active code buffer if code collection mode is active
      if (isInsideCodeMode) {
        // Safe interrupt guard: If a markdown structural header appears unexpectedly, close active block
        if (trimmedLine.startsWith("## ") || trimmedLine.startsWith("### ")) {
          components.push(
            <div key={`${msgKey}-codeframe-auto-${i}`} className="my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950 text-zinc-100 font-mono text-xs">
              <div className="bg-zinc-900/90 px-4 py-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-800">
                <span>{currentLanguage}</span>
              </div>
              <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed font-mono select-text">
                <code>{activeCodeLines.join("\n")}</code>
              </pre>
            </div>
          );
          activeCodeLines = [];
          isInsideCodeMode = false;
        } else {
          activeCodeLines.push(currentLine);
          continue;
        }
      }

      // Case C: Markdown Section Titles / Typography Headers
      if (trimmedLine.startsWith("##") || trimmedLine.startsWith("###")) {
        const headerText = trimmedLine.replace(/^#+\s*/, "");
        components.push(
          <h3 key={`${msgKey}-h3-${i}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-1 flex items-center tracking-tight">
            {renderInlineMarkdown(headerText, `${msgKey}-h3-${i}`)}
          </h3>
        );
        continue;
      }

      // Case D: Markdown Lists / Core Bullet Trees
      const isBullet = trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ");
      const isNumbered = /^\d+\.\s/.test(trimmedLine) || /^\d+\s/.test(trimmedLine);

      if (isBullet) {
        const cleanContent = trimmedLine.substring(2);
        components.push(
          <ul key={`${msgKey}-ul-${i}`} className="list-disc pl-5 my-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li className="pl-0.5">{renderInlineMarkdown(cleanContent, `${msgKey}-li-${i}`)}</li>
          </ul>
        );
        continue;
      }

      if (isNumbered) {
        const cleanContent = trimmedLine.replace(/^\d+(\.|\s)\s*/, "");
        components.push(
          <ol key={`${msgKey}-ol-${i}`} className="list-decimal pl-5 my-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li className="pl-0.5">{renderInlineMarkdown(cleanContent, `${msgKey}-ol-li-${i}`)}</li>
          </ol>
        );
        continue;
      }

      // Case E: Standard Text Paragraph Block
      if (trimmedLine) {
        components.push(
          <p key={`${msgKey}-p-${i}`} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 my-2">
            {renderInlineMarkdown(currentLine, `${msgKey}-p-${i}`)}
          </p>
        );
      } else {
        components.push(<div key={`${msgKey}-space-${i}`} className="h-1.5" />);
      }
    }

    // Edge Case Guard: Safely flush any code buffers that remain open at the end of the text track
    if (isInsideCodeMode && activeCodeLines.length > 0) {
      components.push(
        <div key={`${msgKey}-codeframe-flush`} className="my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950 text-zinc-100 font-mono text-xs">
          <div className="bg-zinc-900/90 px-4 py-2 text-[10px] uppercase font-bold text-zinc-400">
            <span>{currentLanguage}</span>
          </div>
          <pre className="p-4 overflow-x-auto whitespace-pre font-mono select-text">
            <code>{activeCodeLines.join("\n")}</code>
          </pre>
        </div>
      );
    }

    return components;
  };

  // Helper Utility: Resolves the key name for table mapping case-sensitively
  const getTableCellValue = (row: Record<string, any>, colId: string, colName: string): string => {
    // Exact Key Match (e.g., row["language"])
    if (row[colId] !== undefined) return String(row[colId]);
    
    // Lowercase Key Match (e.g. colId is "Language" but database key is "language")
    const lowerColId = colId.toLowerCase();
    const lowerColName = colName.toLowerCase();
    
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === lowerColId || lowerKey === lowerColName) {
        return String(row[key]);
      }
    }
    
    // Explicit Fallbacks
    if (row.content !== undefined && colId !== "id") return String(row.content);
    if (row.value !== undefined) return String(row.value);
    
    return "";
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-white dark:bg-[#0c0c0e]">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Workspace Matrix Core</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            Execute dynamic agent tool workflows to build unified functional interfaces.
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isUser = message.role === "user";
          const blocks = isUser ? null : parsePipelineContent(message.content);

          return (
            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                isUser 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                  : "bg-zinc-50 dark:bg-[#141416] border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-2 opacity-40 font-mono text-[9px] font-bold select-none">
                  <span>{isUser ? "OPERATOR" : "NEXUSCORE_AGENT"}</span>
                  <span>{message.timestamp}</span>
                </div>

                {blocks ? (
                  <div className="space-y-4">
                    {blocks.map((block, index) => {
                      if (!block || !block.block_type) return null;

                      if (block.block_type === "markdown_text") {
                        const rawText = block.markdown_text ?? block.content ?? "";
                        return (
                          <div key={`text-${index}`} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {renderAdvancedContentBlocks(rawText, `blk-${index}`)}
                          </div>
                        );
                      }

                      if (block.block_type === "data_table") {
                        const table = block.table_data;
                        
                        if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
                          return (
                            <div key={`table-err-${index}`} className="p-2 border border-dashed border-red-500/30 rounded text-xs text-red-400 font-mono">
                              [Warning: Incomplete execution logs received]
                            </div>
                          );
                        }

                        return (
                          <div key={`table-${index}`} className="my-3 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto shadow-sm bg-white dark:bg-[#1b1b1d]">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                                  {table.columns.map((col) => (
                                    <th key={col.id || col.name} className="p-3 font-semibold">
                                      {col.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {table.rows.map((row, rowIdx) => (
                                  <tr key={row.id || rowIdx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors duration-150">
                                    {table.columns.map((col) => {
                                      // FIXED: Safe field value resolver with exact casing checks and column fallbacks
                                      const cellValue = getTableCellValue(row, col.id, col.name);
                                      return (
                                        <td key={col.id} className="p-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-normal">
                                          {renderAdvancedContentBlocks(cellValue, `cell-${rowIdx}-${col.id}`)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      renderAdvancedContentBlocks(message.content, "fallback")
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {isThinking && (
        <div className="flex items-center space-x-2.5 text-zinc-400 font-mono text-xs p-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span>Parsing backend operational logs...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}