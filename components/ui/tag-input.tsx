"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add a tag…",
  maxTags = 20,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    const taken = new Set(value.map((t) => t.toLowerCase()));
    const needle = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !taken.has(s.toLowerCase()))
      .filter((s) => !needle || s.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [suggestions, draft, value]);

  // Reset highlight when filtered list shrinks/grows
  useEffect(() => {
    if (highlight >= filteredSuggestions.length) setHighlight(0);
  }, [filteredSuggestions.length, highlight]);

  // Close suggestion popover on outside click
  useEffect(() => {
    if (!focused) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [focused]);

  function commit(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (value.length >= maxTags) {
      setDraft("");
      return;
    }
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (filteredSuggestions[highlight] && draft.trim()) {
        commit(filteredSuggestions[highlight]);
      } else {
        commit(draft);
      }
      return;
    }
    if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      remove(value.length - 1);
      return;
    }
    if (e.key === "ArrowDown" && filteredSuggestions.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filteredSuggestions.length);
      return;
    }
    if (e.key === "ArrowUp" && filteredSuggestions.length > 0) {
      e.preventDefault();
      setHighlight(
        (h) => (h - 1 + filteredSuggestions.length) % filteredSuggestions.length,
      );
      return;
    }
    if (e.key === "Escape") {
      setFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex flex-wrap items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[14px] bg-white cursor-text transition-shadow",
          "[box-shadow:inset_0_2px_4px_rgba(45,75,156,0.08),0_1px_0_rgba(255,255,255,0.8)]",
          focused &&
            "[box-shadow:inset_0_2px_4px_rgba(45,75,156,0.08),0_0_0_3px_rgba(107,166,245,0.35)]",
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-full text-[12px] font-extrabold text-[var(--color-ink)]"
            style={{
              background:
                "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
              color: "#0e4a3e",
              boxShadow:
                "0 4px 8px -2px rgba(85,200,180,0.4), inset 0 2px 0 rgba(255,255,255,0.4)",
            }}
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
              className="w-4 h-4 rounded-full grid place-items-center bg-white/40 hover:bg-white/70 transition-colors"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[var(--color-ink)] font-medium placeholder:text-[var(--color-ink-faint)] py-1"
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-20 bg-white rounded-[16px] p-1.5 max-h-[200px] overflow-y-auto"
          style={{
            boxShadow:
              "0 18px 36px -10px rgba(45,75,156,0.3), inset 0 2px 0 rgba(255,255,255,0.8)",
          }}
        >
          {filteredSuggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              // mousedown beats blur on click, so the input stays focused
              onMouseDown={(e) => {
                e.preventDefault();
                commit(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "block w-full text-left px-3 py-2 rounded-[10px] text-sm font-semibold transition-colors",
                i === highlight
                  ? "bg-[var(--color-bg)] text-[var(--color-clay-deep)]"
                  : "text-[var(--color-ink)]",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
