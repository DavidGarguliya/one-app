"use client";
import dynamic from "next/dynamic";
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export function GiftConfetti() {
  return <Confetti numberOfPieces={120} recycle={false} className="pointer-events-none" />;
}
