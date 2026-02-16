"use client";

import { useState, useEffect } from "react";
import { createClient, logActivity } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type SessionPlayerRow = Database["public"]["Tables"]["session_players"]["Row"];

interface Props {
  sessionId: string;
  players: SessionPlayerRow[];
  chipRate: number;
  startingChips: number;
  onRefetch: () => void;
}

export function ChipTab({
  sessionId,
  players,
  chipRate,
  startingChips,
  onRefetch,
}: Props) {
  const supabase = createClient();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [chipInputs, setChipInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const inputs: Record<string, string> = {};
    for (const p of players) {
      inputs[p.id] = p.chip_count != null ? String(p.chip_count) : "";
    }
    setChipInputs(inputs);
  }, [players]);

  const handleInputChange = (playerId: string, value: string) => {
    setChipInputs((prev) => ({ ...prev, [playerId]: value }));
  };

  const safeStartingChips = Number.isFinite(startingChips) ? startingChips : 0;
  const safeChipRate = Number.isFinite(chipRate) ? chipRate : 0;

  const getNetChips = (playerId: string): number | null => {
    const raw = chipInputs[playerId];
    if (raw === "" || raw === undefined) return null;
    const num = parseInt(raw);
    if (isNaN(num)) return null;
    return num - safeStartingChips;
  };

  const getNetYen = (playerId: string): number | null => {
    const net = getNetChips(playerId);
    if (net === null) return null;
    return net * safeChipRate;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      for (const p of players) {
        const raw = chipInputs[p.id];
        const chipCount = raw === "" ? null : parseInt(raw);

        if (raw !== "" && isNaN(chipCount as number)) {
          setError(`${p.display_name} の値が不正です`);
          setSaving(false);
          return;
        }

        const { error: updateErr } = await supabase
          .from("session_players")
          .update({ chip_count: chipCount })
          .eq("id", p.id);

        if (updateErr) throw updateErr;
      }

      await logActivity(supabase, sessionId, user?.id, "chip_updated", {
        chipInputs: Object.fromEntries(
          players.map((p) => [
            p.id,
            chipInputs[p.id] === "" ? null : parseInt(chipInputs[p.id]),
          ])
        ),
      });

      onRefetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("chip_count") || msg.includes("column")) {
        setError(
          "チップ機能にはDBマイグレーションが必要です（chip_count カラム未適用）"
        );
      } else {
        setError(msg || "エラーが発生しました");
      }
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = players.some((p) => {
    const saved = p.chip_count != null ? String(p.chip_count) : "";
    return (chipInputs[p.id] ?? "") !== saved;
  });

  const totalNet = players.reduce((sum, p) => {
    const net = getNetChips(p.id);
    return sum + (net ?? 0);
  }, 0);

  const allEntered = players.every(
    (p) => chipInputs[p.id] !== "" && chipInputs[p.id] !== undefined
  );

  const enteredCount = players.filter(
    (p) => chipInputs[p.id] !== "" && chipInputs[p.id] !== undefined
  ).length;
  const someEntered = enteredCount > 0;
  const expectedTotal = safeStartingChips * players.length;
  const actualTotal = players.reduce((sum, p) => {
    const raw = chipInputs[p.id];
    if (raw === "" || raw === undefined) return sum;
    const num = parseInt(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">チップ</h2>
        <span className="text-xs text-text-muted bg-bg-secondary px-2.5 py-1 rounded-lg border border-border-subtle tabular-nums">
          1枚 = {safeChipRate.toLocaleString()}円
        </span>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-jade-surface flex items-center justify-center shrink-0">
            <span className="text-base">🪙</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              終了時チップ枚数
            </p>
          <p className="text-xs text-text-muted">
            開始 {safeStartingChips}枚からの増減を自動計算
          </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {players.map((p) => {
            const net = getNetChips(p.id);
            const yen = getNetYen(p.id);

            return (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16 truncate text-text-primary">
                  {p.display_name}
                </span>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder={String(safeStartingChips)}
                    value={chipInputs[p.id] ?? ""}
                    onChange={(e) => handleInputChange(p.id, e.target.value)}
                  />
                </div>
                <div className="w-24 text-right text-xs tabular-nums shrink-0">
                  {net !== null ? (
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`font-semibold ${
                          net > 0
                            ? "text-jade"
                            : net < 0
                            ? "text-red"
                            : "text-text-muted"
                        }`}
                      >
                        {net > 0 ? "+" : ""}
                        {net}枚
                      </span>
                      <span className="text-text-muted">
                        {yen !== null && yen >= 0 ? "+" : ""}
                        {yen?.toLocaleString()}円
                      </span>
                    </div>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Balance check */}
        {someEntered && (
          <div
            className={`mt-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              allEntered && totalNet === 0
                ? "bg-jade-surface border border-jade/20 text-jade"
                : allEntered
                ? "bg-red-surface border border-red/20 text-red"
                : "bg-bg-tertiary border border-border-subtle text-text-secondary"
            }`}
          >
            {allEntered ? (
              totalNet === 0 ? (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    合計 {expectedTotal}枚 一致（開始 {expectedTotal}枚 = 終了 {actualTotal}枚）
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    合計が不一致！ 開始 {expectedTotal}枚 → 終了 {actualTotal}枚（差: {totalNet > 0 ? "+" : ""}{totalNet}枚）
                  </span>
                </>
              )
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  {enteredCount}/{players.length}人 入力済み（残り{players.length - enteredCount}人）
                </span>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red bg-red-surface border border-red/20 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-5">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            size="md"
          >
            保存
          </Button>
        </div>
      </Card>
    </div>
  );
}
