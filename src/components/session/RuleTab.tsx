"use client";

import { useState, useEffect } from "react";
import { createClient, logActivity } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";

type RuleSetRow = Database["public"]["Tables"]["rule_sets"]["Row"];

interface Props {
  sessionId: string;
  ruleSet: RuleSetRow | null;
  onRefetch: () => void;
}

/* ---------- Uma presets ---------- */
const UMA_PRESETS = [
  { id: "5-10", label: "5-10", desc: "ゴットー", small: 5, big: 10 },
  { id: "10-20", label: "10-20", desc: "ワンツー", small: 10, big: 20 },
  { id: "10-30", label: "10-30", desc: "ワンスリー", small: 10, big: 30 },
  { id: "20-30", label: "20-30", desc: "ツースリー", small: 20, big: 30 },
] as const;

function detectUmaPreset(
  u1: number,
  u2: number,
  u3: number,
  u4: number
): string {
  if (u3 === -u2 && u4 === -u1 && u1 > 0 && u2 > 0) {
    for (const p of UMA_PRESETS) {
      if (p.small === u2 && p.big === u1) return p.id;
    }
  }
  return "custom";
}

/* ---------- Rate presets ---------- */
const RATE_PRESETS = [
  { id: "30", value: 30, desc: "テンサン" },
  { id: "50", value: 50, desc: "テンゴ" },
  { id: "100", value: 100, desc: "テンピン" },
  { id: "200", value: 200, desc: "" },
] as const;

function detectRatePreset(rate: number): string {
  for (const p of RATE_PRESETS) {
    if (p.value === rate) return p.id;
  }
  return "custom";
}

/* ---------- Field config ---------- */
const FIELD_LABELS: Record<string, string> = {
  starting_points: "配給原点",
  return_points: "返し点",
  rate: "レート（円/千点）",
  rounding_unit: "丸め単位（円）",
  chip_rate: "チップ単価（円/枚）",
  starting_chips: "開始チップ枚数",
};

const ALL_FIELD_KEYS = [
  "starting_points",
  "return_points",
  "uma_1",
  "uma_2",
  "uma_3",
  "uma_4",
  "rate",
  "rounding_unit",
  "chip_rate",
  "starting_chips",
];

