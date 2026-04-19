import Link from "next/link";
import clsx from "classnames";

type Props = {
  href?: Parameters<typeof Link>[0]["href"];
  full?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
};

export function CtaButton({ href = "/order" as const, full = false, size = "md", onClick, children, type }: Props) {
  const sizes = size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-base";
  const className = clsx(
    "rounded-full text-black font-semibold shadow-glass transition inline-flex items-center justify-center",
    "bg-[var(--accent)] border border-[var(--border-strong)] hover:bg-[var(--accent-strong)] active:translate-y-[1px]",
    sizes,
    full && "w-full"
  );
  if (!href || type) {
    return (
      <button type={type || "button"} onClick={onClick} className={className}>
        {children || "Заказать песню"}
      </button>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children || "Заказать песню"}
    </Link>
  );
}
