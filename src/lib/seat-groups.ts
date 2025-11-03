export interface SeatInfo {
  id: string;
  type: "robot" | "game-fab";
  position: { x: number; y: number };
}

// 座席の座標情報（時計回りに1-21の番号を振る）
// ルール（厳格）:
//   - ロボット生徒: 正方形机(robot)のみ使用可能 → 座席 7, 8, 9, 10, 11, 12, 19, 20, 21
//   - ゲーム/ファブ生徒: 長方形机(game-fab)のみ使用可能 → 座席 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18
//   - 相互利用は一切不可
export const SEATS: SeatInfo[] = [
  { id: "1", type: "game-fab", position: { x: 22, y: 23 } },      // 長方形机（左上）
  { id: "2", type: "game-fab", position: { x: 28.5, y: 18 } },    // 長方形机
  { id: "3", type: "game-fab", position: { x: 38.5, y: 18 } },    // 長方形机
  { id: "4", type: "game-fab", position: { x: 48.5, y: 18 } },    // 長方形机
  { id: "5", type: "game-fab", position: { x: 58.5, y: 18 } },    // 長方形机
  { id: "6", type: "game-fab", position: { x: 84.5, y: 18 } },    // 長方形机
  { id: "7", type: "robot", position: { x: 79.5, y: 22 } },       // 正方形机（ロボット専用）
  { id: "8", type: "robot", position: { x: 67, y: 32 } },         // 正方形机（ロボット専用）
  { id: "9", type: "robot", position: { x: 79.5, y: 42 } },       // 正方形机（ロボット専用）
  { id: "10", type: "robot", position: { x: 79.5, y: 46.5 } },    // 正方形机（ロボット専用）
  { id: "11", type: "robot", position: { x: 67, y: 56.5 } },      // 正方形机（ロボット専用）
  { id: "12", type: "robot", position: { x: 79.5, y: 66.5 } },    // 正方形机（ロボット専用）
  { id: "13", type: "game-fab", position: { x: 79, y: 74.5 } },   // 長方形机
  { id: "14", type: "game-fab", position: { x: 79, y: 82.5 } },   // 長方形机
  { id: "15", type: "game-fab", position: { x: 79, y: 90.5 } },   // 長方形机
  { id: "16", type: "game-fab", position: { x: 22, y: 80.5 } },   // 長方形机
  { id: "17", type: "game-fab", position: { x: 22, y: 72.5 } },   // 長方形机
  { id: "18", type: "game-fab", position: { x: 22, y: 64.5 } },   // 長方形机
  { id: "19", type: "robot", position: { x: 28, y: 52.5 } },      // 正方形机（ロボット専用）
  { id: "20", type: "robot", position: { x: 41, y: 42.5 } },      // 正方形机（ロボット専用）
  { id: "21", type: "robot", position: { x: 28, y: 32.5 } },      // 正方形机（ロボット専用）
];

// 座席間の距離閾値（この距離以内なら隣接とみなす）
const ADJACENCY_THRESHOLD = 15;

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
 * 時計回りの座席順序（1-21）
 */
export const CLOCKWISE_ORDER = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"
] as const;

/**
 * 座席グループの定義（経験則に基づく）
 */
export interface PreferredSeatGroup {
  name: string;
  seats: string[];
  // ゲーム/ファブが4人以上の場合に優先
  preferForGameFab4Plus?: boolean;
  // ロボット+ゲームの混合に適している
  preferForMixed?: boolean;
}

export const PREFERRED_SEAT_GROUPS: PreferredSeatGroup[] = [
  // 上部L字デスク（ゲーム/ファブ4人以上で優先）
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
  // 左下混合エリア（ロボット+ゲーム/ファブ）
  {
    name: "左下混合エリア",
    seats: ["17", "18", "19", "20"],
    preferForMixed: true,
  },
  // 左上混合エリア
  {
    name: "左上混合エリア",
    seats: ["20", "21", "1", "2"],
    preferForMixed: true,
  },
];

/**
 * 時計回り順で連続する座席ペアの明示的な定義
 * 物理的に離れすぎているペアは除外（座標距離 > 20は非隣接とみなす）
 * 除外ペア:
 *   - "5-6": 上部L字の右端から右上へ（距離26）
 *   - "15-16": 右下から左下へ（距離57.9）
 */
const CLOCKWISE_ADJACENT_PAIRS = new Set([
  "1-2", "2-3", "3-4", "4-5",
  // "5-6" は除外（上部L字右端→右上で距離26）
  "6-7", "7-8", "8-9", "9-10", "10-11",
  "11-12", "12-13", "13-14", "14-15",
  // "15-16" は除外（右下→左下で距離57.9）
  "16-17", "17-18", "18-19",
  "19-20", "20-21", "21-1"
]);

/**
 * 2つの座席が時計回り順で隣接しているかチェック
 */
export const isClockwiseAdjacent = (seat1: string, seat2: string): boolean => {
  const idx1 = (CLOCKWISE_ORDER as readonly string[]).indexOf(seat1);
  const idx2 = (CLOCKWISE_ORDER as readonly string[]).indexOf(seat2);

  if (idx1 === -1 || idx2 === -1) return false;

  // 時計回りで隣接（循環考慮）
  const isNextInOrder = (idx2 === idx1 + 1) || (idx1 === 20 && idx2 === 0);

  if (!isNextInOrder) return false;

  // 明示的な隣接ペアリストをチェック
  const pairKey = `${seat1}-${seat2}`;
  return CLOCKWISE_ADJACENT_PAIRS.has(pairKey);
};

// 後方互換性のために残しておく（使用されている場合）
export interface SeatGroup {
  id: string;
  type: "robot" | "game-fab";
  seats: string[];
  adjacentGroups: string[];
}

export const SEAT_GROUPS: SeatGroup[] = [];
