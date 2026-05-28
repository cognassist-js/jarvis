"use client";

export function Statusbar() {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-3 rounded-full bg-white text-[12.5px] font-bold text-[var(--color-ink-mid)]"
      style={{
        boxShadow:
          "0 14px 28px -6px rgba(45,75,156,0.25), inset 0 2px 0 rgba(255,255,255,0.8)",
      }}
    >
      <span className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full clay-pulse"
          style={{
            background:
              "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
            boxShadow:
              "0 0 8px rgba(85,200,180,0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        />
        Local · all changes saved
      </span>
      <span className="text-[var(--color-ink-faint)]">·</span>
      <span className="flex items-center gap-1.5">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        command
      </span>
      <span className="text-[var(--color-ink-faint)]">·</span>
      <span className="flex items-center gap-1.5">
        <Kbd>N</Kbd>
        new task
      </span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-[var(--color-ink)]"
      style={{
        background: "var(--color-bg)",
        boxShadow: "inset 0 2px 4px rgba(45, 75, 156, 0.12)",
      }}
    >
      {children}
    </kbd>
  );
}
