"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Target,
  Layers,
  MessageCircle,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import type { GoalWithStats } from "@/lib/services/goals";
import type { Project } from "@/db/schema";
import { cn } from "@/lib/utils";

const USER_NAME = process.env.NEXT_PUBLIC_USER_NAME ?? "James";
const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const goalSwatch = (color: string): string => {
  // Map hex to gradient slot. We let inline style handle colour exactly.
  return color;
};

export function Sidebar({
  goals,
  projects,
  summary,
}: {
  goals: GoalWithStats[];
  projects: Project[];
  summary: { counts: Record<string, number>; total: number };
}) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const navItems = [
    {
      href: "/",
      label: "Board",
      icon: LayoutGrid,
      count: summary.total - (summary.counts["done"] ?? 0),
    },
    { href: "/goals", label: "Goals", icon: Target, count: goals.length },
    {
      href: "/projects",
      label: "Projects",
      icon: Layers,
      count: projects.length,
    },
    { href: "/chat", label: "Chat", icon: MessageCircle, count: null },
  ] as const;

  return (
    <aside className="clay-surface flex flex-col p-7 pt-7">
      <div className="flex items-center gap-3.5 px-2 pb-6">
        <div
          className="w-14 h-14 rounded-[22px] grid place-items-center text-white font-display font-black text-[28px] -rotate-[4deg]"
          style={{
            background:
              "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
            boxShadow:
              "0 10px 22px -4px rgba(85, 145, 235, 0.55), inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -4px 8px rgba(0,0,0,0.08)",
          }}
        >
          J
        </div>
        <div>
          <h1 className="font-display text-[28px] font-black leading-none tracking-[-0.025em]">
            Jarvis
          </h1>
          <p className="text-xs text-[var(--color-ink-mid)] font-semibold mt-1">
            Personal · ocean
          </p>
        </div>
      </div>

      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ink-dim)] mx-3 mt-4 mb-2.5">
        Workspace
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-3 rounded-[18px] text-[14.5px] font-bold transition-all",
                "text-[var(--color-ink-mid)] hover:-translate-y-[1px]",
                active && "text-[var(--color-ink)]",
              )}
            >
              <span
                className={cn(
                  "w-10 h-10 rounded-[14px] grid place-items-center transition-all",
                  active
                    ? "text-white"
                    : "text-[var(--color-ink-mid)] clay-inset",
                )}
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(160deg, var(--color-clay-aqua), var(--color-clay-deep))",
                        boxShadow:
                          "0 8px 14px -2px rgba(85, 165, 200, 0.55), inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.1)",
                      }
                    : undefined
                }
              >
                <Icon size={20} strokeWidth={2.4} />
              </span>
              <span>{item.label}</span>
              {item.count != null && (
                <span
                  className="ml-auto text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-[var(--color-ink)]"
                  style={{
                    background: "var(--color-clay-mint)",
                    boxShadow:
                      "0 3px 6px rgba(85, 200, 180, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ink-dim)] mx-3 mt-5 mb-2.5">
        Goals
      </div>

      <div className="flex flex-col gap-3">
        {goals.length === 0 && (
          <Link
            href="/goals"
            className="text-[13px] text-[var(--color-ink-mid)] px-3 py-3 rounded-[18px] clay-inset block hover:-translate-y-[1px] transition-all"
          >
            + add your first goal
          </Link>
        )}
        {goals.map((g) => (
          <GoalClay key={g.id} goal={g} />
        ))}
      </div>

      <div className="mt-auto pt-6">
        <div
          className="p-3.5 rounded-[22px] flex items-center gap-3"
          style={{
            background:
              "linear-gradient(160deg, #fff, var(--color-bg))",
            boxShadow:
              "0 6px 14px -4px rgba(45, 75, 156, 0.15), inset 0 2px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div
            className="w-[46px] h-[46px] rounded-[18px] grid place-items-center font-display font-extrabold text-base text-[var(--color-ink)] -rotate-[6deg]"
            style={{
              background:
                "linear-gradient(160deg, var(--color-clay-butter), #f5c545)",
              boxShadow:
                "0 8px 14px -4px rgba(212, 162, 19, 0.4), inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.08)",
            }}
          >
            {initials(USER_NAME)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[14.5px] truncate">{USER_NAME}</div>
            <div className="text-[11px] text-[var(--color-ink-mid)] font-semibold">
              Personal · local
            </div>
          </div>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="ml-auto w-[38px] h-[38px] rounded-[13px] bg-white grid place-items-center text-[var(--color-ink-mid)] hover:-translate-y-[1px] transition-all"
            style={{
              boxShadow:
                "0 5px 10px -3px rgba(45, 75, 156, 0.18), inset 0 2px 0 rgba(255,255,255,0.7)",
            }}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function GoalClay({ goal }: { goal: GoalWithStats }) {
  // Pick gradient by color hex bucket
  const variant = pickVariant(goal.color);
  return (
    <Link
      href={`/goals#${goal.id}`}
      className="goal-clay block relative overflow-hidden p-4 rounded-[24px] transition-all hover:-translate-y-[3px] hover:-rotate-[1deg]"
      style={variant.surface}
    >
      <div className="flex justify-between items-center mb-2.5">
        <div
          className="font-display text-[18px] font-bold tracking-[-0.02em] leading-none truncate pr-2"
          style={{ color: variant.text }}
        >
          {goal.title}
        </div>
        <span
          className="font-sans text-[22px] font-extrabold text-[var(--color-ink)] tabular-nums px-2.5 py-1 rounded-[12px]"
          style={{
            background: "rgba(255,255,255,0.5)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
          }}
        >
          {goal.progress}%
        </span>
      </div>
      <div
        className="h-2.5 rounded-md overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.45)",
          boxShadow: "inset 0 3px 6px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="h-full rounded-md"
          style={{
            width: `${goal.progress}%`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7), transparent), rgba(255,255,255,0.85)",
            boxShadow:
              "inset 0 2px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.1)",
          }}
        />
      </div>
      <span
        className="absolute -bottom-7 -right-5 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,255,255,0.25)",
          filter: "blur(8px)",
        }}
      />
    </Link>
  );
}

type ClayVariant = {
  surface: React.CSSProperties;
  text: string;
};

export function pickVariant(color: string): ClayVariant {
  // Categorise hex by hue family
  const c = color.toLowerCase();
  // sky/ocean blues
  if (/#(?:[0-9a-f]?[6-9a-f][0-9a-f]?[6-9a-f]f[0-9a-f])/.test(c)) {
    // fallthrough — handled below
  }
  const blueHex = ["#6ba6f5", "#9ec6fa", "#4783db"];
  const mintHex = ["#6dd5c7", "#a8e6d4"];
  const lilacHex = ["#a995ec", "#c8b5f5"];
  const coralHex = ["#f59a98", "#ef7472"];

  if (blueHex.includes(c)) {
    return {
      surface: {
        background:
          "linear-gradient(160deg, var(--color-clay-sky), var(--color-clay-deep))",
        boxShadow:
          "0 12px 24px -6px rgba(85, 145, 235, 0.5), inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -4px 10px rgba(0,0,0,0.07)",
      },
      text: "white",
    };
  }
  if (mintHex.includes(c)) {
    return {
      surface: {
        background:
          "linear-gradient(160deg, var(--color-clay-mint), var(--color-clay-aqua))",
        boxShadow:
          "0 12px 24px -6px rgba(85, 200, 180, 0.5), inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -4px 10px rgba(0,0,0,0.07)",
      },
      text: "#0e4a3e",
    };
  }
  if (lilacHex.includes(c)) {
    return {
      surface: {
        background:
          "linear-gradient(160deg, var(--color-clay-lilac), var(--color-clay-lavender))",
        boxShadow:
          "0 12px 24px -6px rgba(160, 130, 220, 0.5), inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -4px 10px rgba(0,0,0,0.07)",
      },
      text: "white",
    };
  }
  if (coralHex.includes(c)) {
    return {
      surface: {
        background:
          "linear-gradient(160deg, var(--color-clay-coral), var(--color-clay-coral-2))",
        boxShadow:
          "0 12px 24px -6px rgba(239, 116, 114, 0.5), inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -4px 10px rgba(0,0,0,0.07)",
      },
      text: "white",
    };
  }
  // fallback — colour as a solid soft tint
  return {
    surface: {
      background: `linear-gradient(160deg, ${color}, ${color})`,
      boxShadow:
        "0 12px 24px -6px rgba(45, 75, 156, 0.25), inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -4px 10px rgba(0,0,0,0.07)",
    },
    text: "white",
  };
}
