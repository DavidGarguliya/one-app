import React from "react";
import clsx from "classnames";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-xl bg-white/5 border border-white/5 min-h-[1.5rem]",
        className
      )}
      {...props}
    />
  );
};
