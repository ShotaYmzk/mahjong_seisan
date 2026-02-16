"use client";

import { useState } from "react";
import { createClient, logActivity } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge, PointBadge } from "@/components/ui/Badge";
import { calcHanchanResult } from "@/domain/hanchan";
import type { RuleSet, PlayerScore } from "@/domain/types";

type HanchanRow = Database["public"]["Tables"]["hanchan"]["Row"];
type RoundResultRow = Database["public"]["Tables"]["round_results"]["Row"];
type SessionPlayerRow = Database["public"]["Tables"]["session_players"]["Row"];

interface Props {
  sessionId: string;
  hanchanList: HanchanRow[];
  roundResults: RoundResultRow[];
  players: SessionPlayerRow[];
  rules: RuleSet;
  onRefetch: () => void;
}

export function HanchanTab({
  sessionId,
  hanchanList,
  roundResults,
  players,
  rules,
  onRefetch,
}: Props) {
  const supabase = createClient();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [editingHanchan, setEditingHanchan] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState("");

  const addHanchan = async () => {
    setAdding(true);
    try {
      const nextSeq =
        hanchanList.length > 0
          ? Math.max(...hanchanList.map((h) => h.seq)) + 1
          : 1;

      const { data: hanchanData, error } = await supabase
        .from("hanchan")
        .insert({ session_id: sessionId, seq: nextSeq })
        .select()
        .single();

      if (error) throw error;
      const hanchan = hanchanData as unknown as { id: string };

      const resultInserts = players.map((p) => ({
        hanchan_id: hanchan.id,
        session_id: sessionId,
        player_id: p.id,
        raw_score: rules.startingPoints,
      }));

      await supabase.from("round_results").insert(resultInserts as never);

      await logActivity(supabase, sessionId, user?.id, "hanchan_created", {
        seq: nextSeq,
      });

      onRefetch();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (hanchanId: string) => {
    const results = roundResults.filter((r) => r.hanchan_id === hanchanId);
    const scoreMap: Record<string, string> = {};
    for (const r of results) {
      scoreMap[r.player_id] = String(r.raw_score);
    }
    for (const p of players) {
      if (!scoreMap[p.id]) {
        scoreMap[p.id] = String(rules.startingPoints);
      }
    }
    setScores(scoreMap);
    setEditingHanchan(hanchanId);
    setConflictError("");
  };

  const saveScores = async (hanchanId: string) => {
    setSaving(true);
    setConflictError("");

    try {
      const hanchan = hanchanList.find((h) => h.id === hanchanId);
      if (!hanchan) return;

      const results = roundResults.filter((r) => r.hanchan_id === hanchanId);
      const sum = players.reduce(
        (acc, p) => acc + (parseInt(scores[p.id]) || 0),
        0
      );
      const isConfirmed = sum === rules.startingPoints * 4;

      for (const p of players) {
        const existing = results.find((r) => r.player_id === p.id);
        const newScore = parseInt(scores[p.id]) || 0;

        if (existing) {
          const { data, error } = await supabase
            .from("round_results")
            .update({
              raw_score: newScore,
              revision: existing.revision + 1,
            })
            .eq("id", existing.id)
            .eq("revision", existing.revision)
            .select();

          if (error) throw error;
          const rows = data as unknown as unknown[];
          if (!rows || rows.length === 0) {
            setConflictError(
              "他のユーザーが同時に更新しました。再読込してください。"
            );
            onRefetch();
            return;
          }
        } else {
          await supabase.from("round_results").insert({
            hanchan_id: hanchanId,
            session_id: sessionId,
            player_id: p.id,
            raw_score: newScore,
          });
        }
      }

      const { data: hData, error: hErr } = await supabase
        .from("hanchan")
        .update({
          is_confirmed: isConfirmed,
          revision: hanchan.revision + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", hanchanId)
        .eq("revision", hanchan.revision)
        .select();

      if (hErr) throw hErr;
      const hRows = hData as unknown as unknown[];
      if (!hRows || hRows.length === 0) {
        setConflictError(
          "他のユーザーが同時に更新しました。再読込してください。"
        );
        onRefetch();
        return;
      }

      await logActivity(supabase, sessionId, user?.id, "hanchan_updated", {
        seq: hanchan.seq,
        scores,
      });

      setEditingHanchan(null);
      onRefetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteHanchan = async (hanchanId: string) => {
    if (!confirm("この半荘を削除しますか？")) return;

    try {
      const hanchan = hanchanList.find((h) => h.id === hanchanId);
      await supabase.from("round_results").delete().eq("hanchan_id", hanchanId);
      await supabase.from("hanchan").delete().eq("id", hanchanId);

      await logActivity(supabase, sessionId, user?.id, "hanchan_deleted", {
        seq: hanchan?.seq ?? 0,
      });

      onRefetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">半荘一覧</h2>
        <Button size="sm" onClick={addHanchan} loading={adding}>
          + 半荘追加
        </Button>
      </div>

      {conflictError && (
        <div className="bg-red/10 border border-red/30 rounded-xl p-3 text-sm text-red">
          {conflictError}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 text-red"
            onClick={onRefetch}
          >
            再読込
          </Button>
        </div>
      )}

      {hanchanList.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-text-muted">まだ半荘がありません</p>
        </Card>
      ) : (
        hanchanList.map((h) => {
          const results = roundResults.filter((r) => r.hanchan_id === h.id);
          const isEditing = editingHanchan === h.id;

          const playerScores: PlayerScore[] = players.map((p) => ({
            playerId: p.id,
            seatOrder: p.seat_order,
            rawScore:
              results.find((r) => r.player_id === p.id)?.raw_score ??
              rules.startingPoints,
          }));
          const calcResult = calcHanchanResult(h.id, h.seq, playerScores, rules);

          return (
            <Card key={h.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-jade">
                    第{h.seq}半荘
                  </span>
                  <StatusBadge confirmed={calcResult.isConfirmed} />
                </div>
                <div className="flex gap-1">
                  {!isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(h.id)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHanchan(h.id)}
                        className="text-red"
                      >
                        削除
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-3">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary w-20 truncate">
                        {p.display_name}
                      </span>
                      <Input
                        type="number"
                        value={scores[p.id] ?? ""}
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-border-primary">
                    <span className="text-sm text-text-muted">
                      合計:{" "}
                      <span
                        className={`font-mono font-bold ${
                          players.reduce(
                            (acc, p) => acc + (parseInt(scores[p.id]) || 0),
                            0
                          ) ===
                          rules.startingPoints * 4
                            ? "text-jade"
                            : "text-red"
                        }`}
                      >
                        {players
                          .reduce(
                            (acc, p) => acc + (parseInt(scores[p.id]) || 0),
                            0
                          )
                          .toLocaleString()}
                      </span>
                      <span className="text-text-muted">
                        {" "}
                        / {(rules.startingPoints * 4).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveScores(h.id)}
                      loading={saving}
                    >
                      保存
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingHanchan(null);
                        setConflictError("");
                      }}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {calcResult.playerResults.map((pr) => {
                    const player = players.find((p) => p.id === pr.playerId);
                    return (
                      <div
                        key={pr.playerId}
                        className="flex items-center justify-between py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted w-4">
                            {pr.rank}位
                          </span>
                          <span className="text-sm">
                            {player?.display_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm tabular-nums text-text-secondary">
                            {pr.rawScore.toLocaleString()}点
                          </span>
                          {calcResult.isConfirmed && (
                            <PointBadge value={pr.yenRounded} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!calcResult.isConfirmed && (
                    <p className="text-xs text-gold mt-1">
                      合計点が不一致: {calcResult.scoreSum.toLocaleString()} /{" "}
                      {calcResult.expectedSum.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
