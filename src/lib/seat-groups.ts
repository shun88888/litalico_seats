export interface SeatInfo {
  id: string;
  type: "robot" | "game-fab";
  position: { x: number; y: number };
}

// 座席の座標情報（時計回りに1-24の番号を振る）
// ルール（厳格）:
//   - ロボット(RC)生徒: 正方形机(robot)のみ使用可能 → 座席 7, 8, 9, 10, 11, 12, 17, 18, 22, 23, 24
//   - ゲーム(PG)/デジファブ(DF)/プライム(RT)生徒: 長方形机(game-fab)のみ使用可能 → 座席 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 19, 20, 21
//   - 相互利用は一切不可
//   - 座席17, 18は床席（ロボット専用、最終手段のみ使用）
export const SEATS: SeatInfo[] = [
  { id: "1", type: "game-fab", position: { x: 22, y: 20.44 } },      // 長方形机（左上）
  { id: "2", type: "game-fab", position: { x: 28.5, y: 16.00 } },    // 長方形机
  { id: "3", type: "game-fab", position: { x: 38.5, y: 16.00 } },    // 長方形机
  { id: "4", type: "game-fab", position: { x: 48.5, y: 16.00 } },    // 長方形机
  { id: "5", type: "game-fab", position: { x: 58.5, y: 16.00 } },    // 長方形机
  { id: "6", type: "game-fab", position: { x: 84.5, y: 16.00 } },    // 長方形机
  { id: "7", type: "robot", position: { x: 79.5, y: 19.56 } },       // 正方形机（ロボット専用・高優先）
  { id: "8", type: "robot", position: { x: 67, y: 28.44 } },         // 正方形机（ロボット専用・高優先）
  { id: "9", type: "robot", position: { x: 79.5, y: 37.33 } },       // 正方形机（ロボット専用・低優先）
  { id: "10", type: "robot", position: { x: 79.5, y: 41.33 } },      // 正方形机（ロボット専用・低優先）
  { id: "11", type: "robot", position: { x: 67, y: 50.22 } },        // 正方形机（ロボット専用・高優先）
  { id: "12", type: "robot", position: { x: 79.5, y: 59.11 } },      // 正方形机（ロボット専用・高優先）
  { id: "13", type: "game-fab", position: { x: 79, y: 66.22 } },     // 長方形机
  { id: "14", type: "game-fab", position: { x: 79, y: 73.33 } },     // 長方形机
  { id: "15", type: "game-fab", position: { x: 79, y: 80.44 } },     // 長方形机
  { id: "16", type: "game-fab", position: { x: 79, y: 90.67 } },     // 長方形机（右下）
  { id: "17", type: "robot", position: { x: 45, y: 65 } },           // 床席（ロボット専用・最終手段）
  { id: "18", type: "robot", position: { x: 55, y: 65 } },           // 床席（ロボット専用・最終手段）
  { id: "19", type: "game-fab", position: { x: 22, y: 71.56 } },     // 長方形机（左下上）
  { id: "20", type: "game-fab", position: { x: 22, y: 64.44 } },     // 長方形机（左下中）
  { id: "21", type: "game-fab", position: { x: 22, y: 57.33 } },     // 長方形机（左下下）
  { id: "22", type: "robot", position: { x: 28, y: 46.67 } },        // 正方形机（ロボット専用・高優先）
  { id: "23", type: "robot", position: { x: 41, y: 37.78 } },        // 正方形机（ロボット専用・高優先）
  { id: "24", type: "robot", position: { x: 28, y: 28.89 } },        // 正方形机（ロボット専用・高優先）
];

// 座席間の距離閾値（この距離以内なら隣接とみなす）
const ADJACENCY_THRESHOLD = 15;

/**
 * ロボット席の優先度
 */
export const ROBOT_SEAT_PRIORITY = {
  high: ["7", "8", "11", "12", "22", "23", "24"] as string[],  // 高優先席（授業しやすい）
  low: ["9", "10"] as string[],                                 // 低優先席（可能な限り避ける）
  floor: ["17", "18"] as string[],                              // 床席（最終手段のみ使用）
};

/**
 * ゲーム・デジファブ・プライム席の優先度
 */
export const GAME_FAB_PRIORITY = {
  fourPeople: ["1", "2", "3", "4"],  // 4人の場合に優先する上部L字エリア
} as const;

/**
 * 2つの座席間の距離を計算
 */
