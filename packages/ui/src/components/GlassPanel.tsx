import React from "react";
import clsx from "classnames";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: boolean;
};

export const GlassPanel: React.FC<GlassPanelProps> = ({ className, children, padding = true, ...props }) => {
  return (
    <div
      className={clsx(
        "glass-surface shadow-glass",
        padding ? "p-4" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
