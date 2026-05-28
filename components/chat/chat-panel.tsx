"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { ChatMessage } from "./chat-message";

const USER_NAME =
  (typeof window !== "undefined" &&
    (window as unknown as { __JARVIS_USER__?: string }).__JARVIS_USER__) ||
  "James";

export function ChatPanel() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: () => {
      // Refresh kanban / goal / project data after the AI may have mutated.
      window.dispatchEvent(new CustomEvent("jarvis:refresh"));
    },
  });

  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "submitted" || status === "streaming";

  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <aside className="clay-surface p-7 pb-6 flex flex-col min-h-0">
      <header className="flex items-center gap-4 pb-5 mb-5 border-b-2 border-dotted border-[var(--color-bg-2)]">
        <AiBubble />
        <div>
          <h3 className="font-display text-[26px] font-black tracking-[-0.025em] leading-none">
            Hello, {USER_NAME} <span className="text-[var(--color-clay-deep)]">✦</span>
          </h3>
          <div className="text-xs text-[var(--color-ink-mid)] font-semibold mt-1">
            Your thinking partner
          </div>
        </div>
      </header>

      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 min-h-0"
      >
        {messages.length === 0 && <Welcome />}
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
        onSubmit={submit}
        className="mt-4 p-1.5 rounded-[20px] bg-white flex items-center gap-1.5"
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
          className="w-11 h-11 rounded-[16px] grid place-items-center text-white transition-transform hover:scale-[1.06] hover:-rotate-3 active:scale-95 disabled:opacity-40"
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
    </aside>
  );
}

function Welcome() {
  return (
    <div
      className="self-start max-w-[90%] px-4 py-3.5 rounded-[24px] text-sm leading-snug font-medium"
      style={{
        background:
          "linear-gradient(160deg, var(--color-bg), white)",
        color: "var(--color-ink)",
        borderBottomLeftRadius: 8,
        boxShadow:
          "0 10px 20px -6px rgba(45, 75, 156, 0.15), inset 0 3px 0 rgba(255,255,255,0.8)",
      }}
    >
      Morning. Ask me to plan your day, break down a goal, or move tasks around
      the board.
    </div>
  );
}

function AiBubble() {
  return (
    <div
      className="relative w-[72px] h-[72px] rounded-full grid place-items-center clay-float"
      style={{
        background:
          "radial-gradient(circle at 30% 25%, #fff 0%, var(--color-clay-mint) 30%, var(--color-clay-sky) 70%, var(--color-clay-deep))",
        boxShadow:
          "0 16px 28px -6px rgba(85, 145, 235, 0.5), inset 0 6px 0 rgba(255,255,255,0.6), inset 0 -6px 12px rgba(0,0,0,0.1)",
      }}
    >
      <span
        className="text-white font-display text-[28px]"
        style={{ textShadow: "0 2px 4px rgba(30, 70, 150, 0.3)" }}
      >
        ✦
      </span>
      <span
        className="absolute -right-1 -bottom-0.5 w-[18px] h-[18px] rounded-full border-[3px] border-white clay-pulse"
        style={{
          background:
            "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
          boxShadow:
            "0 4px 8px -2px rgba(0, 0, 0, 0.2), inset 0 2px 0 rgba(255,255,255,0.4)",
        }}
      />
    </div>
  );
}
