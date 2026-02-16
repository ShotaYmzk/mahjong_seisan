"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center" aria-label="テーマ切替">
        <span className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 rounded-xl bg-bg-tertiary border border-border-primary
        hover:border-jade/40 hover:bg-bg-secondary
        flex items-center justify-center
        transition-all duration-200 focus-ring
        active:scale-95"
      aria-label={isDark ? "ライトモードに切替" : "ダークモードに切替"}
    >
      {/* Sun icon */}
      <svg
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ${
          isDark
            ? "opacity-0 rotate-90 scale-0"
            : "opacity-100 rotate-0 scale-100 text-gold"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
      </svg>

      {/* Moon icon */}
      <svg
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ${
          isDark
            ? "opacity-100 rotate-0 scale-100 text-jade"
            : "opacity-0 -rotate-90 scale-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </button>
  );
}
