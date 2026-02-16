"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface RoomData {
  id: string;
  name: string;
}

interface MemberData {
  id: string;
  user_id: string;
  display_name: string;
}

interface SessionData {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const [roomRes, membersRes, sessionsRes] = await Promise.all([
      supabase.from("rooms").select("id, name").eq("id", roomId).single(),
      supabase
        .from("room_members")
        .select("id, user_id, display_name")
        .eq("room_id", roomId),
      supabase
        .from("sessions")
        .select("id, name, status, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false }),
    ]);

    if (roomRes.data) setRoom(roomRes.data as unknown as RoomData);
    if (membersRes.data) setMembers(membersRes.data as unknown as MemberData[]);
    if (sessionsRes.data) setSessions(sessionsRes.data as unknown as SessionData[]);
    setLoading(false);
  }, [supabase, roomId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) {
      setError("セッション名を入力してください");
      return;
    }
    if (playerNames.some((n) => !n.trim())) {
      setError("4人全員の名前を入力してください");
      return;
    }

    setCreating(true);
    setError("");

    try {
      // Create session
      const { data: sessData, error: sessErr } = await supabase
        .from("sessions")
        .insert({ room_id: roomId, name: newSessionName.trim() })
        .select()
        .single();

      if (sessErr) throw sessErr;
      const sess = sessData as unknown as { id: string };

      // Create rule_set with defaults
      const { error: ruleErr } = await supabase.from("rule_sets").insert({
        session_id: sess.id,
      });
      if (ruleErr) throw ruleErr;

      // Create 4 session players
      // Try to match player names with room members
      const playerInserts = playerNames.map((name, i) => {
        const member = members.find(
          (m) => m.display_name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        return {
          session_id: sess.id,
          display_name: name.trim(),
          seat_order: i + 1,
          user_id: member?.user_id ?? null,
        };
      });

      const { error: playerErr } = await supabase
        .from("session_players")
        .insert(playerInserts as never);

      if (playerErr) throw playerErr;

      router.push(`/sessions/${sess.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setCreating(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">読み込み中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-text-muted hover:text-text-secondary mb-1"
          >
            ← ホーム
          </button>
          <h1 className="text-xl font-bold">{room?.name ?? "部屋"}</h1>
          <p className="text-sm text-text-secondary">
            メンバー: {members.map((m) => m.display_name).join(", ")}
          </p>
        </div>
      </div>

      {/* Session list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">セッション一覧</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + 新規作成
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-text-muted">まだセッションがありません</p>
          <p className="text-sm text-text-muted mt-1">
            「新規作成」でセッションを始めましょう
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <Card
              key={s.id}
              hover
              onClick={() => router.push(`/sessions/${s.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(s.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    s.status === "settled"
                      ? "bg-jade/15 text-jade"
                      : "bg-gold/15 text-gold"
                  }`}
                >
                  {s.status === "settled" ? "精算済み" : "進行中"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新しいセッション"
      >
        <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
          <Input
            label="セッション名"
            placeholder="2/16 ○○雀荘"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
          />
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">
              プレイヤー（4人）
            </p>
            <div className="flex flex-col gap-2">
              {playerNames.map((name, i) => (
                <Input
                  key={i}
                  placeholder={`${i + 1}人目の名前`}
                  value={name}
                  onChange={(e) => {
                    const next = [...playerNames];
                    next[i] = e.target.value;
                    setPlayerNames(next);
                  }}
                />
              ))}
            </div>
            {members.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="text-xs px-2 py-1 rounded-lg bg-bg-tertiary text-text-secondary hover:text-jade transition-colors"
                    onClick={() => {
                      const emptyIdx = playerNames.findIndex((n) => !n.trim());
                      if (emptyIdx >= 0) {
                        const next = [...playerNames];
                        next[emptyIdx] = m.display_name;
                        setPlayerNames(next);
                      }
                    }}
                  >
                    + {m.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <Button type="submit" loading={creating} size="lg">
            セッションを開始
          </Button>
        </form>
      </Modal>
    </main>
  );
}
