"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecentRooms } from "@/hooks/useRecentRooms";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { ensureUser } = useAuth();
  const { addRecentRoom } = useRecentRooms();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("表示名を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await ensureUser();
      if (!user) throw new Error("認証に失敗しました");

      const { data: roomId, error: rpcErr } = await supabase.rpc(
        "join_room_via_invite",
        {
          p_token: token,
          p_display_name: displayName.trim(),
        }
      );

      if (rpcErr) throw rpcErr;
      if (!roomId) throw new Error("参加に失敗しました");

      const rid = roomId as string;

      const { data: roomData } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", rid)
        .single();

      addRecentRoom(rid, roomData?.name ?? "ルーム");
      router.push(`/rooms/${rid}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "エラーが発生しました";
      if (msg.includes("Invalid or expired")) {
        setError("招待リンクが無効または期限切れです");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-jade-surface border border-jade/20 mb-5 shadow-[0_4px_24px_var(--c-jade-glow)]">
            <span className="text-4xl">🀄</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary">
            麻雀精算
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            招待リンクからルームに参加
          </p>
        </div>

        <Card padding="lg">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            ルームに参加
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="表示名（あなたの名前）"
              placeholder="佐藤"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red bg-red-surface border border-red/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} size="lg">
              参加する
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
