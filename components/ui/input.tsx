"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-white rounded-[14px] px-4 py-2.5 text-sm text-[var(--color-ink)] font-medium outline-none transition-shadow",
          "placeholder:text-[var(--color-ink-faint)]",
          "[box-shadow:inset_0_2px_4px_rgba(45,75,156,0.08),0_1px_0_rgba(255,255,255,0.8)]",
          "focus-visible:[box-shadow:inset_0_2px_4px_rgba(45,75,156,0.08),0_0_0_3px_rgba(107,166,245,0.35)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-white rounded-[14px] px-4 py-3 text-sm text-[var(--color-ink)] font-medium outline-none resize-none transition-shadow",
      "placeholder:text-[var(--color-ink-faint)]",
      "[box-shadow:inset_0_2px_4px_rgba(45,75,156,0.08),0_1px_0_rgba(255,255,255,0.8)]",
      "focus-visible:[box-shadow:inset_0_2px_4px_rgba(45,75,156,0.08),0_0_0_3px_rgba(107,166,245,0.35)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
