"use client";

import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({
  hover = false,
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-bg-card border border-border-primary rounded-2xl
        shadow-[0_1px_3px_var(--c-shadow)]
        ${paddingClasses[padding]}
        ${
          hover
            ? "cursor-pointer transition-all duration-200 hover:border-jade/40 hover:shadow-[0_4px_16px_var(--c-shadow)] active:scale-[0.98]"
            : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
