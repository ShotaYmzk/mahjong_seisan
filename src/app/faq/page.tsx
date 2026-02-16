"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticPageShell } from "@/components/StaticPageShell";

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_SECTIONS: { title: string; items: FAQItem[] }[] = [
  {
    title: "基本的な使い方",
    items: [
      {
        q: "麻雀精算とはどんなアプリですか？",
        a: "麻雀の対局結果を記録し、ウマ・オカを含む精算をリアルタイムで共同編集できるWebアプリです。4人麻雀と3人麻雀（サンマ）の両方に対応しています。",
      },
      {
        q: "アカウント登録は必要ですか？",
        a: "いいえ。アプリにアクセスすると匿名アカウントが自動的に作成されるため、面倒な登録手続きは不要です。",
      },
      {
        q: "「グループ」と「セット」の違いは何ですか？",
        a: "「グループ」は一緒に麻雀を打つメンバーの集まりです。「セット」はその日の対局（半荘を複数回まとめたもの）を表します。1つのグループ内に複数のセットを作成できます。",
      },
      {
        q: "友達を招待するにはどうすればいいですか？",
        a: "グループページの「リンク発行」ボタンから招待リンクを作成し、LINEなどで共有してください。リンクは24時間有効です。",
      },
    ],
  },
  {
    title: "対局の記録",
    items: [
      {
        q: "半荘の点数を入力するとき、合計が合わないと表示されます",
        a: "4人麻雀の場合は合計が配給原点×4（デフォルト100,000点）、3人麻雀の場合は配給原点×3（デフォルト105,000点）になる必要があります。赤い表示が出ている場合は入力を確認してください。合計が不一致の半荘は精算に反映されません。",
      },
      {
        q: "5人以上で打つ場合はどうすればいいですか？",
        a: "セット作成時に5人以上の名前を入力してください。半荘ごとに対局する4人（三麻の場合は3人）を選択し、残りは抜け番になります。自動的にローテーションが提案されます。",
      },
      {
        q: "三人麻雀（サンマ）に対応していますか？",
        a: "はい。セット作成時に「三人麻雀」モードを選択できます。配給原点35,000点・返し点40,000点のデフォルト設定で、三麻専用のウマプリセットも用意されています。",
      },
      {
        q: "飛び賞（トビ賞）は設定できますか？",
        a: "はい。「ルール」タブで飛び賞のON/OFF、ポイント額、チップ枚数、受取人（トップ or 手動選択）を設定できます。",
      },
    ],
  },
  {
    title: "精算・ルール",
    items: [
      {
        q: "ウマの設定を変更するには？",
        a: "セットの「ルール」タブでプリセット（ゴットー、ワンツーなど）を選択するか、カスタムで自由に設定できます。",
      },
      {
        q: "チップの精算はどうなりますか？",
        a: "「チップ」タブで各プレイヤーの終了時チップ枚数を入力すると、チップ単価に基づいて精算に反映されます。",
      },
      {
        q: "立替（割り勘）機能とは何ですか？",
        a: "雀荘代や飲み物代など、誰かが立て替えた費用を精算に含めることができます。全員均等割りや、特定のメンバーだけの割り勘にも対応しています。",
      },
      {
        q: "精算結果をLINEで共有できますか？",
        a: "はい。「精算」タブの「クリップボードにコピー」ボタンで、テキスト形式の精算結果をコピーしてLINEなどに貼り付けられます。",
      },
    ],
  },
  {
    title: "トラブルシューティング",
    items: [
      {
        q: "入力した内容が消えてしまいました",
        a: "データはリアルタイムでサーバーに保存されています。「保存」ボタンを押す前にページを離れると、未保存の入力は失われます。また、同時編集時に競合が発生した場合は「再読込」ボタンで最新データを取得してください。",
      },
      {
        q: "他のメンバーの変更がリアルタイムで反映されません",
        a: "通常はリアルタイムで反映されますが、ネットワーク状態によっては遅延する場合があります。ページを再読込すると最新のデータが表示されます。",
      },
      {
        q: "バグを見つけた場合はどうすればいいですか？",
        a: "「お問い合わせ」ページからバグ報告をお願いします。どんな操作をしたときにエラーが出たか、スクリーンショットがあると助かります。",
      },
    ],
  },
];

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border-primary rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-bg-secondary transition-colors"
      >
        <span className="text-sm font-medium text-text-primary leading-snug">
          {item.q}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-sm text-text-secondary leading-relaxed">
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <StaticPageShell title="よくある質問">
      <div className="flex flex-col gap-8">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
              {section.title}
            </h2>
            <div className="flex flex-col gap-2">
              {section.items.map((item, i) => (
                <AccordionItem key={i} item={item} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-bg-secondary rounded-2xl p-5 border border-border-subtle text-center">
          <p className="text-sm text-text-secondary mb-3">
            解決しない場合は
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-jade hover:text-jade-dim transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            お問い合わせ
          </Link>
        </div>
      </div>
    </StaticPageShell>
  );
}
