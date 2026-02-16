"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function JoinRoomForm() {
  const [passphrase, setPassphrase] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { ensureUser } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || !displayName.trim()) {
      setError("全項目を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await ensureUser();
      if (!user) throw new Error("認証に失敗しました");

      // Use RPC function (SECURITY DEFINER) to find room by passphrase
      // This bypasses RLS since the user isn't a member yet
      const { data: roomId, error: findErr } = await supabase
        .rpc("find_room_by_passphrase", { p_passphrase: passphrase.trim() });

      if (findErr) throw findErr;
      if (!roomId) {
        setError("合言葉が一致する部屋が見つかりません");
        return;
      }

      const room = { id: roomId as string };

      const { data: existingData } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingData) {
        const { error: joinErr } = await supabase.from("room_members").insert({
          room_id: room.id,
          user_id: user.id,
          display_name: displayName.trim(),
        });
        if (joinErr) throw joinErr;
      }

      router.push(`/rooms/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="表示名（あなたの名前）"
        placeholder="佐藤"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <Input
        label="合言葉"
        placeholder="部屋の合言葉を入力"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      {error && <p className="text-sm text-red">{error}</p>}
      <Button type="submit" loading={loading} size="lg">
        参加する
      </Button>
    </form>
  );
}
