// @ts-nocheck
import baseConfig from "../../packages/config/tailwind.base.cjs";
import type { Config } from "tailwindcss";

export default {
  ...baseConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ]
} satisfies Config;
