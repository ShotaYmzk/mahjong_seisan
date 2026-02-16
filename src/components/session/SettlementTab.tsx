"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { PointBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { calcSettlement, generateLineText } from "@/domain/settlement";
import type { RuleSet, Expense, SessionPlayer } from "@/domain/types";
import type { HanchanInput } from "@/domain/settlement";

type HanchanRow = Database["public"]["Tables"]["hanchan"]["Row"];
type RoundResultRow = Database["public"]["Tables"]["round_results"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseShareRow = Database["public"]["Tables"]["expense_shares"]["Row"];
type SessionPlayerRow = Database["public"]["Tables"]["session_players"]["Row"];

interface Props {
  sessionName: string;
  hanchanList: HanchanRow[];
  roundResults: RoundResultRow[];
  expenses: ExpenseRow[];
  expenseShares: ExpenseShareRow[];
  players: SessionPlayerRow[];
  rules: RuleSet;
}

export function SettlementTab({
  sessionName,
  hanchanList,
  roundResults,
  expenses,
  expenseShares,
  players,
  rules,
}: Props) {
  const [copied, setCopied] = useState(false);

  const settlement = useMemo(() => {
    const hanchanInputs: HanchanInput[] = hanchanList.map((h) => {
      const hResults = roundResults.filter((r) => r.hanchan_id === h.id);
      const playingPlayerIds = new Set(hResults.map((r) => r.player_id));
      const playingPlayers =
        playingPlayerIds.size > 0
          ? players.filter((p) => playingPlayerIds.has(p.id))
          : players;

      return {
        hanchanId: h.id,
        seq: h.seq,
        scores: playingPlayers.map((p) => ({
          playerId: p.id,
          seatOrder: p.seat_order,
          rawScore:
            hResults.find((r) => r.player_id === p.id)?.raw_score ??
            rules.startingPoints,
        })),
        tobiBusters: (() => {
          const map = new Map<string, string>();
          for (const r of hResults) {
            if (r.tobi_by_player_id) {
              map.set(r.player_id, r.tobi_by_player_id);
            }
          }
          return map.size > 0 ? map : undefined;
        })(),
      };
    });

    const domainExpenses: Expense[] = expenses.map((exp) => {
      const shares = expenseShares.filter((s) => s.expense_id === exp.id);
      return {
        id: exp.id,
        payerId: exp.payer_id,
        amount: exp.amount,
        description: exp.description,
        isAllMembers: exp.is_all_members,
        sharePlayerIds: shares.map((s) => s.player_id),
      };
    });

    const domainPlayers: SessionPlayer[] = players.map((p) => ({
      id: p.id,
      displayName: p.display_name,
      seatOrder: p.seat_order,
      userId: p.user_id,
      chipCount: p.chip_count,
    }));

    return calcSettlement(hanchanInputs, domainExpenses, domainPlayers, rules);
  }, [hanchanList, roundResults, expenses, expenseShares, players, rules]);

  const lineText = useMemo(
    () => generateLineText(settlement, sessionName),
    [settlement, sessionName]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lineText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = lineText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sorted = [...settlement.playerBalances].sort(
    (a, b) => b.totalYen - a.totalYen
  );

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">精算結果</h2>

      {settlement.hasUnconfirmed && (
        <div className="bg-gold-surface border border-gold/20 rounded-xl p-3 text-sm text-gold flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
          </svg>
          未確定の半荘があります。合計点が不一致の半荘は精算に含まれません。
        </div>
      )}

      {/* Per-player breakdown */}
      <Card>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
          収支内訳
        </h3>
        <div className="flex flex-col gap-4">
          {sorted.map((pb, i) => (
            <div
              key={pb.playerId}
              className={`flex flex-col gap-1.5 ${
                i < sorted.length - 1
                  ? "pb-4 border-b border-border-subtle"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-secondary">
                    {i + 1}
                  </div>
                  <span className="font-semibold text-text-primary">
                    {pb.displayName}
                  </span>
                </div>
                <PointBadge value={pb.totalYen} />
              </div>
              <div className="flex gap-4 text-xs text-text-muted flex-wrap ml-8">
                <span>
                  麻雀{" "}
                  <span className="tabular-nums text-text-secondary">
                    {pb.mahjongPoints >= 0 ? "+" : ""}
                    {pb.mahjongPoints}p
                  </span>
                  <span className="text-text-muted">
                    {" "}
                    ({pb.mahjongYen >= 0 ? "+" : ""}
                    {pb.mahjongYen.toLocaleString()}円)
                  </span>
                </span>
                {pb.chipYen !== 0 && (
                  <span>
                    チップ{" "}
                    <span className="tabular-nums text-text-secondary">
                      {pb.chipYen >= 0 ? "+" : ""}
                      {pb.chipYen.toLocaleString()}円
                    </span>
                  </span>
                )}
                {pb.expenseYen !== 0 && (
                  <span>
                    立替{" "}
                    <span className="tabular-nums text-text-secondary">
                      {pb.expenseYen >= 0 ? "+" : ""}
                      {pb.expenseYen.toLocaleString()}円
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Transfer list */}
      {settlement.transfers.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            送金リスト
          </h3>
          <div className="flex flex-col gap-3">
            {settlement.transfers.map((t, i) => (
              <div
                key={i}
                className={`flex items-center justify-between ${
                  i < settlement.transfers.length - 1
                    ? "pb-3 border-b border-border-subtle"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red font-medium">{t.fromName}</span>
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span className="text-jade font-medium">{t.toName}</span>
                </div>
                <span className="font-bold text-sm tabular-nums text-text-primary">
                  {t.amount.toLocaleString()}円
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* LINE Copy */}
      <Card>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          コピペ用テキスト
        </h3>
        <pre className="text-xs text-text-secondary whitespace-pre-wrap bg-bg-tertiary rounded-xl p-3 mb-4 font-mono leading-relaxed border border-border-subtle">
          {lineText}
        </pre>
        <Button onClick={handleCopy} variant="secondary" size="sm">
          {copied ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-jade" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              コピーしました
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              クリップボードにコピー
            </span>
          )}
        </Button>
      </Card>
    </div>
  );
}
