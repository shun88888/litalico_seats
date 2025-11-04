import {
  getSeatType,
  CLOCKWISE_ORDER,
  isClockwiseAdjacent,
  ROBOT_SEAT_PRIORITY,
} from "./seat-groups";
import type {
  AssignmentResult,
  AssignmentError,
  CourseType,
  FloorAllocation,
  Mentor,
  SeatAssignment,
  CourseCounts,
} from "@/types/seating";

/**
 * ========================================
 * 座席配置メイン関数
 * ========================================
 * メンターと生徒の情報から座席を自動配置する
 */
export const assignSeats = (mentors: Mentor[]): AssignmentResult => {
  // ========================================
  // 状態管理
  // ========================================
  const assignments: SeatAssignment[] = [];
  const assignedSeats = new Set<string>();
  const errors: AssignmentError[] = [];

  // 床席の管理
  let floorOwnerId: string | null = null;
  const floorContributors = new Map<string, number>();
  let floorTotal = 0;
  const floorSeatIds: string[] = [];

  // ========================================
  // ユーティリティ関数
  // ========================================

  /**
   * 座席が使用可能かチェック
   */
  const isAvailable = (seatId: string): boolean => {
    return !assignedSeats.has(seatId);
  };

  /**
   * 座席を割り当てる
   */
  const assignSeat = (seatId: string, mentorId: string, course: CourseType) => {
    assignments.push({ seatId, mentorId, course });
    assignedSeats.add(seatId);
  };

  /**
   * 床席に配置（ロボット生徒のみ、最終手段）
   */
  const assignToFloor = (mentorId: string, count: number) => {
    if (count <= 0) return;
    if (!floorOwnerId) floorOwnerId = mentorId;

    const availableFloorSeats = ["17", "18"].filter(id => isAvailable(id));
    let assigned = 0;

    for (const seatId of availableFloorSeats) {
      if (assigned >= count) break;
      floorSeatIds.push(seatId);
      assignSeat(seatId, mentorId, "robot");
      assigned++;
    }

    floorTotal += count;
    const current = floorContributors.get(mentorId) ?? 0;
    floorContributors.set(mentorId, current + count);
  };

  // ========================================
  // 座席配置のコアロジック
  // ========================================

  /**
   * 時計回り順で連続した座席を探す
   * @param requiredCounts 各コースの必要人数
   * @param allowLowPriority trueの場合、座席9,10も使用可能
   * @param useSeat5 trueの場合、座席5も使用可能
   * @returns 座席配置結果 or null
   */
  const findContinuousSeats = (
    requiredCounts: CourseCounts,
    allowLowPriority: boolean = false,
    useSeat5: boolean = true
  ): SeatAssignment[] | null => {
    const totalNeeded = requiredCounts.robot + requiredCounts.game + requiredCounts.fab + requiredCounts.prime;

    // 全ての位置から連続座席を探す（時計回り順）
    for (let startIdx = 0; startIdx < 24; startIdx++) {
      const result = tryFromPosition(startIdx, totalNeeded, requiredCounts, allowLowPriority, useSeat5);
      if (result) return result;
    }

    return null;
  };

  /**
   * 指定位置から時計回りに連続座席を探す
   *
   * ロボット人数による戦略:
   * - 7人以下: 座席9,10を避けて8→11にジャンプ（allowLowPriority=false時）
   * - 8人以上: 座席9,10も使用（allowLowPriority=true）
   */
  const tryFromPosition = (
    startIdx: number,
    totalNeeded: number,
    requiredCounts: CourseCounts,
    allowLowPriority: boolean,
    useSeat5: boolean
  ): SeatAssignment[] | null => {
    const candidates: string[] = [];
    let currentIdx = startIdx;
    const robotCount = requiredCounts.robot;

    // ロボット人数による座席戦略を決定
    // shouldSkipLowPriority = true の時、座席9,10をスキップして8→11にジャンプ
    const shouldSkipLowPriority = robotCount > 0 && !allowLowPriority && robotCount <= 7;

    // 連続座席を収集（最大24回ループ）
    for (let i = 0; i < 24 && candidates.length < totalNeeded; i++) {
      const seatId = CLOCKWISE_ORDER[currentIdx % 24];

      // 空きチェック
      if (!isAvailable(seatId)) {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 床席は除外
      if (ROBOT_SEAT_PRIORITY.floor.includes(seatId)) {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 座席5のスキップ処理
      if (!useSeat5 && seatId === "5") {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 最初の席は無条件に追加
      if (candidates.length === 0) {
        candidates.push(seatId);
        currentIdx++;
        continue;
      }

      // 前の席との隣接チェック
      const prevSeat = candidates[candidates.length - 1];

      // ロボット7人以下で座席8の後に9が来た場合、11にジャンプを試みる
      if (shouldSkipLowPriority && prevSeat === "8" && seatId === "9") {
        if (isAvailable("11") && !ROBOT_SEAT_PRIORITY.floor.includes("11")) {
          candidates.push("11");
          currentIdx = 10; // 座席11のインデックスに移動
          continue;
        } else {
          candidates.length = 0;
          candidates.push(seatId);
          currentIdx++;
          continue;
        }
      }

      // 低優先席（9, 10）のスキップ処理
      if (shouldSkipLowPriority && ROBOT_SEAT_PRIORITY.low.includes(seatId)) {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 通常の隣接チェック（8→11ジャンプなし）
      const isAdjacent = isClockwiseAdjacent(prevSeat, seatId, false);
      if (isAdjacent) {
        candidates.push(seatId);
        currentIdx++;
      } else {
        candidates.length = 0;
        candidates.push(seatId);
        currentIdx++;
      }
    }

    // 必要数が確保できたか確認
    if (candidates.length < totalNeeded) return null;

    // 座席タイプの検証と配置
    return tryArrangeSeats(candidates, requiredCounts);
  };

  /**
   * 連続座席内で各コースの生徒を配置
   *
   * ルール:
   * - ロボット席にはロボット生徒のみ
   * - ゲーム/ファブ席にはゲーム/ファブ/プライム生徒のみ
   */
  const tryArrangeSeats = (
    seats: string[],
    required: CourseCounts
  ): SeatAssignment[] | null => {
    // 座席タイプ別にカウント
    let robotSeatsCount = 0;
    let gameFabSeatsCount = 0;

    for (const seatId of seats) {
      const seatType = getSeatType(seatId);
      if (seatType === "robot") {
        robotSeatsCount++;
      } else if (seatType === "game-fab") {
        gameFabSeatsCount++;
      }
    }

    // 座席数の検証
    if (required.robot > robotSeatsCount) return null;
    if (required.game + required.fab + required.prime > gameFabSeatsCount) return null;

    // 時計回り順序を保持しながら配置
    const result: SeatAssignment[] = [];
    let robotAssigned = 0;
    let gameAssigned = 0;
    let fabAssigned = 0;
    let primeAssigned = 0;

    for (const seatId of seats) {
      const seatType = getSeatType(seatId);

      if (seatType === "robot") {
        // ロボット席にはロボット生徒のみ
        if (robotAssigned < required.robot) {
          result.push({ seatId, mentorId: "", course: "robot" });
          robotAssigned++;
        }
      } else if (seatType === "game-fab") {
        // ゲーム/ファブ席にゲーム、ファブ、プライム生徒を配置
        if (gameAssigned < required.game) {
          result.push({ seatId, mentorId: "", course: "game" });
          gameAssigned++;
        } else if (fabAssigned < required.fab) {
          result.push({ seatId, mentorId: "", course: "fab" });
          fabAssigned++;
        } else if (primeAssigned < required.prime) {
          result.push({ seatId, mentorId: "", course: "prime" });
          primeAssigned++;
        }
      }
    }

    // 全員配置できたか確認
    if (
      robotAssigned === required.robot &&
      gameAssigned === required.game &&
      fabAssigned === required.fab &&
      primeAssigned === required.prime
    ) {
      return result;
    }

    return null;
  };

  // ========================================
  // 授業全体の状況を分析
  // ========================================
  const totalRobotCount = mentors.reduce((sum, mentor) => sum + mentor.counts.robot, 0);

  // ゲーム/ファブ/プライムの合計が4人以上のメンター数をカウント
  const mentorsWithGameFabPrime4Plus = mentors.filter(mentor => {
    const gameFabPrimeCount = mentor.counts.game + mentor.counts.fab + mentor.counts.prime;
    return gameFabPrimeCount >= 4;
  }).length;

  // ゲーム/ファブ/プライムの合計人数
  const totalGameFabPrimeCount = mentors.reduce((sum, mentor) =>
    sum + mentor.counts.game + mentor.counts.fab + mentor.counts.prime, 0);

  // ゲーム/ファブ/プライム2人 + ロボット2人の混合メンターがいるか
  const hasMixedMentor2Plus2 = mentors.some(mentor => {
    const gameFabPrimeCount = mentor.counts.game + mentor.counts.fab + mentor.counts.prime;
    const robotCount = mentor.counts.robot;
    return gameFabPrimeCount === 2 && robotCount === 2;
  });

  // ========================================
  // 座席9,10を解放する条件を判定
  // ========================================
  // 条件1: 授業全体でロボット8人以上
  // 条件2: ゲーム/ファブ/プライムが4人以上のメンターが2人以上
  const useAllRobotSeats = totalRobotCount >= 8 || mentorsWithGameFabPrime4Plus >= 2;

  // ========================================
  // 座席5を使用する条件を判定
  // ========================================
  // 条件1: ゲーム/ファブ/プライムが4人以上のメンターが2人以上
  // 条件2: 授業全体でゲーム/ファブ/プライムの合計が11人以上
  // 条件3: ゲーム/ファブ/プライム2人 + ロボット2人の混合メンターがいる
  const useSeat5 =
    mentorsWithGameFabPrime4Plus >= 2 ||
    totalGameFabPrimeCount >= 11 ||
    hasMixedMentor2Plus2;

  console.log(`[全体戦略]
  ロボット人数: ${totalRobotCount}人
  ゲーム/ファブ/プライム合計: ${totalGameFabPrimeCount}人
  ゲーム/ファブ/プライム4人以上のメンター: ${mentorsWithGameFabPrime4Plus}人
  混合メンター(G/F/P2人+RC2人): ${hasMixedMentor2Plus2 ? 'あり' : 'なし'}
  → 座席9,10を${useAllRobotSeats ? '使用' : '避ける'}
  → 座席5を${useSeat5 ? '使用' : '使用しない'}`);

  // ========================================
  // メンター優先順位の決定
  // ========================================
  // 総人数が多いメンターを優先
  const sortedMentors = [...mentors].sort((a, b) => {
    const aTotal = a.counts.robot + a.counts.game + a.counts.fab + a.counts.prime;
    const bTotal = b.counts.robot + b.counts.game + b.counts.fab + b.counts.prime;
    return bTotal - aTotal;
  });

  // ========================================
  // メンター毎に座席を配置
  // ========================================
  for (const mentor of sortedMentors) {
    let continuousAssignments: SeatAssignment[] | null = null;

    // 全体戦略に基づいて座席を配置
    if (useAllRobotSeats) {
      // 授業全体でロボット8人以上: 座席9,10も使用
      console.log(`[配置] ${mentor.label}: 座席9,10も使用`);
      continuousAssignments = findContinuousSeats(mentor.counts, true, useSeat5);
    } else {
      // 授業全体でロボット7人以下: 座席9,10を避ける
      console.log(`[配置] ${mentor.label}: 座席9,10を避ける`);
      continuousAssignments = findContinuousSeats(mentor.counts, false, useSeat5);

      // 失敗したら座席9,10も含めて再試行
      if (!continuousAssignments) {
        console.log(`[再試行] ${mentor.label}: 座席9,10も含めて再試行`);
        continuousAssignments = findContinuousSeats(mentor.counts, true, useSeat5);
      }
    }

    // 配置成功
    if (continuousAssignments) {
      console.log(`[配置成功] ${mentor.label}: 座席 ${continuousAssignments.map(a => a.seatId).join(',')}`);

      for (const assignment of continuousAssignments) {
        assignSeat(assignment.seatId, mentor.id, assignment.course);
      }
      continue;
    }

    // 配置失敗: 床席を使用
    console.warn(`[警告] ${mentor.label}: 連続座席が見つかりません。床席を使用します。`);

    // ロボット生徒を床に配置
    if (mentor.counts.robot > 0) {
      assignToFloor(mentor.id, mentor.counts.robot);
    }

    // エラーとして記録
    errors.push({
      mentorId: mentor.id,
      mentorLabel: mentor.label,
      unassignedCounts: {
        robot: 0,
        game: mentor.counts.game,
        fab: mentor.counts.fab,
        prime: mentor.counts.prime,
      },
      reason: "連続した座席を確保できませんでした。",
    });
  }

  // ========================================
  // 結果を返す
  // ========================================
  const floor: FloorAllocation | null =
    floorOwnerId && floorTotal > 0
      ? {
          ownerMentorId: floorOwnerId,
          total: floorTotal,
          contributors: Array.from(floorContributors.entries()).map(
            ([mentorId, count]) => ({ mentorId, count })
          ),
          seatIds: floorSeatIds,
        }
      : null;

  return {
    assignments,
    floor,
    errors,
  };
};
