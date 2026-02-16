"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-xl
            bg-bg-tertiary border border-border-primary
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade/30
            transition-colors duration-150
            tabular-nums
            ${error ? "border-red focus:border-red focus:ring-red/30" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
