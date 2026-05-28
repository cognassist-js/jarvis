"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { ChatMessage } from "./chat-message";

const STARTERS = [
  "What should I work on today?",
  "What's overdue?",
  "Break down my newest goal into starter tasks.",
  "Move my in-progress side-project tasks to done.",
];

export function FullChat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: () => {
      window.dispatchEvent(new CustomEvent("jarvis:refresh"));
    },
  });
  const [input, setInput] = useState("");
  const isStreaming = status === "submitted" || status === "streaming";
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  function submit(text: string) {
    if (!text.trim() || isStreaming) return;
    sendMessage({ text: text.trim() });
    setInput("");
  }

  return (
    <>
      <h2 className="font-display text-[44px] font-black leading-none tracking-[-0.03em] mb-2">
        Chat with{" "}
        <span className="italic font-bold text-[var(--color-clay-deep)]">Jarvis.</span>
      </h2>
      <p className="text-sm text-[var(--color-ink-mid)] font-semibold mb-6">
        Your thinking partner. Try one of these to start, or type your own.
      </p>

      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 min-h-0 mb-5"
      >
        {messages.length === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="clay-card text-left p-4 hover:-translate-y-[2px] transition-transform"
              >
                <div className="font-display font-bold text-[15px] text-[var(--color-ink)] leading-tight">
                  {s}
                </div>
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {isStreaming && (
          <div className="self-start text-[var(--color-ink-mid)] text-xs font-bold flex items-center gap-2 pl-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-clay-deep)] clay-pulse" />
            thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="p-1.5 rounded-[20px] bg-white flex items-center gap-1.5 self-stretch"
        style={{
          boxShadow:
            "0 8px 16px -4px rgba(45, 75, 156, 0.18), inset 0 -2px 4px rgba(45, 75, 156, 0.08)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Jarvis anything…"
          disabled={isStreaming}
          className="flex-1 bg-transparent outline-none px-4 py-3 text-sm text-[var(--color-ink)] font-medium placeholder:text-[var(--color-ink-faint)]"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          aria-label="Send"
          className="w-11 h-11 rounded-[16px] grid place-items-center text-white transition-transform hover:scale-[1.06] active:scale-95 disabled:opacity-40"
          style={{
            background:
              "linear-gradient(160deg, var(--color-clay-deep), var(--color-clay-deep-2))",
            boxShadow:
              "0 8px 14px -2px rgba(71, 131, 219, 0.5), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Send size={18} strokeWidth={2.6} />
        </button>
      </form>
    </>
  );
}
