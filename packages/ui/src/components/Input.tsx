import React from "react";
import clsx from "classnames";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
