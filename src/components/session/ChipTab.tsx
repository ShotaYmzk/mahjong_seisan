"use client";

import { useState } from "react";
import { createClient, logActivity } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type ChipEventRow = Database["public"]["Tables"]["chip_events"]["Row"];
type SessionPlayerRow = Database["public"]["Tables"]["session_players"]["Row"];

interface Props {
  sessionId: string;
  chipEvents: ChipEventRow[];
  players: SessionPlayerRow[];
  chipRate: number;
  onRefetch: () => void;
}

export function ChipTab({
  sessionId,
  chipEvents,
  players,
  chipRate,
  onRefetch,
}: Props) {
  const supabase = createClient();
  const { user } = useAuth();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const playerOptions = players.map((p) => ({
    value: p.id,
    label: p.display_name,
  }));

  const addChipEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!fromId || !toId || !qty || qty <= 0) {
      setError("全項目を正しく入力してください");
      return;
    }
    if (fromId === toId) {
      setError("送る人と受け取る人は異なる必要があります");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const { error: insertErr } = await supabase.from("chip_events").insert({
        session_id: sessionId,
        from_player_id: fromId,
        to_player_id: toId,
        quantity: qty,
      });

      if (insertErr) throw insertErr;

      await logActivity(supabase, sessionId, user?.id, "chip_created", {
        from: fromId,
        to: toId,
        quantity: qty,
      });

      setFromId("");
      setToId("");
      setQuantity("");
      onRefetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAdding(false);
    }
  };

  const deleteChipEvent = async (id: string) => {
    try {
      await supabase.from("chip_events").delete().eq("id", id);
      await logActivity(supabase, sessionId, user?.id, "chip_deleted", {
        chip_event_id: id,
      });
      onRefetch();
    } catch (err) {
      console.error(err);
    }
  };

  const getName = (id: string) =>
    players.find((p) => p.id === id)?.display_name ?? "?";

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">チップ</h2>

      {/* Add form */}
      <Card>
        <form onSubmit={addChipEvent} className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text-secondary">
            チップ移動を追加（1枚 = {chipRate.toLocaleString()}円）
          </p>
          <Select
            label="渡す人"
            options={playerOptions}
            placeholder="選択..."
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          />
          <Select
            label="受け取る人"
            options={playerOptions}
            placeholder="選択..."
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          />
          <Input
            label="枚数"
            type="number"
            placeholder="3"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <Button type="submit" loading={adding} size="sm">
            追加
          </Button>
        </form>
      </Card>

      {/* Event list */}
      {chipEvents.length === 0 ? (
        <Card className="text-center py-6">
          <p className="text-text-muted text-sm">チップの記録はまだありません</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {chipEvents.map((ce) => (
            <Card key={ce.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {getName(ce.from_player_id)}
                  </span>
                  <span className="text-text-muted">→</span>
                  <span className="font-medium">
                    {getName(ce.to_player_id)}
                  </span>
                  <span className="text-jade font-bold">
                    {ce.quantity}枚
                  </span>
                  <span className="text-text-muted text-xs">
                    ({(ce.quantity * chipRate).toLocaleString()}円)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteChipEvent(ce.id)}
                  className="text-red text-xs"
                >
                  削除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
