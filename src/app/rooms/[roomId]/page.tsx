"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecentRooms } from "@/hooks/useRecentRooms";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
  const { addRecentRoom } = useRecentRooms();
  const supabase = createClient();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [gameMode, setGameMode] = useState<3 | 4>(4);
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

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
    if (membersRes.data)
      setMembers(membersRes.data as unknown as MemberData[]);
    if (sessionsRes.data)
      setSessions(sessionsRes.data as unknown as SessionData[]);
    setLoading(false);
  }, [supabase, roomId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (room) {
      addRecentRoom(room.id, room.name);
    }
  }, [room, addRecentRoom]);

  const handleStartEditName = () => {
    setEditName(room?.name ?? "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      const { error: updateErr } = await supabase
        .from("rooms")
        .update({ name: editName.trim() })
        .eq("id", roomId);
      if (updateErr) throw updateErr;
      setRoom((prev) => (prev ? { ...prev, name: editName.trim() } : prev));
      addRecentRoom(roomId, editName.trim());
      setEditingName(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "名前の更新に失敗しました"
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateInvite = async () => {
    setInviteLoading(true);
    setInviteLink("");
    setInviteCopied(false);
    try {
      const { data: token, error: rpcErr } = await supabase.rpc(
        "create_invite_link",
        { p_room_id: roomId }
      );
      if (rpcErr) throw rpcErr;
      const link = `${window.location.origin}/join/${token}`;
      setInviteLink(link);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "招待リンクの発行に失敗しました"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const maxPlayers = gameMode === 3 ? 4 : 6;
  const minPlayers = gameMode;

  const handleGameModeChange = (mode: 3 | 4) => {
    setGameMode(mode);
    setError("");
    if (mode === 3) {
      setPlayerNames(["", "", ""]);
    } else {
      setPlayerNames(["", "", "", ""]);
    }
  };

  const addPlayerSlot = () => {
    if (playerNames.length < maxPlayers) {
      setPlayerNames((prev) => [...prev, ""]);
    }
  };

  const removePlayerSlot = (index: number) => {
    if (playerNames.length > minPlayers) {
      setPlayerNames((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerNames.some((n) => !n.trim())) {
      setError("全員の名前を入力してください");
      return;
    }
    if (playerNames.length < minPlayers) {
      setError(`最低${minPlayers}人のプレイヤーが必要です`);
      return;
    }

    const sessionName =
      newSessionName.trim() ||
      `${new Date().getMonth() + 1}/${new Date().getDate()} セット`;

    setCreating(true);
    setError("");

    try {
      const { data: sessData, error: sessErr } = await supabase
        .from("sessions")
        .insert({ room_id: roomId, name: sessionName })
        .select()
        .single();

      if (sessErr) throw sessErr;
      const sess = sessData as unknown as { id: string };

      const ruleInsert =
        gameMode === 3
          ? {
              session_id: sess.id,
              player_count: 3,
              starting_points: 35000,
              return_points: 40000,
              uma_1: 20,
              uma_2: 0,
              uma_3: -20,
              uma_4: 0,
            }
          : { session_id: sess.id, player_count: 4 };

      const { error: ruleErr } = await supabase
        .from("rule_sets")
        .insert(ruleInsert);
      if (ruleErr) throw ruleErr;

      const playerInserts = playerNames.map((name, i) => {
        const member = members.find(
          (m) =>
            m.display_name.trim().toLowerCase() === name.trim().toLowerCase()
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
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-jade-surface border border-jade/20 mb-4">
            <span className="text-3xl">🀄</span>
          </div>
          <p className="text-sm text-text-secondary">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-jade transition-colors mb-2"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          ホーム
        </button>

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              autoFocus
              className="flex-1 bg-bg-tertiary border border-border-primary rounded-xl px-3.5 py-2 text-xl font-bold text-text-primary focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade-glow"
            />
            <Button size="sm" onClick={handleSaveName} loading={savingName}>
              保存
            </Button>
            <button
              onClick={() => setEditingName(false)}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {room?.name ?? "グループ"}
            </h1>
            <button
              onClick={handleStartEditName}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
              title="グループ名を編集"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
        )}

        {members.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <svg
              className="w-3.5 h-3.5 text-text-muted shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm text-text-secondary">
              {members.map((m) => m.display_name).join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Invite Link */}
      <Card className="mb-6">
        {inviteLink ? (
          <div>
            <p className="text-[13px] font-medium text-text-secondary mb-2">
              招待リンク（24時間有効）
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-bg-tertiary border border-border-primary rounded-xl px-3.5 py-2.5 text-sm text-text-primary truncate focus:outline-none"
              />
              <Button size="sm" onClick={handleCopyInvite}>
                {inviteCopied ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    済
                  </span>
                ) : (
                  "コピー"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                メンバーを招待
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                招待リンクを共有して参加してもらえます
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCreateInvite}
              loading={inviteLoading}
            >
              リンク発行
            </Button>
          </div>
        )}
      </Card>

      {/* Session list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">セット一覧</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
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
          新規作成
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-bg-tertiary mb-3">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-text-muted text-sm">まだセットがありません</p>
          <p className="text-text-muted text-xs mt-1">
            「新規作成」でセットを始めましょう
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <Card
              key={s.id}
              hover
              onClick={() => router.push(`/sessions/${s.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary">{s.name}</h3>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(s.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      s.status === "settled"
                        ? "bg-jade-surface text-jade border border-jade/20"
                        : "bg-gold-surface text-gold border border-gold/20"
                    }`}
                  >
                    {s.status === "settled" ? "精算済み" : "進行中"}
                  </span>
                  <svg
                    className="w-4 h-4 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新しいセット"
      >
        <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
          <Input
            label="セット名"
            placeholder="2/16 セット"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
          />

          {/* Game mode toggle: 三麻 / 四麻 */}
          <div>
            <label className="text-[13px] font-medium text-text-secondary mb-2 block">
              対局モード
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGameModeChange(4)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  gameMode === 4
                    ? "bg-jade text-text-on-jade shadow-sm ring-2 ring-jade/30"
                    : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                }`}
              >
                <span className="text-lg">🀄</span>
                <span>四人麻雀</span>
                <span className={`text-[10px] ${gameMode === 4 ? "text-white/70" : "text-text-muted"}`}>
                  4人対局
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleGameModeChange(3)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  gameMode === 3
                    ? "bg-jade text-text-on-jade shadow-sm ring-2 ring-jade/30"
                    : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                }`}
              >
                <span className="text-lg">🀄</span>
                <span>三人麻雀</span>
                <span className={`text-[10px] ${gameMode === 3 ? "text-white/70" : "text-text-muted"}`}>
                  3人対局（サンマ）
                </span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-text-secondary">
                プレイヤー（{playerNames.length}人）
              </label>
              {playerNames.length < maxPlayers && (
                <button
                  type="button"
                  onClick={addPlayerSlot}
                  className="text-xs text-jade hover:text-jade-dim font-medium transition-colors"
                >
                  + 人数追加（{playerNames.length + 1}人目）
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`${i + 1}人目の名前`}
                      value={name}
                      onChange={(e) => {
                        const next = [...playerNames];
                        next[i] = e.target.value;
                        setPlayerNames(next);
                      }}
                    />
                  </div>
                  {i >= minPlayers && (
                    <button
                      type="button"
                      onClick={() => removePlayerSlot(i)}
                      className="p-2 text-text-muted hover:text-red transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {playerNames.length > gameMode && (
              <p className="text-xs text-text-muted mt-2">
                {playerNames.length}人参加の場合、半荘ごとに{gameMode}人が対局し残りは抜け番になります
              </p>
            )}
            {members.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-xs text-text-muted mr-1 self-center">
                  クイック追加:
                </span>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="text-xs px-2.5 py-1 rounded-lg bg-bg-tertiary text-text-secondary border border-border-subtle hover:text-jade hover:border-jade/30 transition-all"
                    onClick={() => {
                      const emptyIdx = playerNames.findIndex(
                        (n) => !n.trim()
                      );
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
          {error && (
            <p className="text-sm text-red bg-red-surface border border-red/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" loading={creating} size="lg">
            セットを開始
          </Button>
        </form>
      </Modal>
    </main>
  );
}
