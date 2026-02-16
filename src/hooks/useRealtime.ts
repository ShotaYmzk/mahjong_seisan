"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const WATCHED_TABLES = [
  "hanchan",
  "round_results",
  "session_players",
  "expenses",
  "expense_shares",
  "rule_sets",
] as const;

/**
 * Subscribe to Realtime changes for a session.
 * Calls onUpdate whenever any relevant table changes.
 */
export function useRealtime(sessionId: string, onUpdate: () => void) {
  const supabase = createClient();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`session:${sessionId}`);

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          onUpdate();
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId, onUpdate]);
}
