"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { PointBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { calcSettlement, generateLineText } from "@/domain/settlement";
import type { RuleSet, ChipEvent, Expense, SessionPlayer } from "@/domain/types";
import type { HanchanInput } from "@/domain/settlement";

type HanchanRow = Database["public"]["Tables"]["hanchan"]["Row"];
type RoundResultRow = Database["public"]["Tables"]["round_results"]["Row"];
type ChipEventRow = Database["public"]["Tables"]["chip_events"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseShareRow = Database["public"]["Tables"]["expense_shares"]["Row"];
type SessionPlayerRow = Database["public"]["Tables"]["session_players"]["Row"];

interface Props {
  sessionName: string;
  hanchanList: HanchanRow[];
  roundResults: RoundResultRow[];
  chipEvents: ChipEventRow[];
  expenses: ExpenseRow[];
  expenseShares: ExpenseShareRow[];
  players: SessionPlayerRow[];
  rules: RuleSet;
}

export function SettlementTab({
  sessionName,
  hanchanList,
  roundResults,
  chipEvents,
  expenses,
  expenseShares,
  players,
  rules,
}: Props) {
  const [copied, setCopied] = useState(false);

  const settlement = useMemo(() => {
    const hanchanInputs: HanchanInput[] = hanchanList.map((h) => ({
      hanchanId: h.id,
      seq: h.seq,
      scores: players.map((p) => ({
        playerId: p.id,
        seatOrder: p.seat_order,
        rawScore:
          roundResults.find(
            (r) => r.hanchan_id === h.id && r.player_id === p.id
          )?.raw_score ?? rules.startingPoints,
      })),
    }));

    const domainChipEvents: ChipEvent[] = chipEvents.map((ce) => ({
      id: ce.id,
      fromPlayerId: ce.from_player_id,
      toPlayerId: ce.to_player_id,
      quantity: ce.quantity,
    }));

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
    }));

    return calcSettlement(
      hanchanInputs,
      domainChipEvents,
      domainExpenses,
      domainPlayers,
      rules
    );
  }, [
    hanchanList,
    roundResults,
    chipEvents,
    expenses,
    expenseShares,
    players,
    rules,
  ]);

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
      // Fallback for older browsers
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
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 text-sm text-gold">
          未確定の半荘があります。合計点が不一致の半荘は精算に含まれません。
        </div>
      )}

      {/* Per-player breakdown */}
      <Card>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">
          収支内訳
        </h3>
        <div className="flex flex-col gap-3">
          {sorted.map((pb) => (
            <div
              key={pb.playerId}
              className="flex flex-col gap-1 pb-3 border-b border-border-primary last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{pb.displayName}</span>
                <PointBadge value={pb.totalYen} />
              </div>
              <div className="flex gap-4 text-xs text-text-muted">
                <span>
                  麻雀:{" "}
                  <span className="tabular-nums">
                    {pb.mahjongYen >= 0 ? "+" : ""}
                    {pb.mahjongYen.toLocaleString()}
                  </span>
                </span>
                {pb.chipYen !== 0 && (
                  <span>
                    チップ:{" "}
                    <span className="tabular-nums">
                      {pb.chipYen >= 0 ? "+" : ""}
                      {pb.chipYen.toLocaleString()}
                    </span>
                  </span>
                )}
                {pb.expenseYen !== 0 && (
                  <span>
                    立替:{" "}
                    <span className="tabular-nums">
                      {pb.expenseYen >= 0 ? "+" : ""}
                      {pb.expenseYen.toLocaleString()}
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
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            送金リスト
          </h3>
          <div className="flex flex-col gap-2">
            {settlement.transfers.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border-primary last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red font-medium">{t.fromName}</span>
                  <span className="text-text-muted">→</span>
                  <span className="text-jade font-medium">{t.toName}</span>
                </div>
                <span className="font-bold text-sm tabular-nums">
                  {t.amount.toLocaleString()}円
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* LINE Copy */}
      <Card>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">
          コピペ用テキスト
        </h3>
        <pre className="text-xs text-text-secondary whitespace-pre-wrap bg-bg-tertiary rounded-lg p-3 mb-3 font-mono">
          {lineText}
        </pre>
        <Button onClick={handleCopy} variant="secondary" size="sm">
          {copied ? "コピーしました!" : "クリップボードにコピー"}
        </Button>
      </Card>
    </div>
  );
}
