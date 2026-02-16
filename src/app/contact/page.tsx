"use client";

import { useState } from "react";
import { StaticPageShell } from "@/components/StaticPageShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const CONTACT_EMAIL = "Shotaymzk@gmail.com";

type Category = "bug" | "feature" | "question" | "other";

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "bug", label: "バグ・エラー報告", emoji: "🐛" },
  { value: "feature", label: "機能リクエスト", emoji: "💡" },
  { value: "question", label: "使い方の質問", emoji: "❓" },
  { value: "other", label: "その他", emoji: "💬" },
];

export default function ContactPage() {
  const [category, setCategory] = useState<Category>("bug");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const subjectPrefix = CATEGORIES.find((c) => c.value === category)?.label ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(
      `[麻雀精算] ${subjectPrefix}${name ? ` - ${name}` : ""}`
    );
    const mailBody = encodeURIComponent(
      `【カテゴリ】${subjectPrefix}\n【お名前】${name || "匿名"}\n\n${body}\n\n---\n送信元: 麻雀精算 お問い合わせフォーム\nUser-Agent: ${navigator.userAgent}`
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${mailBody}`;
    setSent(true);
  };

  return (
    <StaticPageShell title="お問い合わせ">
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        バグ報告、機能リクエスト、ご質問など、お気軽にお問い合わせください。
        メーラーが起動しない場合は、直接{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-jade underline underline-offset-2 hover:text-jade-dim"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        までご連絡ください。
      </p>

      <Card padding="lg">
        {sent ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-jade-surface border border-jade/20 mb-4">
              <svg className="w-7 h-7 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">
              メーラーが起動しました
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              メールアプリからそのまま送信してください。
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSent(false)}
            >
              もう一度送る
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Category */}
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-2 block">
                カテゴリ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      category === cat.value
                        ? "bg-jade text-text-on-jade shadow-sm"
                        : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <Input
              label="お名前（任意）"
              placeholder="匿名でも送れます"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">
                {category === "bug" ? "バグの詳細" : "お問い合わせ内容"}
                <span className="text-red ml-1">*</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder={
                  category === "bug"
                    ? "どんな操作をしたときに、どんなエラーが出ましたか？\nスクリーンショットがあればメールに添付してください。"
                    : "お気軽にどうぞ"
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade-glow transition-all duration-150 text-[15px] resize-none leading-relaxed"
              />
              {category === "bug" && (
                <p className="text-xs text-text-muted">
                  端末情報は自動で添付されます
                </p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={!body.trim()}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              メーラーで送信
            </Button>
          </form>
        )}
      </Card>
    </StaticPageShell>
  );
}
