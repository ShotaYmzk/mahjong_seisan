"use client";

import { useState } from "react";
import { createClient, logActivity } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseShareRow = Database["public"]["Tables"]["expense_shares"]["Row"];
type SessionPlayerRow = Database["public"]["Tables"]["session_players"]["Row"];

interface Props {
  sessionId: string;
  expenses: ExpenseRow[];
  expenseShares: ExpenseShareRow[];
  players: SessionPlayerRow[];
  onRefetch: () => void;
}

export function ExpenseTab({
  sessionId,
  expenses,
  expenseShares,
  players,
  onRefetch,
}: Props) {
  const supabase = createClient();
  const { user } = useAuth();
  const [payerId, setPayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isAllMembers, setIsAllMembers] = useState(true);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const playerOptions = players.map((p) => ({
    value: p.id,
    label: p.display_name,
  }));

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!payerId || !amt || amt <= 0) {
      setError("支払者と金額を入力してください");
      return;
    }
    if (!isAllMembers && selectedPlayerIds.length === 0) {
      setError("割り勘の対象者を選択してください");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const { data: expenseData, error: insertErr } = await supabase
        .from("expenses")
        .insert({
          session_id: sessionId,
          payer_id: payerId,
          amount: amt,
          description: description.trim() || null,
          is_all_members: isAllMembers,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      const expense = expenseData as unknown as { id: string };

      const targetIds = isAllMembers
        ? players.map((p) => p.id)
        : selectedPlayerIds;

      const shareInserts = targetIds.map((pid) => ({
        expense_id: expense.id,
        player_id: pid,
        session_id: sessionId,
      }));

      const { error: shareErr } = await supabase
        .from("expense_shares")
        .insert(shareInserts as never);

      if (shareErr) throw shareErr;

      await logActivity(supabase, sessionId, user?.id, "expense_created", {
        amount: amt,
        description: description.trim(),
        payer: payerId,
      });

      setPayerId("");
      setAmount("");
      setDescription("");
      setIsAllMembers(true);
      setSelectedPlayerIds([]);
      onRefetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAdding(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await supabase.from("expense_shares").delete().eq("expense_id", id);
      await supabase.from("expenses").delete().eq("id", id);
      await logActivity(supabase, sessionId, user?.id, "expense_deleted", {
        expense_id: id,
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
      <h2 className="text-lg font-bold">立替・経費</h2>

      {/* Add form */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-surface flex items-center justify-center shrink-0">
            <span className="text-base">🧾</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              立替を追加
            </p>
          </div>
        </div>

        <form onSubmit={addExpense} className="flex flex-col gap-3">
          <Select
            label="支払者"
            options={playerOptions}
            placeholder="選択..."
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
          />
          <Input
            label="金額（円）"
            type="number"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="内容"
            placeholder="ジュース代"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="text-[13px] font-medium text-text-secondary mb-2 block">
              割り勘対象
            </label>
            <div className="flex gap-2 mb-2">
              {[
                { value: true, label: "全員" },
                { value: false, label: "指定" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setIsAllMembers(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isAllMembers === opt.value
                      ? "bg-jade text-text-on-jade shadow-sm"
                      : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!isAllMembers && (
              <div className="flex flex-wrap gap-2 mt-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      selectedPlayerIds.includes(p.id)
                        ? "bg-jade-surface text-jade border border-jade/30"
                        : "bg-bg-tertiary text-text-muted border border-border-primary hover:border-border-primary"
                    }`}
                  >
                    {p.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red bg-red-surface border border-red/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" loading={adding} size="md">
            追加
          </Button>
        </form>
      </Card>

      {/* Expense list */}
      {expenses.length === 0 ? (
        <Card className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-bg-tertiary mb-3">
            <span className="text-2xl">🧾</span>
          </div>
          <p className="text-text-muted text-sm">立替の記録はまだありません</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((exp) => {
            const shares = expenseShares.filter(
              (s) => s.expense_id === exp.id
            );
            const targetNames = shares
              .map((s) => getName(s.player_id))
              .join(", ");
            const perPerson = Math.floor(exp.amount / shares.length);

            return (
              <Card key={exp.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-text-primary">
                        {getName(exp.payer_id)}
                      </span>
                      <span className="text-jade font-bold text-sm tabular-nums">
                        {exp.amount.toLocaleString()}円
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-text-secondary mt-1">
                        {exp.description}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-1.5">
                      対象: {exp.is_all_members ? "全員" : targetNames}
                      <span className="ml-1 text-text-secondary">
                        （1人 {perPerson.toLocaleString()}円）
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExpense(exp.id)}
                    className="text-red text-xs shrink-0 ml-2"
                  >
                    削除
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
