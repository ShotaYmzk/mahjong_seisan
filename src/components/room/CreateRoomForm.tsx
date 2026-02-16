"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateRoomForm() {
  const [name, setName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { ensureUser } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !passphrase.trim() || !displayName.trim()) {
      setError("全項目を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await ensureUser();
      if (!user) throw new Error("認証に失敗しました");

      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .insert({ name: name.trim(), passphrase: passphrase.trim(), created_by: user.id })
        .select()
        .single();

      if (roomErr) throw roomErr;
      const room = roomData as unknown as { id: string };

      const { error: memberErr } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName.trim(),
      });

      if (memberErr) throw memberErr;

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
        placeholder="田中"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <Input
        label="部屋名"
        placeholder="今日の麻雀"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="合言葉（参加用パスワード）"
        placeholder="合言葉を設定"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      {error && <p className="text-sm text-red">{error}</p>}
      <Button type="submit" loading={loading} size="lg">
        部屋を作成
      </Button>
    </form>
  );
}
