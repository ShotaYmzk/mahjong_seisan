"use client";

import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ hover = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-bg-card border border-border-primary rounded-xl p-4
        ${hover ? "transition-colors hover:border-jade/40 cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
