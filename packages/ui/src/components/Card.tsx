"use client";

import React from "react";
import clsx from "classnames";
import { motion } from "framer-motion";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const Card: React.FC<CardProps> = ({ className, children, interactive = true, ...props }) => {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, scale: 1.01 } : undefined}
      className={clsx(
        "p-4 text-[var(--fg)]/90 bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)]",
        "rounded-[var(--radius-panel)] transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