export function RuleTab({ sessionId, ruleSet, onRefetch }: Props) {
  const supabase = createClient();
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({
    starting_points: "25000",
    return_points: "30000",
    uma_1: "20",
    uma_2: "10",
    uma_3: "-10",
    uma_4: "-20",
    rate: "100",
    rounding_unit: "100",
    chip_rate: "500",
    starting_chips: "0",
  });
  const [umaPreset, setUmaPreset] = useState("10-20");
  const [ratePreset, setRatePreset] = useState("100");
  const [okaType, setOkaType] = useState("winner_take_all");
  const [tobiBonusEnabled, setTobiBonusEnabled] = useState(false);
  const [tobiBonusPoints, setTobiBonusPoints] = useState("0");
  const [tobiBonusChips, setTobiBonusChips] = useState("0");
  const [tobiReceiverType, setTobiReceiverType] = useState("top");
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ruleSet) {
      const v: Record<string, string> = {};
      for (const key of ALL_FIELD_KEYS) {
        v[key] = String(ruleSet[key as keyof RuleSetRow]);
      }
      setValues(v);

      const u1 = parseInt(v.uma_1) || 0;
      const u2 = parseInt(v.uma_2) || 0;
      const u3 = parseInt(v.uma_3) || 0;
      const u4 = parseInt(v.uma_4) || 0;
      setUmaPreset(detectUmaPreset(u1, u2, u3, u4));
      setRatePreset(detectRatePreset(parseInt(v.rate) || 0));

      setOkaType(ruleSet.oka_type);
      setTobiBonusEnabled(ruleSet.tobi_bonus_enabled);
      setTobiBonusPoints(String(ruleSet.tobi_bonus_points));
      setTobiBonusChips(String(ruleSet.tobi_bonus_chips));
      setTobiReceiverType(ruleSet.tobi_receiver_type);
    }
  }, [ruleSet]);

  /* ---------- Uma handlers ---------- */
  const handleSelectPreset = (presetId: string) => {
    setUmaPreset(presetId);
    const preset = UMA_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setValues((prev) => ({
        ...prev,
        uma_1: String(preset.big),
        uma_2: String(preset.small),
        uma_3: String(-preset.small),
        uma_4: String(-preset.big),
      }));
    }
  };

  const handleCustomUmaChange = (which: "small" | "big", raw: string) => {
    const num = parseInt(raw) || 0;
    if (which === "small") {
      setValues((prev) => ({
        ...prev,
        uma_2: raw,
        uma_3: String(-num),
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        uma_1: raw,
        uma_4: String(-num),
      }));
    }
  };

  const umaValues = {
    first: parseInt(values.uma_1) || 0,
    second: parseInt(values.uma_2) || 0,
    third: parseInt(values.uma_3) || 0,
    fourth: parseInt(values.uma_4) || 0,
  };

  /* ---------- Save ---------- */
  const handleSave = async () => {
    if (!ruleSet) return;
    setSaving(true);
    setConflictError("");
    setSaved(false);

    try {
      const updatePayload: Record<string, unknown> = {
        oka_type: okaType,
        tobi_bonus_enabled: tobiBonusEnabled,
        tobi_bonus_points: parseInt(tobiBonusPoints) || 0,
        tobi_bonus_chips: parseInt(tobiBonusChips) || 0,
        tobi_receiver_type: tobiReceiverType,
        revision: ruleSet.revision + 1,
        updated_at: new Date().toISOString(),
      };

      for (const key of ALL_FIELD_KEYS) {
        updatePayload[key] = parseInt(values[key]) || 0;
      }

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

      await logActivity(
        supabase,
        sessionId,
        user?.id,
        "rule_updated",
        updatePayload
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Helpers ---------- */
  const renderField = (key: string) => (
    <Input
      key={key}
      label={FIELD_LABELS[key]}
      type="number"
      value={values[key]}
      onChange={(e) =>
        setValues((prev) => ({ ...prev, [key]: e.target.value }))
      }
    />
  );

  const renderSection = (title: string, keys: string[]) => (
    <Card key={title}>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{keys.map(renderField)}</div>
    </Card>
  );

  const presetBtnClass = (active: boolean) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
      active
        ? "bg-jade text-text-on-jade shadow-sm"
        : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
    }`;

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">ルール設定</h2>

      {conflictError && (
        <div className="bg-red-surface border border-red/20 rounded-xl p-3 text-sm text-red">
          {conflictError}
        </div>
      )}

      {/* 基本設定 */}
      {renderSection("基本設定", ["starting_points", "return_points"])}

      {/* ウマ */}
      <Card>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          ウマ
        </h3>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {UMA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={presetBtnClass(umaPreset === preset.id)}
            >
              {preset.label}
              {preset.desc && (
                <span className="text-xs opacity-70 ml-1">
                  ({preset.desc})
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUmaPreset("custom")}
            className={presetBtnClass(umaPreset === "custom")}
          >
            カスタム
          </button>
        </div>

        {/* Custom inputs */}
        {umaPreset === "custom" && (
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <Input
                label="ウマ小（千点）"
                type="number"
                value={values.uma_2}
                onChange={(e) =>
                  handleCustomUmaChange("small", e.target.value)
                }
              />
            </div>
            <span className="text-text-muted font-bold pb-2.5">−</span>
            <div className="flex-1">
              <Input
                label="ウマ大（千点）"
                type="number"
                value={values.uma_1}
                onChange={(e) => handleCustomUmaChange("big", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Uma result display */}
        <div className="grid grid-cols-4 gap-1 bg-bg-tertiary rounded-xl p-3">
          {[
            { rank: "1位", value: umaValues.first },
            { rank: "2位", value: umaValues.second },
            { rank: "3位", value: umaValues.third },
            { rank: "4位", value: umaValues.fourth },
          ].map((item) => (
            <div key={item.rank} className="text-center">
              <div className="text-[10px] text-text-muted mb-0.5">
                {item.rank}
              </div>
              <div
                className={`text-sm font-semibold tabular-nums ${
                  item.value > 0
                    ? "text-jade"
                    : item.value < 0
                    ? "text-red"
                    : "text-text-muted"
                }`}
              >
                {item.value > 0 ? "+" : ""}
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* レート */}
      <Card>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          レート
        </h3>

        {/* Rate preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {RATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setRatePreset(preset.id);
                setValues((prev) => ({ ...prev, rate: String(preset.value) }));
              }}
              className={presetBtnClass(ratePreset === preset.id)}
            >
              {preset.value}円
              {preset.desc && (
                <span className="text-xs opacity-70 ml-1">
                  ({preset.desc})
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRatePreset("custom")}
            className={presetBtnClass(ratePreset === "custom")}
          >
            カスタム
          </button>
        </div>

        {/* Custom rate input */}
        {ratePreset === "custom" && (
          <div className="mb-4">
            <Input
              label="レート（円/千点）"
              type="number"
              value={values.rate}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, rate: e.target.value }))
              }
            />
          </div>
        )}

        {/* Current rate display */}
        <div className="bg-bg-tertiary rounded-xl p-3 mb-4 text-center">
          <span className="text-sm font-semibold text-text-primary tabular-nums">
            {values.rate}円 / 千点
          </span>
        </div>

        {/* Rounding unit stays as regular input */}
        {renderField("rounding_unit")}
      </Card>

      {/* チップ */}
      {renderSection("チップ", ["chip_rate", "starting_chips"])}

      {/* Oka type */}
      <Card>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          オカ方式
        </h3>
        <div className="flex gap-2">
          {[
            { value: "winner_take_all", label: "トップ取り" },
            { value: "none", label: "なし" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOkaType(opt.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                okaType === opt.value
                  ? "bg-jade text-text-on-jade shadow-sm"
                  : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tobi bonus */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              飛び賞（トビ賞）
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              飛んだプレイヤーへのペナルティ
            </p>
          </div>
          <Toggle
            checked={tobiBonusEnabled}
            onChange={setTobiBonusEnabled}
            label="飛び賞"
          />
        </div>

        {tobiBonusEnabled && (
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-subtle">
            <Input
              label="飛び賞ポイント（千点単位）"
              type="number"
              value={tobiBonusPoints}
              onChange={(e) => setTobiBonusPoints(e.target.value)}
            />
            <Input
              label="飛び賞チップ（枚）"
              type="number"
              value={tobiBonusChips}
              onChange={(e) => setTobiBonusChips(e.target.value)}
            />
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-2 block">
                受取人
              </label>
              <div className="flex gap-2">
                {[
                  { value: "top", label: "トップ受取り" },
                  { value: "manual", label: "手動選択" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTobiReceiverType(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      tobiReceiverType === opt.value
                        ? "bg-jade text-text-on-jade shadow-sm"
                        : "bg-bg-tertiary text-text-secondary border border-border-primary hover:border-jade/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          保存
        </Button>
        {saved && (
          <span className="text-sm text-jade font-medium animate-fade-in">
            保存しました
          </span>
        )}
      </div>

      {/* Quick reference */}
      <Card className="bg-bg-secondary">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          計算例
        </h3>
        <div className="text-xs text-text-secondary space-y-1.5">
          <p>
            現在のレート: 1,000点差 ={" "}
            <span className="font-semibold text-text-primary">
              {parseInt(values.rate) || 0}円
            </span>
          </p>
          <p>
            10,000点差 ={" "}
            <span className="font-semibold text-text-primary">
              {((parseInt(values.rate) || 0) * 10).toLocaleString()}円
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
