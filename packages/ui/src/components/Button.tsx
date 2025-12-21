"use client";

import { motion } from "framer-motion";
import clsx from "classnames";
import React from "react";

type As = "button" | "a";

type ButtonProps<T extends As = "button"> = (T extends "a"
  ? React.AnchorHTMLAttributes<HTMLAnchorElement>
  : React.ButtonHTMLAttributes<HTMLButtonElement>) & {
  variant?: "primary" | "ghost";
  as?: T;
};

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, children, variant = "primary", as = "button", ...props }, ref) => {
    const base =
      variant === "primary"
        ? "bg-[var(--accent)] text-black border border-[var(--border-strong)] hover:bg-[var(--accent-strong)] focus:ring-[var(--focus-ring)] active:translate-y-[1px]"
        : "bg-[color-mix(in srgb,var(--accent) 12%,transparent)] text-[var(--fg)] border border-[var(--border-strong)] hover:bg-[color-mix(in srgb,var(--accent) 22%,transparent)] active:translate-y-[1px]";
    const Comp: any = motion[as === "a" ? "a" : "button"];
    return (
      <Comp
        whileTap={{ scale: 0.92, y: 1 }}
        whileHover={{ scale: 1.02 }}
        ref={ref as any}
        className={clsx(
          "rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 inline-flex items-center justify-center",
          base,
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
