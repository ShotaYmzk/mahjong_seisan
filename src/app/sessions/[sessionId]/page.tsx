"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionData } from "@/hooks/useSessionData";
import { useRealtime } from "@/hooks/useRealtime";
import { TabGroup } from "@/components/ui/TabGroup";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-jade-surface border border-jade/20 mb-4">
            <span className="text-3xl">🀄</span>
          </div>
          <p className="text-sm text-text-secondary">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-surface border border-red/20 mb-4">
            <svg className="w-7 h-7 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-text-secondary mb-3">セットが見つかりません</p>
          <button
            onClick={() => router.push("/")}
            className="text-jade text-sm font-medium hover:underline underline-offset-4"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const rules: RuleSet = ruleSet
    ? {
        playerCount: (ruleSet.player_count === 3 ? 3 : 4) as 3 | 4,
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
        startingChips: ruleSet.starting_chips ?? 0,
        tobiBonusEnabled: ruleSet.tobi_bonus_enabled,
        tobiBonusPoints: ruleSet.tobi_bonus_points,
        tobiBonusChips: ruleSet.tobi_bonus_chips,
        tobiReceiverType: ruleSet.tobi_receiver_type as "top" | "manual",
      }
    : {
        playerCount: 4 as const,
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
        startingChips: 0,
        tobiBonusEnabled: false,
        tobiBonusPoints: 0,
        tobiBonusChips: 0,
        tobiReceiverType: "top" as const,
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
          players={players}
          chipRate={rules.chipRate}
          startingChips={rules.startingChips}
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
        <RuleTab sessionId={sessionId} ruleSet={ruleSet} playerCount={rules.playerCount} onRefetch={refetch} />
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
      <div className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border-primary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <button
              onClick={() => {
                if (session.room_id) {
                  router.push(`/rooms/${session.room_id}`);
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-jade transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              部屋に戻る
            </button>
            <h1 className="text-lg font-bold truncate mt-0.5">
              {session.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <div className="hidden sm:flex items-center text-xs text-text-muted bg-bg-secondary px-2.5 py-1 rounded-lg border border-border-subtle">
              {players.map((p) => p.display_name).join(" / ")}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Activity Log Preview */}
      {activityLog.length > 0 && (
        <details className="mx-4 mt-3">
          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary transition-colors select-none">
            更新履歴（最新{Math.min(activityLog.length, 5)}件）
          </summary>
          <div className="mt-2 bg-bg-secondary rounded-xl p-3 text-xs text-text-muted space-y-1.5 max-h-32 overflow-y-auto border border-border-subtle">
            {activityLog.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-2">
                <span className="text-text-muted tabular-nums shrink-0">
                  {new Date(log.created_at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-text-secondary">
                  {formatAction(log.action)}
                </span>
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
    chip_updated: "チップを更新",
    expense_created: "立替を追加",
    expense_deleted: "立替を削除",
    rule_updated: "ルールを変更",
  };
  return map[action] ?? action;
}
