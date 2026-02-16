"use client";

import Link from "next/link";

const footerLinks = [
  { href: "/faq", label: "よくある質問" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/feedback", label: "アンケート" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/about", label: "運営元情報" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border-primary bg-bg-secondary mt-auto">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Links */}
        <nav className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-text-secondary hover:text-jade transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border-subtle pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🀄</span>
              <span className="text-xs font-semibold text-text-muted">
                麻雀精算
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              &copy; {new Date().getFullYear()} Mahjong Seisan
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
