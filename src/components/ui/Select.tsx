"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-3.5 py-2.5 rounded-xl appearance-none
              bg-bg-tertiary border border-border-primary
              text-text-primary text-[15px]
              focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade-glow
              transition-all duration-150
              pr-10
              ${error ? "border-red focus:border-red focus:ring-red-surface" : ""}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-text-muted">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && <p className="text-xs text-red">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
