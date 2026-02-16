"use client";

interface BadgeProps {
  value: number;
  suffix?: string;
  showSign?: boolean;
}

export function PointBadge({
  value,
  suffix = "円",
  showSign = true,
}: BadgeProps) {
  const cls = value > 0 ? "positive" : value < 0 ? "negative" : "zero";
  const sign = showSign && value > 0 ? "+" : "";
  return (
    <span className={`point-badge ${cls}`}>
      {sign}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatusBadge({ confirmed }: { confirmed: boolean }) {
  return confirmed ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-jade bg-jade-surface border border-jade/20 px-2.5 py-1 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      確定
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold-surface border border-gold/20 px-2.5 py-1 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      未確定
    </span>
  );
}
