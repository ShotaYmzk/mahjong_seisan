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
  const [tobiBusters, setTobiBusters] = useState<Record<string, string>>({});
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );

  const pc = rules.playerCount;
  const needsPlayerSelect = players.length > pc;

  /* ---------- Smart default for player rotation ---------- */
  const getDefaultSelected = (): Set<string> => {
    if (players.length <= pc) {
      return new Set(players.map((p) => p.id));
    }

    const lastHanchan = hanchanList[hanchanList.length - 1];
    if (!lastHanchan) {
      return new Set(players.slice(0, pc).map((p) => p.id));
    }

    const lastResults = roundResults.filter(
      (r) => r.hanchan_id === lastHanchan.id
    );
    const lastPlayingIds = new Set(lastResults.map((r) => r.player_id));
    const satOutLast = players.filter((p) => !lastPlayingIds.has(p.id));
    const sitOutCount = players.length - pc;

    if (satOutLast.length === sitOutCount) {
      const satOutIndices = satOutLast.map((p) =>
        players.findIndex((pl) => pl.id === p.id)
      );
      const nextSitOutIndices = satOutIndices.map(
        (idx) => (idx + sitOutCount) % players.length
      );
      return new Set(
        players
          .filter((_, i) => !nextSitOutIndices.includes(i))
          .map((p) => p.id)
      );
    }

    return new Set(players.slice(0, pc).map((p) => p.id));
  };

  /* ---------- Get playing players for a hanchan ---------- */
  const getHanchanPlayers = (hanchanId: string): SessionPlayerRow[] => {
    const resultPlayerIds = new Set(
      roundResults
        .filter((r) => r.hanchan_id === hanchanId)
        .map((r) => r.player_id)
    );
    if (resultPlayerIds.size === 0) return players;
    return players.filter((p) => resultPlayerIds.has(p.id));
  };

  const getSittingOut = (hanchanId: string): SessionPlayerRow[] => {
    const resultPlayerIds = new Set(
      roundResults
        .filter((r) => r.hanchan_id === hanchanId)
        .map((r) => r.player_id)
    );
    if (resultPlayerIds.size === 0) return [];
    return players.filter((p) => !resultPlayerIds.has(p.id));
  };

  /* ---------- Add hanchan ---------- */
  const handleAddClick = () => {
    if (needsPlayerSelect) {
      setSelectedPlayerIds(getDefaultSelected());
      setShowPlayerSelect(true);
    } else {
      addHanchan(players.map((p) => p.id));
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const confirmPlayerSelection = () => {
    if (selectedPlayerIds.size !== pc) return;
    setShowPlayerSelect(false);
    addHanchan(Array.from(selectedPlayerIds));
  };

  const addHanchan = async (selectedIds: string[]) => {
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

      const selectedPlayers = players.filter((p) =>
        selectedIds.includes(p.id)
      );
      const resultInserts = selectedPlayers.map((p) => ({
        hanchan_id: hanchan.id,
        session_id: sessionId,
        player_id: p.id,
        raw_score: rules.startingPoints,
      }));

      await supabase.from("round_results").insert(resultInserts as never);

      await logActivity(supabase, sessionId, user?.id, "hanchan_created", {
        seq: nextSeq,
        playerCount: selectedPlayers.length,
      });

      const scoreMap: Record<string, string> = {};
      for (const p of selectedPlayers) {
        scoreMap[p.id] = "";
      }
      setScores(scoreMap);
      setTobiBusters({});
      setEditingHanchan(hanchan.id);

      onRefetch();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  /* ---------- Edit ---------- */
  const startEdit = (hanchanId: string) => {
    const results = roundResults.filter((r) => r.hanchan_id === hanchanId);
    const playingIds = new Set(results.map((r) => r.player_id));
    const scoreMap: Record<string, string> = {};
    const tobiMap: Record<string, string> = {};

    for (const r of results) {
      scoreMap[r.player_id] = String(r.raw_score);
      if (r.tobi_by_player_id) {
        tobiMap[r.player_id] = r.tobi_by_player_id;
      }
    }
    for (const p of players) {
      if (playingIds.has(p.id) && !scoreMap[p.id]) {
        scoreMap[p.id] = String(rules.startingPoints);
      }
    }
    setScores(scoreMap);
    setTobiBusters(tobiMap);
    setEditingHanchan(hanchanId);
    setConflictError("");
  };

  /* ---------- Save ---------- */
  const saveScores = async (hanchanId: string) => {
    setSaving(true);
    setConflictError("");

    try {
      const hanchan = hanchanList.find((h) => h.id === hanchanId);
      if (!hanchan) return;

      const results = roundResults.filter((r) => r.hanchan_id === hanchanId);
      const hanchanPlayers = getHanchanPlayers(hanchanId);

      const editPlayers =
        hanchanPlayers.length > 0
          ? hanchanPlayers
          : players.filter((p) => p.id in scores);

      const sum = editPlayers.reduce(
        (acc, p) => acc + (parseInt(scores[p.id]) || 0),
        0
      );
      const isConfirmed = sum === rules.startingPoints * pc;

      for (const p of editPlayers) {
        const existing = results.find((r) => r.player_id === p.id);
        const newScore = parseInt(scores[p.id]) || 0;

        if (existing) {
          const { data, error } = await supabase
            .from("round_results")
            .update({
              raw_score: newScore,
              tobi_by_player_id: tobiBusters[p.id] || null,
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

  /* ---------- Delete ---------- */
  const deleteHanchan = async (hanchanId: string) => {
    if (!confirm("この半荘を削除しますか？")) return;

    try {
      const hanchan = hanchanList.find((h) => h.id === hanchanId);
      await supabase
        .from("round_results")
        .delete()
        .eq("hanchan_id", hanchanId);
      await supabase.from("hanchan").delete().eq("id", hanchanId);

      await logActivity(supabase, sessionId, user?.id, "hanchan_deleted", {
        seq: hanchan?.seq ?? 0,
      });

      onRefetch();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- Render ---------- */

  const editingPlayers = players.filter(
    (p) => scores[p.id] !== undefined
  );

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">半荘一覧</h2>
        <Button
          size="sm"
          onClick={handleAddClick}
          loading={adding}
          disabled={showPlayerSelect}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          半荘追加
        </Button>
      </div>

      {conflictError && (
        <div className="bg-red-surface border border-red/20 rounded-xl p-3 text-sm text-red flex items-center justify-between">
          <span>{conflictError}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-red"
            onClick={onRefetch}
          >
            再読込
          </Button>
        </div>
      )}

      {/* Player selection for 5+ player sessions */}
      {showPlayerSelect && (
        <Card className="border-2 border-jade/30">
          <h3 className="text-sm font-bold text-text-primary mb-1">
            対局メンバーを選択
          </h3>
          <p className="text-xs text-text-muted mb-3">
            {pc}人を選んでください（残りは抜け番）
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {players.map((p) => {
              const isSelected = selectedPlayerIds.has(p.id);
              const lastHanchan = hanchanList[hanchanList.length - 1];
              const wasSittingOut =
                lastHanchan &&
                !roundResults.some(
                  (r) =>
                    r.hanchan_id === lastHanchan.id && r.player_id === p.id
                );
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlayerSelection(p.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isSelected
                      ? "bg-jade text-text-on-jade shadow-sm"
                      : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {p.display_name}
                    {wasSittingOut && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-white/20"
                            : "bg-gold-surface text-gold"
                        }`}
                      >
                        前回抜け
                      </span>
                    )}
                  </span>
                  <span className="text-xs">
                    {isSelected ? "対局" : "抜け番"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                selectedPlayerIds.size === pc ? "text-jade" : "text-red"
              }`}
            >
              {selectedPlayerIds.size}/{pc}人 選択中
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPlayerSelect(false)}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={confirmPlayerSelection}
                disabled={selectedPlayerIds.size !== pc}
                loading={adding}
              >
                この{pc}人で開始
              </Button>
            </div>
          </div>
        </Card>
      )}

      {hanchanList.length === 0 && !showPlayerSelect ? (
        <Card className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-bg-tertiary mb-3">
            <span className="text-2xl">🀄</span>
          </div>
          <p className="text-text-muted text-sm">まだ半荘がありません</p>
          <p className="text-text-muted text-xs mt-1">
            「半荘追加」ボタンから対局を記録しましょう
          </p>
        </Card>
      ) : (
        hanchanList.map((h) => {
          const results = roundResults.filter((r) => r.hanchan_id === h.id);
          const isEditing = editingHanchan === h.id;
          const sittingOut = getSittingOut(h.id);

          const hanchanPlayerList = getHanchanPlayers(h.id);
          const playerScores: PlayerScore[] = hanchanPlayerList.map((p) => ({
            playerId: p.id,
            seatOrder: p.seat_order,
            rawScore:
              results.find((r) => r.player_id === p.id)?.raw_score ??
              rules.startingPoints,
          }));

          const tobiMap = new Map<string, string>();
          for (const r of results) {
            if (r.tobi_by_player_id) {
              tobiMap.set(r.player_id, r.tobi_by_player_id);
            }
          }

          const calcResult = calcHanchanResult(
            h.id,
            h.seq,
            playerScores,
            rules,
            tobiMap
          );

          const currentEditPlayers = isEditing ? editingPlayers : [];
          const editSum = isEditing
            ? currentEditPlayers.reduce(
                (acc, p) => acc + (parseInt(scores[p.id]) || 0),
                0
              )
            : 0;

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
                  {currentEditPlayers.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary w-16 truncate font-medium">
                        {p.display_name}
                      </span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={scores[p.id] ?? ""}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [p.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}

                  {/* Tobi buster selection */}
                  {rules.tobiBonusEnabled &&
                    rules.tobiReceiverType === "manual" &&
                    currentEditPlayers
                      .filter((p) => {
                        const raw = scores[p.id];
                        if (!raw || raw.trim() === "") return false;
                        const score = parseInt(raw);
                        return !isNaN(score) && score <= 0;
                      })
                      .map((busted) => (
                        <div
                          key={`tobi-${busted.id}`}
                          className="flex items-center gap-2 bg-red-surface border border-red/20 rounded-xl px-3 py-2.5"
                        >
                          <span className="text-xs text-red font-medium shrink-0">
                            {busted.display_name} を飛ばした人:
                          </span>
                          <select
                            value={tobiBusters[busted.id] ?? ""}
                            onChange={(e) =>
                              setTobiBusters((prev) => ({
                                ...prev,
                                [busted.id]: e.target.value,
                              }))
                            }
                            className="flex-1 bg-bg-tertiary border border-border-primary rounded-lg px-2.5 py-1.5 text-sm text-text-primary"
                          >
                            <option value="">選択してください</option>
                            {currentEditPlayers
                              .filter((p) => p.id !== busted.id)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.display_name}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}

                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <span className="text-sm text-text-muted">
                      合計:{" "}
                      <span
                        className={`font-mono font-bold ${
                          editSum === rules.startingPoints * pc
                            ? "text-jade"
                            : "text-red"
                        }`}
                      >
                        {editSum.toLocaleString()}
                      </span>
                      <span className="text-text-muted">
                        {" "}
                        / {(rules.startingPoints * pc).toLocaleString()}
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
                <div className="flex flex-col gap-0.5">
                  {calcResult.playerResults.map((pr) => {
                    const player = players.find(
                      (p) => p.id === pr.playerId
                    );
                    return (
                      <div
                        key={pr.playerId}
                        className="flex items-center justify-between py-1.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold text-text-muted w-5 text-center tabular-nums">
                            {pr.rank}
                          </span>
                          <span className="text-sm text-text-primary">
                            {player?.display_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm tabular-nums text-text-secondary">
                            {pr.rawScore.toLocaleString()}
                          </span>
                          {pr.isTobi && (
                            <span className="text-[10px] font-bold text-red bg-red-surface border border-red/20 px-1.5 py-0.5 rounded-md">
                              飛
                            </span>
                          )}
                          {(pr.tobiBonusPoints > 0 ||
                            calcResult.tobiEvents.some(
                              (e) => e.receiverPlayerId === pr.playerId
                            )) && (
                            <span className="text-[10px] font-bold text-jade bg-jade-surface border border-jade/20 px-1.5 py-0.5 rounded-md">
                              飛び賞
                            </span>
                          )}
                          {calcResult.isConfirmed && (
                            <PointBadge value={pr.points} suffix="p" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Sitting out players */}
                  {sittingOut.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border-subtle">
                      <span className="text-[10px] font-medium text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                        抜け番
                      </span>
                      <span className="text-xs text-text-muted">
                        {sittingOut.map((p) => p.display_name).join(", ")}
                      </span>
                    </div>
                  )}

                  {!calcResult.isConfirmed && (
                    <p className="text-xs text-gold mt-2 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z"
                          clipRule="evenodd"
                        />
                      </svg>
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
