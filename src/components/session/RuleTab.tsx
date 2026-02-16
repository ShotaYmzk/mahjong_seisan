"use client";

import { useState, useEffect } from "react";
import { createClient, logActivity } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type RuleSetRow = Database["public"]["Tables"]["rule_sets"]["Row"];

interface Props {
  sessionId: string;
  ruleSet: RuleSetRow | null;
  onRefetch: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  starting_points: "配給原点",
  return_points: "返し点",
  uma_1: "ウマ 1位（千点）",
  uma_2: "ウマ 2位（千点）",
  uma_3: "ウマ 3位（千点）",
  uma_4: "ウマ 4位（千点）",
  rate: "レート（円/千点）",
  rounding_unit: "丸め単位（円）",
  chip_rate: "チップ単価（円/枚）",
};

const FIELD_KEYS = [
  "starting_points",
  "return_points",
  "uma_1",
  "uma_2",
  "uma_3",
  "uma_4",
  "rate",
  "rounding_unit",
  "chip_rate",
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

export function RuleTab({ sessionId, ruleSet, onRefetch }: Props) {
  const supabase = createClient();
  const { user } = useAuth();
  const [values, setValues] = useState<Record<FieldKey, string>>({
    starting_points: "25000",
    return_points: "30000",
    uma_1: "10",
    uma_2: "5",
    uma_3: "-5",
    uma_4: "-10",
    rate: "100",
    rounding_unit: "100",
    chip_rate: "500",
  });
  const [okaType, setOkaType] = useState("winner_take_all");
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ruleSet) {
      const v: Record<string, string> = {};
      for (const key of FIELD_KEYS) {
        v[key] = String(ruleSet[key]);
      }
      setValues(v as Record<FieldKey, string>);
      setOkaType(ruleSet.oka_type);
    }
  }, [ruleSet]);

  const handleSave = async () => {
    if (!ruleSet) return;
    setSaving(true);
    setConflictError("");
    setSaved(false);

    try {
      const updatePayload = {
        oka_type: okaType,
        revision: ruleSet.revision + 1,
        updated_at: new Date().toISOString(),
        starting_points: parseInt(values.starting_points) || 0,
        return_points: parseInt(values.return_points) || 0,
        uma_1: parseInt(values.uma_1) || 0,
        uma_2: parseInt(values.uma_2) || 0,
        uma_3: parseInt(values.uma_3) || 0,
        uma_4: parseInt(values.uma_4) || 0,
        rate: parseInt(values.rate) || 0,
        rounding_unit: parseInt(values.rounding_unit) || 0,
        chip_rate: parseInt(values.chip_rate) || 0,
      };

      const { data, error } = await supabase
        .from("rule_sets")
        .update(updatePayload)
        .eq("id", ruleSet.id)
        .eq("revision", ruleSet.revision)
        .select();

      if (error) throw error;
      const rows = data as unknown as unknown[];
      if (!rows || rows.length === 0) {
        setConflictError(
          "他のユーザーが同時に更新しました。再読込してください。"
        );
        onRefetch();
        return;
      }

      await logActivity(supabase, sessionId, user?.id, "rule_updated", updatePayload);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">ルール設定</h2>

      {conflictError && (
        <div className="bg-red/10 border border-red/30 rounded-xl p-3 text-sm text-red">
          {conflictError}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          {FIELD_KEYS.map((key) => (
            <Input
              key={key}
              label={FIELD_LABELS[key]}
              type="number"
              value={values[key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          ))}

          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">
              オカ方式
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOkaType("winner_take_all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  okaType === "winner_take_all"
                    ? "bg-jade text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary"
                }`}
              >
                トップ取り
              </button>
              <button
                type="button"
                onClick={() => setOkaType("none")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  okaType === "none"
                    ? "bg-jade text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary"
                }`}
              >
                なし
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={saving}>
              保存
            </Button>
            {saved && (
              <span className="text-sm text-jade font-medium">保存しました</span>
            )}
          </div>
        </div>
      </Card>

      {/* Quick reference */}
      <Card className="bg-bg-tertiary/50">
        <p className="text-xs text-text-muted font-medium mb-2">設定の目安</p>
        <div className="text-xs text-text-muted space-y-1">
          <p>テンゴ: レート 50円/千点</p>
          <p>テンピン: レート 100円/千点</p>
          <p>ゴットー: ウマ 1位+10 / 2位+5 / 3位-5 / 4位-10</p>
          <p>ワンスリー: ウマ 1位+30 / 2位+10 / 3位-10 / 4位-30</p>
        </div>
      </Card>
    </div>
  );
}
