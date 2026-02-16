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
    "bg-jade text-bg-primary hover:bg-jade-dim focus:ring-jade/40",
  secondary:
    "bg-bg-tertiary text-text-primary border border-border-primary hover:border-jade/50 focus:ring-jade/20",
  danger:
    "bg-red/20 text-red hover:bg-red/30 focus:ring-red/40",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary focus:ring-jade/20",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-semibold
          transition-all duration-150
          focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.97]
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
