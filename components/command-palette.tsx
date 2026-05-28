"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutGrid,
  Target,
  Layers,
  MessageCircle,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "./theme-provider";

export function CommandPalette({
  onNewTask,
}: {
  onNewTask: () => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[60] bg-[rgba(30,55,110,0.35)] backdrop-blur-sm"
      />
      <div
        className="fixed left-1/2 top-[20vh] -translate-x-1/2 z-[61] w-[min(560px,calc(100vw-32px))] bg-white rounded-[24px] overflow-hidden"
        style={{
          boxShadow:
            "0 30px 60px -15px rgba(45,75,156,0.35), inset 0 3px 0 rgba(255,255,255,0.8)",
        }}
      >
        <Command label="Jarvis command menu">
          <Command.Input
            autoFocus
            placeholder="Search or run a command…"
            className="w-full bg-transparent outline-none text-[16px] font-medium px-6 py-4 border-b border-[var(--color-bg-2)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]"
          />
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="text-[var(--color-ink-mid)] text-sm font-semibold p-6 text-center">
              No matches.
            </Command.Empty>

            <Command.Group
              heading="Navigate"
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-[var(--color-ink-dim)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              <CmdItem
                icon={<LayoutGrid size={16} />}
                onSelect={() => run(() => router.push("/"))}
              >
                Board
              </CmdItem>
              <CmdItem
                icon={<Target size={16} />}
                onSelect={() => run(() => router.push("/goals"))}
              >
                Goals
              </CmdItem>
              <CmdItem
                icon={<Layers size={16} />}
                onSelect={() => run(() => router.push("/projects"))}
              >
                Projects
              </CmdItem>
              <CmdItem
                icon={<MessageCircle size={16} />}
                onSelect={() => run(() => router.push("/chat"))}
              >
                Chat with Jarvis
              </CmdItem>
            </Command.Group>

            <Command.Group
              heading="Actions"
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-[var(--color-ink-dim)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              <CmdItem
                icon={<Plus size={16} />}
                onSelect={() => run(onNewTask)}
              >
                New task
                <span className="ml-auto text-[10px] text-[var(--color-ink-dim)] font-bold">
                  N
                </span>
              </CmdItem>
              <CmdItem
                icon={theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                onSelect={() => run(toggle)}
              >
                {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              </CmdItem>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </>
  );
}

function CmdItem({
  children,
  icon,
  onSelect,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] cursor-pointer text-sm font-semibold text-[var(--color-ink)] data-[selected=true]:bg-[var(--color-bg)] data-[selected=true]:text-[var(--color-clay-deep)]"
    >
      <span className="w-9 h-9 rounded-[12px] grid place-items-center clay-inset text-[var(--color-ink-mid)]">
        {icon}
      </span>
      {children}
    </Command.Item>
  );
}
