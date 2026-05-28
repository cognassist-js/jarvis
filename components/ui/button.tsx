"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-all whitespace-nowrap rounded-[16px] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-clay-deep)]",
  {
    variants: {
      variant: {
        primary:
          "text-white px-6 py-3 text-[15px] [background:linear-gradient(160deg,var(--color-clay-deep),var(--color-clay-deep-2))] hover:-translate-y-[2px] active:translate-y-[1px] [box-shadow:0_12px_22px_-6px_rgba(71,131,219,0.6),inset_0_3px_0_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.08)]",
        secondary:
          "bg-white text-[var(--color-ink)] px-5 py-2.5 hover:-translate-y-[1px] [box-shadow:0_8px_16px_-4px_rgba(45,75,156,0.2),inset_0_2px_0_rgba(255,255,255,0.7)]",
        ghost:
          "bg-transparent text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] hover:bg-white/40 px-4 py-2",
        danger:
          "text-white px-5 py-2.5 [background:linear-gradient(160deg,var(--color-clay-coral),var(--color-clay-coral-2))] hover:-translate-y-[1px] [box-shadow:0_10px_20px_-4px_rgba(239,116,114,0.5),inset_0_2px_0_rgba(255,255,255,0.3)]",
        icon: "w-12 h-12 bg-white text-[var(--color-ink-mid)] hover:-translate-y-[2px] [box-shadow:0_8px_16px_-4px_rgba(45,75,156,0.2),inset_0_2px_0_rgba(255,255,255,0.7)]",
      },
      size: {
        default: "",
        sm: "text-xs px-3 py-1.5 rounded-[12px]",
        lg: "text-base px-7 py-3.5 rounded-[20px]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
