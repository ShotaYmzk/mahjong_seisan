"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Props {
  title: string;
  children: React.ReactNode;
}

export function StaticPageShell({ title, children }: Props) {
  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-jade transition-colors mb-4"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        ホーム
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">{title}</h1>

      <div className="prose-custom">{children}</div>
    </main>
  );
}
