"use client";
import { motion } from "framer-motion";

export function GiftEnvelope({ title, message, onOpen }: { title: string; message: string; onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_70%,transparent)] via-white/5 to-black/40 border border-white/15 shadow-2xl px-8 py-10 text-left"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-md" aria-hidden />
      <div className="relative space-y-3">
        <p className="text-sm text-white/70">Подарок</p>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="text-white/80 leading-relaxed">{message}</p>
        <span className="inline-flex items-center gap-2 text-[var(--accent)] text-sm">
          Открыть и запустить ▶
        </span>
      </div>
    </motion.button>
  );
}
