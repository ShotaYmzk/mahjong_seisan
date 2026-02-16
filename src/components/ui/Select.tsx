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
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-xl
            bg-bg-tertiary border border-border-primary
            text-text-primary
            focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade/30
            transition-colors duration-150
            ${error ? "border-red focus:border-red focus:ring-red/30" : ""}
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
        {error && <p className="text-xs text-red">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
