"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionData } from "@/hooks/useSessionData";
import { useRealtime } from "@/hooks/useRealtime";
import { TabGroup } from "@/components/ui/TabGroup";
import { HanchanTab } from "@/components/session/HanchanTab";
import { ChipTab } from "@/components/session/ChipTab";
import { ExpenseTab } from "@/components/session/ExpenseTab";
import { RuleTab } from "@/components/session/RuleTab";
import { SettlementTab } from "@/components/session/SettlementTab";
import type { RuleSet } from "@/domain/types";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { loading: authLoading } = useAuth();

  const {
    session,
    players,
    ruleSet,
    hanchanList,
    roundResults,
    chipEvents,
    expenses,
    expenseShares,
    activityLog,
    loading,
    refetch,
  } = useSessionData(sessionId);

  const handleRealtimeUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  useRealtime(sessionId, handleRealtimeUpdate);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-3">🀄</div>
          <p className="text-text-secondary">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary">セッションが見つかりません</p>
          <button
            onClick={() => router.push("/")}
            className="text-jade text-sm mt-2 hover:underline"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const rules: RuleSet = ruleSet
    ? {
        startingPoints: ruleSet.starting_points,
        returnPoints: ruleSet.return_points,
        uma1: ruleSet.uma_1,
        uma2: ruleSet.uma_2,
        uma3: ruleSet.uma_3,
        uma4: ruleSet.uma_4,
        okaType: ruleSet.oka_type as "winner_take_all" | "none",
        rate: ruleSet.rate,
        roundingUnit: ruleSet.rounding_unit,
        chipRate: ruleSet.chip_rate,
      }
    : {
        startingPoints: 25000,
        returnPoints: 30000,
        uma1: 10,
        uma2: 5,
        uma3: -5,
        uma4: -10,
        okaType: "winner_take_all" as const,
        rate: 100,
        roundingUnit: 100,
        chipRate: 500,
      };

  const tabs = [
    {
      id: "hanchan",
      label: "半荘",
      icon: "🀄",
      content: (
        <HanchanTab
          sessionId={sessionId}
          hanchanList={hanchanList}
          roundResults={roundResults}
          players={players}
          rules={rules}
          onRefetch={refetch}
        />
      ),
    },
    {
      id: "chips",
      label: "チップ",
      icon: "🪙",
      content: (
        <ChipTab
          sessionId={sessionId}
          chipEvents={chipEvents}
          players={players}
          chipRate={rules.chipRate}
          onRefetch={refetch}
        />
      ),
    },
    {
      id: "expenses",
      label: "立替",
      icon: "🧾",
      content: (
        <ExpenseTab
          sessionId={sessionId}
          expenses={expenses}
          expenseShares={expenseShares}
          players={players}
          onRefetch={refetch}
        />
      ),
    },
    {
      id: "rules",
      label: "ルール",
      icon: "⚙️",
      content: (
        <RuleTab
          sessionId={sessionId}
          ruleSet={ruleSet}
          onRefetch={refetch}
        />
      ),
    },
    {
      id: "settlement",
      label: "精算",
      icon: "💰",
      content: (
        <SettlementTab
          sessionName={session.name}
          hanchanList={hanchanList}
          roundResults={roundResults}
          chipEvents={chipEvents}
          expenses={expenses}
          expenseShares={expenseShares}
          players={players}
          rules={rules}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur-sm border-b border-border-primary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <button
              onClick={() => {
                if (session.room_id) {
                  router.push(`/rooms/${session.room_id}`);
                }
              }}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              ← 部屋に戻る
            </button>
            <h1 className="text-lg font-bold truncate">{session.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {players.map((p) => p.display_name).join(" / ")}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log Preview - only show if there are entries */}
      {activityLog.length > 0 && (
        <details className="mx-4 mt-2">
          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
            更新履歴（最新{Math.min(activityLog.length, 5)}件）
          </summary>
          <div className="mt-1 bg-bg-secondary rounded-lg p-2 text-xs text-text-muted space-y-1 max-h-32 overflow-y-auto">
            {activityLog.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-2">
                <span className="text-text-muted">
                  {new Date(log.created_at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>{formatAction(log.action)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Tab content */}
      <TabGroup tabs={tabs} defaultTab="hanchan" />
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    hanchan_created: "半荘を追加",
    hanchan_updated: "半荘を更新",
    hanchan_deleted: "半荘を削除",
    chip_created: "チップを追加",
    chip_deleted: "チップを削除",
    expense_created: "立替を追加",
    expense_deleted: "立替を削除",
    rule_updated: "ルールを変更",
  };
  return map[action] ?? action;
}
