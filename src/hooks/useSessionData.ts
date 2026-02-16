"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
export type SessionRow = Tables["sessions"]["Row"];
export type SessionPlayerRow = Tables["session_players"]["Row"];
export type RuleSetRow = Tables["rule_sets"]["Row"];
export type HanchanRow = Tables["hanchan"]["Row"];
export type RoundResultRow = Tables["round_results"]["Row"];
export type ExpenseRow = Tables["expenses"]["Row"];
export type ExpenseShareRow = Tables["expense_shares"]["Row"];
export type ActivityLogRow = Tables["activity_log"]["Row"];

export interface SessionData {
  session: SessionRow | null;
  players: SessionPlayerRow[];
  ruleSet: RuleSetRow | null;
  hanchanList: HanchanRow[];
  roundResults: RoundResultRow[];
  expenses: ExpenseRow[];
  expenseShares: ExpenseShareRow[];
  activityLog: ActivityLogRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSessionData(sessionId: string): SessionData {
  const supabase = createClient();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<SessionPlayerRow[]>([]);
  const [ruleSet, setRuleSet] = useState<RuleSetRow | null>(null);
  const [hanchanList, setHanchanList] = useState<HanchanRow[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResultRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseShares, setExpenseShares] = useState<ExpenseShareRow[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [
        sessionRes,
        playersRes,
        ruleRes,
        hanchanRes,
        resultsRes,
        expensesRes,
        sharesRes,
        logRes,
      ] = await Promise.all([
        supabase.from("sessions").select("*").eq("id", sessionId).single(),
        supabase
          .from("session_players")
          .select("*")
          .eq("session_id", sessionId)
          .order("seat_order"),
        supabase
          .from("rule_sets")
          .select("*")
          .eq("session_id", sessionId)
          .single(),
        supabase
          .from("hanchan")
          .select("*")
          .eq("session_id", sessionId)
          .order("seq"),
        supabase
          .from("round_results")
          .select("*")
          .eq("session_id", sessionId),
        supabase
          .from("expenses")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at"),
        supabase
          .from("expense_shares")
          .select("*")
          .eq("session_id", sessionId),
        supabase
          .from("activity_log")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (sessionRes.data) setSession(sessionRes.data as unknown as SessionRow);
      if (playersRes.data) setPlayers(playersRes.data as unknown as SessionPlayerRow[]);
      if (ruleRes.data) setRuleSet(ruleRes.data as unknown as RuleSetRow);
      if (hanchanRes.data) setHanchanList(hanchanRes.data as unknown as HanchanRow[]);
      if (resultsRes.data) setRoundResults(resultsRes.data as unknown as RoundResultRow[]);
      if (expensesRes.data) setExpenses(expensesRes.data as unknown as ExpenseRow[]);
      if (sharesRes.data) setExpenseShares(sharesRes.data as unknown as ExpenseShareRow[]);
      if (logRes.data) setActivityLog(logRes.data as unknown as ActivityLogRow[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [supabase, sessionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    session,
    players,
    ruleSet,
    hanchanList,
    roundResults,
    expenses,
    expenseShares,
    activityLog,
    loading,
    error,
    refetch: fetchAll,
  };
}
