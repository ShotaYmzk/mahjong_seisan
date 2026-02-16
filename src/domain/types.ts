/** Pure domain types - no Supabase dependency */

export interface RuleSet {
  startingPoints: number; // 配給原点 (e.g., 25000)
  returnPoints: number; // 返し点 (e.g., 30000)
  uma1: number; // 1位ウマ (千点単位, e.g., 10 = 10,000点)
  uma2: number; // 2位ウマ
  uma3: number; // 3位ウマ
  uma4: number; // 4位ウマ
  okaType: "winner_take_all" | "none";
  rate: number; // 円/千点 (e.g., 100 = テンピン)
  roundingUnit: number; // 丸め単位 (e.g., 100 = 100円単位)
  chipRate: number; // チップ単価 (e.g., 500 = 1枚500円)
  startingChips: number; // 開始チップ枚数 (e.g., 20)
  tobiBonusEnabled: boolean; // 飛び賞 ON/OFF
  tobiBonusPoints: number; // 飛び賞ポイント (千点単位, e.g., 10 = 10p)
  tobiBonusChips: number; // 飛び賞チップ枚数
  tobiReceiverType: "top" | "manual"; // 受取人: トップ or 手動
}

export interface PlayerScore {
  playerId: string;
  seatOrder: number;
  rawScore: number;
}

export interface HanchanPlayerResult {
  playerId: string;
  rank: number;
  rawScore: number;
  pointDiff: number; // 返し点からの差分 (点)
  okaAmount: number; // オカ加算分 (点)
  umaAmount: number; // ウマ加算分 (点)
  totalPoints: number; // 合算後の点数差分 (点単位)
  points: number; // 千点単位ポイント (totalPoints / 1000)
  isTobi: boolean; // 飛んだ (rawScore <= 0)
  tobiBonusPoints: number; // 飛び賞によるポイント補正 (千点単位)
}

export interface TobiEvent {
  bustedPlayerId: string;
  receiverPlayerId: string;
  bonusChips: number;
}

export interface HanchanResult {
  hanchanId: string;
  seq: number;
  isConfirmed: boolean;
  scoreSum: number;
  expectedSum: number;
  playerResults: HanchanPlayerResult[];
  tobiEvents: TobiEvent[];
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  description: string | null;
  isAllMembers: boolean;
  sharePlayerIds: string[];
}

export interface SessionPlayer {
  id: string;
  displayName: string;
  seatOrder: number;
  userId: string | null;
  chipCount: number | null; // 終了時チップ枚数 (null = 未入力)
}

export interface PlayerBalance {
  playerId: string;
  displayName: string;
  mahjongPoints: number; // 全半荘のポイント合計 (千点単位)
  mahjongYen: number; // mahjongPoints × rate を丸めた円
  chipYen: number;
  expenseYen: number;
  totalYen: number;
}

export interface Transfer {
  fromPlayerId: string;
  fromName: string;
  toPlayerId: string;
  toName: string;
  amount: number;
}

export interface Settlement {
  hasUnconfirmed: boolean;
  playerBalances: PlayerBalance[];
  transfers: Transfer[];
}

export const DEFAULT_RULE_SET: RuleSet = {
  startingPoints: 25000,
  returnPoints: 30000,
  uma1: 10,
  uma2: 5,
  uma3: -5,
  uma4: -10,
  okaType: "winner_take_all",
  rate: 100,
  roundingUnit: 100,
  chipRate: 500,
  startingChips: 0,
  tobiBonusEnabled: false,
  tobiBonusPoints: 0,
  tobiBonusChips: 0,
  tobiReceiverType: "top",
};
