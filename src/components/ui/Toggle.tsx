"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus-ring disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? "bg-jade" : "bg-bg-tertiary border border-border-primary"}
      `}
    >
      {label && <span className="sr-only">{label}</span>}
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
          ring-0 transition-transform duration-200 ease-in-out
          ${checked ? "translate-x-[22px]" : "translate-x-0.5"}
        `}
      />
    </button>
  );
}
