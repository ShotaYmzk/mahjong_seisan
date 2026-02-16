"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-jade text-text-on-jade shadow-sm shadow-jade-glow hover:brightness-110 focus-visible:ring-2 focus-visible:ring-jade/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  secondary:
    "bg-bg-tertiary text-text-primary border border-border-primary hover:border-jade/40 hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-jade/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  danger:
    "bg-red-surface text-red border border-red/20 hover:bg-red/15 focus-visible:ring-2 focus-visible:ring-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary focus-visible:ring-2 focus-visible:ring-jade/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-[13px] rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-[15px] rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-semibold
          outline-none select-none
          transition-all duration-150 ease-out
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.97]
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
