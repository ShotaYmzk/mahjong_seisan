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
  totalPoints: number; // 合算後の点数差分
  yenAmount: number; // 円換算後（丸め前）
  yenRounded: number; // 丸め後の円
}

export interface HanchanResult {
  hanchanId: string;
  seq: number;
  isConfirmed: boolean;
  scoreSum: number;
  expectedSum: number;
  playerResults: HanchanPlayerResult[];
}

export interface ChipEvent {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  quantity: number;
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
}

export interface PlayerBalance {
  playerId: string;
  displayName: string;
  mahjongYen: number;
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
};
