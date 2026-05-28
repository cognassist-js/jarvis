"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { UIMessage } from "ai";

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const parts = message.parts ?? [];

  if (isUser) {
    const text = parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");
    return (
      <div
        className="self-end max-w-[90%] px-4 py-3.5 rounded-[24px] text-sm font-semibold text-white"
        style={{
          background:
            "linear-gradient(160deg, var(--color-clay-deep), var(--color-clay-deep-2))",
          borderBottomRightRadius: 8,
          boxShadow:
            "0 10px 20px -4px rgba(71, 131, 219, 0.45), inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.08)",
        }}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      className="self-start max-w-[95%] px-4 py-3.5 rounded-[24px] text-sm leading-snug font-medium flex flex-col gap-2"
      style={{
        background:
          "linear-gradient(160deg, var(--color-bg), white)",
        color: "var(--color-ink)",
        borderBottomLeftRadius: 8,
        boxShadow:
          "0 10px 20px -6px rgba(45, 75, 156, 0.15), inset 0 3px 0 rgba(255,255,255,0.8)",
      }}
    >
      {parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <p key={i} className="whitespace-pre-wrap">
              {(part as { type: "text"; text: string }).text}
            </p>
          );
        }
        if (
          typeof part.type === "string" &&
          part.type.startsWith("tool-")
        ) {
          return <ToolCallPart key={i} part={part as ToolPartLike} />;
        }
        if (part.type === "step-start" || part.type === "reasoning") {
          return null;
        }
        return null;
      })}
    </div>
  );
}

type ToolPartLike = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ToolCallPart({ part }: { part: ToolPartLike }) {
  const [open, setOpen] = useState(false);
  const toolName = part.type.replace(/^tool-/, "");
  const done = part.state === "output-available" || part.state === "result";
  const failed =
    part.state === "output-error" || part.state === "error" || !!part.errorText;

  return (
    <div
      className="rounded-[14px] p-2.5 text-xs"
      style={{
        background: "rgba(107, 166, 245, 0.08)",
        boxShadow: "inset 0 2px 4px rgba(45, 75, 156, 0.06)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 font-bold text-left text-[var(--color-clay-deep)]"
      >
        <ChevronRight
          size={14}
          className={open ? "rotate-90 transition-transform" : "transition-transform"}
        />
        <span>
          {failed ? "✕" : done ? "✓" : "⋯"} {toolName}
        </span>
      </button>
      {open && (
        <div className="mt-2 grid gap-1.5 font-mono text-[11px] text-[var(--color-ink-mid)]">
          {part.input != null && (
            <pre className="whitespace-pre-wrap break-all bg-white/60 rounded-md p-1.5">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          )}
          {part.output != null && (
            <pre className="whitespace-pre-wrap break-all bg-white/60 rounded-md p-1.5 max-h-40 overflow-auto">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          )}
          {part.errorText && (
            <pre className="whitespace-pre-wrap break-all text-[var(--color-clay-coral-2)] bg-white/60 rounded-md p-1.5">
              {part.errorText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
