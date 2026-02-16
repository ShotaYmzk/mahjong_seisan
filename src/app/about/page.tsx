import Link from "next/link";
import { StaticPageShell } from "@/components/StaticPageShell";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <StaticPageShell title="運営元情報">
      <div className="flex flex-col gap-6">
        {/* Service info */}
        <Card padding="lg">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-jade-surface border border-jade/20 shrink-0">
              <span className="text-3xl">🀄</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">麻雀精算</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Mahjong Seisan
              </p>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                麻雀の対局結果を記録し、ウマ・オカ・チップ・立替を含む精算を
                リアルタイムで共同編集できるWebアプリケーションです。
              </p>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card padding="lg">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            主な機能
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: "🀄", title: "四人麻雀 & 三人麻雀", desc: "両モードに完全対応" },
              { icon: "📱", title: "リアルタイム共同編集", desc: "メンバー全員でスコアを同時入力" },
              { icon: "🧮", title: "自動精算計算", desc: "ウマ・オカ・チップ・立替をまとめて計算" },
              { icon: "🔗", title: "招待リンク", desc: "URLを共有するだけでグループに参加" },
              { icon: "📋", title: "LINE出力", desc: "精算結果をワンタップでコピー" },
              { icon: "🌙", title: "ダークモード", desc: "夜間の対局にも優しいデザイン" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{f.title}</p>
                  <p className="text-xs text-text-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Operator */}
        <Card padding="lg">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            運営者
          </h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-text-muted w-24 shrink-0 text-xs font-medium">
                サービス名
              </span>
              <span className="text-text-primary font-medium">麻雀精算</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-text-muted w-24 shrink-0 text-xs font-medium">
                運営者
              </span>
              <span className="text-text-primary">個人運営</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-text-muted w-24 shrink-0 text-xs font-medium">
                お問い合わせ
              </span>
              <a
                href="mailto:Shotaymzk@gmail.com"
                className="text-jade hover:text-jade-dim transition-colors"
              >
                Shotaymzk@gmail.com
              </a>
            </div>
          </div>
        </Card>

        {/* Tech stack */}
        <Card padding="lg">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            技術スタック
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js",
              "React",
              "TypeScript",
              "Supabase",
              "Tailwind CSS",
              "Vercel",
            ].map((tech) => (
              <span
                key={tech}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-bg-tertiary text-text-secondary border border-border-subtle"
              >
                {tech}
              </span>
            ))}
          </div>
        </Card>

        {/* Links */}
        <div className="bg-bg-secondary rounded-2xl p-5 border border-border-subtle">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            関連リンク
          </h3>
          <div className="flex flex-col gap-2">
            <Link
              href="/contact"
              className="text-sm text-jade hover:text-jade-dim transition-colors"
            >
              お問い合わせ・バグ報告
            </Link>
            <Link
              href="/faq"
              className="text-sm text-jade hover:text-jade-dim transition-colors"
            >
              よくある質問
            </Link>
            <Link
              href="/feedback"
              className="text-sm text-jade hover:text-jade-dim transition-colors"
            >
              アンケート
            </Link>
            <Link
              href="/terms"
              className="text-sm text-jade hover:text-jade-dim transition-colors"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-jade hover:text-jade-dim transition-colors"
            >
              プライバシーポリシー
            </Link>
          </div>
        </div>
      </div>
    </StaticPageShell>
  );
}
