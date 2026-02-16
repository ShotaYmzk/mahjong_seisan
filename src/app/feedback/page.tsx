"use client";

import { useState } from "react";
import { StaticPageShell } from "@/components/StaticPageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CONTACT_EMAIL = "Shotaymzk@gmail.com";

const SATISFACTION_LEVELS = [
  { value: 5, emoji: "😍", label: "とても満足" },
  { value: 4, emoji: "😊", label: "満足" },
  { value: 3, emoji: "😐", label: "普通" },
  { value: 2, emoji: "😕", label: "不満" },
  { value: 1, emoji: "😢", label: "とても不満" },
];

const FEATURE_OPTIONS = [
  "半荘の記録",
  "精算計算",
  "チップ管理",
  "立替（割り勘）",
  "リアルタイム共同編集",
  "三人麻雀対応",
  "ルール設定",
  "LINE用テキスト出力",
  "招待リンク",
  "ダークモード",
];

export default function FeedbackPage() {
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [favoriteFeatures, setFavoriteFeatures] = useState<Set<string>>(
    new Set()
  );
  const [improvement, setImprovement] = useState("");
  const [request, setRequest] = useState("");
  const [sent, setSent] = useState(false);

  const toggleFeature = (f: string) => {
    setFavoriteFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const satLabel =
      SATISFACTION_LEVELS.find((s) => s.value === satisfaction)?.label ?? "未選択";
    const features =
      favoriteFeatures.size > 0
        ? Array.from(favoriteFeatures).join(", ")
        : "未選択";

    const subject = encodeURIComponent("[麻雀精算] アンケート回答");
    const body = encodeURIComponent(
      `【満足度】${satLabel} (${satisfaction}/5)\n\n【よく使う・気に入っている機能】\n${features}\n\n【改善してほしい点】\n${improvement || "特になし"}\n\n【追加してほしい機能やご要望】\n${request || "特になし"}\n\n---\n送信元: 麻雀精算 アンケートフォーム`
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <StaticPageShell title="アンケート">
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        より良いアプリにするため、ご意見をお聞かせください。
        回答は任意です。お気軽にどうぞ。
      </p>

      <Card padding="lg">
        {sent ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-jade-surface border border-jade/20 mb-4">
              <span className="text-3xl">🙏</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">
              ありがとうございます！
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              メーラーからそのまま送信してください。
              <br />
              フィードバックは開発の参考にさせていただきます。
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSent(false)}
            >
              もう一度回答する
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Satisfaction */}
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-3 block">
                全体的な満足度
              </label>
              <div className="flex gap-2 justify-center">
                {SATISFACTION_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSatisfaction(level.value)}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                      satisfaction === level.value
                        ? "bg-jade text-text-on-jade shadow-sm scale-110"
                        : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                    }`}
                  >
                    <span className="text-xl">{level.emoji}</span>
                    <span className="text-[10px] font-medium">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite features */}
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-3 block">
                よく使う・気に入っている機能（複数選択可）
              </label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      favoriteFeatures.has(f)
                        ? "bg-jade text-text-on-jade shadow-sm"
                        : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Improvement */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">
                改善してほしい点
              </label>
              <textarea
                rows={3}
                placeholder="使いにくいところ、分かりにくいところなど"
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade-glow transition-all duration-150 text-[15px] resize-none leading-relaxed"
              />
            </div>

            {/* Feature request */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">
                追加してほしい機能やご要望
              </label>
              <textarea
                rows={3}
                placeholder="こんな機能があったら嬉しい、など"
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade-glow transition-all duration-150 text-[15px] resize-none leading-relaxed"
              />
            </div>

            <Button type="submit" size="lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              回答を送信
            </Button>
          </form>
        )}
      </Card>
    </StaticPageShell>
  );
}
