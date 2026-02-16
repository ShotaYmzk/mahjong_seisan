"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3.5 py-2.5 rounded-xl
            bg-bg-tertiary border border-border-primary
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade-glow
            transition-all duration-150
            tabular-nums text-[15px]
            ${error ? "border-red focus:border-red focus:ring-red-surface" : ""}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
        {error && <p className="text-xs text-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