const calculateDistance = (seat1: SeatInfo, seat2: SeatInfo): number => {
  const dx = seat1.position.x - seat2.position.x;
  const dy = seat1.position.y - seat2.position.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 座標ベースで隣接座席を計算
 * @param seatId 基準となる座席ID
 * @returns 隣接する座席IDの配列
 */
export const getAdjacentSeats = (seatId: string): string[] => {
  const seat = SEATS.find(s => s.id === seatId);
  if (!seat) return [];

  return SEATS
    .filter(s => s.id !== seatId)
    .filter(s => calculateDistance(seat, s) <= ADJACENCY_THRESHOLD)
    .map(s => s.id);
};

/**
 * 座席のタイプを取得
 */
export const getSeatType = (seatId: string): "robot" | "game-fab" | null => {
  const seat = SEATS.find(s => s.id === seatId);
  return seat ? seat.type : null;
};

/**
 * 特定のタイプの座席IDリストを取得
 */
export const getSeatsByType = (type: "robot" | "game-fab"): string[] => {
  return SEATS.filter(s => s.type === type).map(s => s.id);
};

/**
 * 時計回りの座席順序（1-24）
 */
export const CLOCKWISE_ORDER = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"
] as const;

/**
 * 座席グループの定義（経験則に基づく）
 */
export interface PreferredSeatGroup {
  name: string;
  seats: string[];
  // ゲーム/デジファブが4人以上の場合に優先
  preferForGameFab4Plus?: boolean;
  // ロボット+ゲームの混合に適している
  preferForMixed?: boolean;
}

export const PREFERRED_SEAT_GROUPS: PreferredSeatGroup[] = [
  // 上部L字デスク（ゲーム/デジファブ4人以上で優先）
  {
    name: "上部L字エリア",
    seats: ["2", "3", "4", "5"],
    preferForGameFab4Plus: true,
  },
  // 右側混合エリア（ロボット+ゲーム混合に適している）
  {
    name: "右側混合エリア",
    seats: ["5", "6", "7", "8"],
    preferForMixed: true,
  },
  // 右上ロボットエリア
  {
    name: "右上ロボットエリア",
    seats: ["8", "9", "10", "11"],
    preferForMixed: true,
  },
  // 右下混合エリア
  {
    name: "右下混合エリア",
    seats: ["11", "12", "13", "14"],
    preferForMixed: true,
  },
  // 左下混合エリア（ロボット+ゲーム/デジファブ）
  {
    name: "左下混合エリア",
    seats: ["20", "21", "22", "23"],
    preferForMixed: true,
  },
  // 左上混合エリア
  {
    name: "左上混合エリア",
    seats: ["23", "24", "1", "2"],
    preferForMixed: true,
  },
];

/**
 * 時計回り順で連続する座席ペアの明示的な定義
 * 物理的に離れすぎているペアは除外（座標距離 > 20は非隣接とみなす）
 * 除外ペア:
 *   - "18-19": 右下左→左下上で距離大、除外
 * 特別ペア（低優先席スキップ用）:
 *   - "8-11": 座席8から11へのジャンプ（9,10をスキップ）
 */
const CLOCKWISE_ADJACENT_PAIRS = new Set([
  "1-2", "2-3", "3-4", "4-5", "5-6",
  "6-7", "7-8", "8-9", "9-10", "10-11",
  "8-11",  // 特別: 座席8から11へのジャンプ（9,10をスキップ）
  "11-12", "12-13", "13-14", "14-15",
  "15-16", "16-17", "17-18",
  // "18-19" は除外（右下左→左下上で距離大）
  "19-20", "20-21", "21-22",
  "22-23", "23-24", "24-1"
]);

/**
 * 2つの座席が時計回り順で隣接しているかチェック
 * @param includeJump trueの場合、8→11のジャンプも隣接として扱う（デフォルトはfalse）
 */
export const isClockwiseAdjacent = (seat1: string, seat2: string, includeJump: boolean = false): boolean => {
  const idx1 = (CLOCKWISE_ORDER as readonly string[]).indexOf(seat1);
  const idx2 = (CLOCKWISE_ORDER as readonly string[]).indexOf(seat2);

  if (idx1 === -1 || idx2 === -1) return false;

  const pairKey = `${seat1}-${seat2}`;

  // 8→11のジャンプを含めない場合は除外
  if (!includeJump && pairKey === "8-11") {
    return false;
  }

  // 明示的な隣接ペアリストをチェック
  if (CLOCKWISE_ADJACENT_PAIRS.has(pairKey)) {
    return true;
  }

  return false;
};

// 後方互換性のために残しておく（使用されている場合）
export interface SeatGroup {
  id: string;
  type: "robot" | "game-fab";
  seats: string[];
  adjacentGroups: string[];
}

export const SEAT_GROUPS: SeatGroup[] = [];
