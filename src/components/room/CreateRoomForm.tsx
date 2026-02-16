"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecentRooms } from "@/hooks/useRecentRooms";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateRoomForm() {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { ensureUser } = useAuth();
  const { addRecentRoom } = useRecentRooms();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !displayName.trim()) {
      setError("全項目を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await ensureUser();
      if (!user) throw new Error("認証に失敗しました");

      const { data, error: rpcErr } = await supabase.rpc(
        "create_room_with_invite",
        {
          p_name: name.trim(),
          p_display_name: displayName.trim(),
        }
      );

      if (rpcErr) throw rpcErr;

      const result = data as unknown as {
        room_id: string;
        invite_token: string;
      };

      addRecentRoom(result.room_id, name.trim());
      router.push(`/rooms/${result.room_id}`);
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
        placeholder="田中"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <Input
        label="グループ名"
        placeholder="○○組"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="text-sm text-red">{error}</p>}
      <Button type="submit" loading={loading} size="lg">
        グループを作成
      </Button>
    </form>
  );
}
