import Link from "next/link";
import clsx from "classnames";

type Props = {
  href?: string;
  full?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
  children?: React.ReactNode;
};

export function CtaButton({ href = "/order", full = false, size = "md", onClick, children }: Props) {
  const sizes = size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-base";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "rounded-full text-black font-semibold shadow-glass transition inline-flex items-center justify-center",
        "bg-[var(--accent)] border border-[var(--border-strong)] hover:bg-[var(--accent-strong)] active:translate-y-[1px]",
        sizes,
        full && "w-full"
      )}
    >
      {children || "Заказать песню"}
    </Link>
  );
}
