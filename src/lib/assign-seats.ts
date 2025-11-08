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

  // ========================================
  // 座席配置のコアロジック
  // ========================================

  /**
   * 座席配置に座席9と10が連続で含まれているかチェック
   */
  const hasConsecutive9And10 = (assignments: SeatAssignment[]): boolean => {
    const seatIds = assignments.map(a => a.seatId);
    const has9 = seatIds.includes("9");
    const has10 = seatIds.includes("10");
    return has9 && has10;
  };

  /**
   * 時計回り順で連続した座席を探す
   * @param requiredCounts 各コースの必要人数
   * @param allowLowPriority trueの場合、座席9,10も使用可能
   * @param useSeat5 trueの場合、座席5も使用可能
   * @param avoidLowPriority trueの場合、座席9,10を可能な限り避ける
   * @param excludeFloor trueの場合、床席17,18を除外
   * @returns 座席配置結果 or null
   */
  const findContinuousSeats = (
    requiredCounts: CourseCounts,
    allowLowPriority: boolean = false,
    useSeat5: boolean = true,
    avoidLowPriority: boolean = false,
    excludeFloor: boolean = false
  ): SeatAssignment[] | null => {
    const totalNeeded = requiredCounts.robot + requiredCounts.game + requiredCounts.fab + requiredCounts.prime;
    let fallbackResult: SeatAssignment[] | null = null;  // 座席9,10連続を含む配置（fallback用）

    // 全ての位置から連続座席を探す（時計回り順）
    for (let startIdx = 0; startIdx < 24; startIdx++) {
      const result = tryFromPosition(startIdx, totalNeeded, requiredCounts, allowLowPriority, useSeat5, avoidLowPriority, excludeFloor);

      if (result) {
        // 座席9,10が連続で含まれているかチェック
        if (hasConsecutive9And10(result)) {
          // 座席9,10連続の配置はfallbackとして保存し、探索を続ける
          if (!fallbackResult) {
            fallbackResult = result;
          }
        } else {
          // 座席9,10連続なしの配置が見つかった → 即座に採用
          return result;
        }
      }
    }

    // 座席9,10連続なしの配置が見つからなかった場合、fallbackを返す
    return fallbackResult;
  };

  /**
   * 指定位置から時計回りに連続座席を探す
   *
   * ロボット人数による戦略:
   * - 7人以下: 座席9,10を避けて8→11にジャンプ（allowLowPriority=false時）
   * - 8人以上: 座席9,10も使用（allowLowPriority=true）
   * - avoidLowPriority=true: 座席9,10を可能な限り避ける
   * - excludeFloor=true: 床席17,18を除外
   */
  const tryFromPosition = (
    startIdx: number,
    totalNeeded: number,
    requiredCounts: CourseCounts,
    allowLowPriority: boolean,
    useSeat5: boolean,
    avoidLowPriority: boolean,
    excludeFloor: boolean
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

      // 床席を除外（excludeFloor=trueの場合のみ）
      if (excludeFloor && ROBOT_SEAT_PRIORITY.floor.includes(seatId)) {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 座席5のスキップ処理（開始位置としても避ける）
      if (!useSeat5 && seatId === "5") {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 座席9,10の回避処理（開始位置としても避ける）
      // - avoidLowPriority=true: 座席9,10を完全に避ける
      // - shouldSkipLowPriority=true: 座席8の後の9は11にジャンプ、それ以外の9,10は避ける
      if (avoidLowPriority && ROBOT_SEAT_PRIORITY.low.includes(seatId)) {
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      if (shouldSkipLowPriority && ROBOT_SEAT_PRIORITY.low.includes(seatId)) {
        // 座席8の後に9が来た場合のみ、11へのジャンプを試みる
        if (candidates.length > 0 && candidates[candidates.length - 1] === "8" && seatId === "9") {
          if (isAvailable("11") && !ROBOT_SEAT_PRIORITY.floor.includes("11")) {
            candidates.push("11");
            currentIdx = 10; // 座席11のインデックスに移動
            continue;
          }
        }
        // その他の場合は座席9,10をスキップ
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
   * - ゲーム/デジファブ席にはゲーム/デジファブ/プライム生徒のみ
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
        // ゲーム/デジファブ席にゲーム、デジファブ、プライム生徒を配置
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

  // ゲーム/デジファブ/プライムの合計が4人以上のメンター数をカウント
  const mentorsWithGameFabPrime4Plus = mentors.filter(mentor => {
    const gameFabPrimeCount = mentor.counts.game + mentor.counts.fab + mentor.counts.prime;
    return gameFabPrimeCount >= 4;
  }).length;

  // ゲーム/デジファブ/プライムの合計人数
  const totalGameFabPrimeCount = mentors.reduce((sum, mentor) =>
    sum + mentor.counts.game + mentor.counts.fab + mentor.counts.prime, 0);

  // ゲーム/デジファブ/プライム2人 + ロボット2人の混合メンターがいるか
  const hasMixedMentor2Plus2 = mentors.some(mentor => {
    const gameFabPrimeCount = mentor.counts.game + mentor.counts.fab + mentor.counts.prime;
    const robotCount = mentor.counts.robot;
    return gameFabPrimeCount === 2 && robotCount === 2;
  });

  // ========================================
  // 座席9,10を解放する条件を判定
  // ========================================
  // 条件1: 授業全体でロボット8人以上
  // 条件2: ゲーム/デジファブ/プライムが4人以上のメンターが2人以上
  const useAllRobotSeats = totalRobotCount >= 8 || mentorsWithGameFabPrime4Plus >= 2;

  // ========================================
  // 座席5を使用する条件を判定
  // ========================================
  // 条件1: ゲーム/デジファブ/プライムが4人以上のメンターが2人以上
  // 条件2: 授業全体でゲーム/デジファブ/プライムの合計が11人以上
  // 条件3: ゲーム/デジファブ/プライム2人 + ロボット2人の混合メンターがいる
  const useSeat5 =
    mentorsWithGameFabPrime4Plus >= 2 ||
    totalGameFabPrimeCount >= 11 ||
    hasMixedMentor2Plus2;

  console.log(`[全体戦略]
  ロボット人数: ${totalRobotCount}人
  ゲーム/デジファブ/プライム合計: ${totalGameFabPrimeCount}人
  ゲーム/デジファブ/プライム4人以上のメンター: ${mentorsWithGameFabPrime4Plus}人
  混合メンター(G/DF/P2人+RC2人): ${hasMixedMentor2Plus2 ? 'あり' : 'なし'}
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
  // メンター毎に座席を配置（3段階探索）
  // ========================================
  for (const mentor of sortedMentors) {
    let continuousAssignments: SeatAssignment[] | null = null;

    // 【第1段階】座席9,10と床席17,18を避けて探す
    console.log(`[第1段階] ${mentor.label}: 座席9,10と床席17,18を避けて探索`);
    continuousAssignments = findContinuousSeats(
      mentor.counts,
      false,      // allowLowPriority: 座席9,10を使わない
      useSeat5,
      false,      // avoidLowPriority: 不要（allowLowPriorityがfalseなので）
      true        // excludeFloor: 床席17,18を除外
    );

    // 【第2段階】座席9,10は使うが、床席17,18は避ける
    if (!continuousAssignments) {
      console.log(`[第2段階] ${mentor.label}: 座席9,10を使用、床席17,18は除外`);
      continuousAssignments = findContinuousSeats(
        mentor.counts,
        true,       // allowLowPriority: 座席9,10を使う
        useSeat5,
        false,      // avoidLowPriority: 座席9,10を普通に使う
        true        // excludeFloor: 床席17,18を除外
      );
    }

    // 【第3段階】床席17,18も含めて探す（最終手段）
    if (!continuousAssignments) {
      console.log(`[第3段階] ${mentor.label}: 床席17,18も含めて探索`);
      continuousAssignments = findContinuousSeats(
        mentor.counts,
        true,       // allowLowPriority: 座席9,10を使う
        useSeat5,
        false,      // avoidLowPriority: 座席9,10を普通に使う
        false       // excludeFloor: 床席17,18も使用可能
      );
    }

    // 配置成功
    if (continuousAssignments) {
      console.log(`[配置成功] ${mentor.label}: 座席 ${continuousAssignments.map(a => a.seatId).join(',')}`);

      for (const assignment of continuousAssignments) {
        assignSeat(assignment.seatId, mentor.id, assignment.course);
      }
      continue;
    }

    // 配置失敗: エラーとして記録
    console.error(`[配置失敗] ${mentor.label}: 連続座席が見つかりませんでした`);
    errors.push({
      mentorId: mentor.id,
      mentorLabel: mentor.label,
      unassignedCounts: mentor.counts,
      reason: "連続した座席を確保できませんでした。",
    });
  }

  // ========================================
  // 床席使用チェック
  // ========================================
  const floorSeatIds = ["17", "18"];
  const floorAssignments = assignments.filter(a => floorSeatIds.includes(a.seatId));

  let floor = null;
  if (floorAssignments.length > 0) {
    // 床席を使用しているメンターごとの人数を集計
    const contributorsMap = new Map<string, number>();
    floorAssignments.forEach(assignment => {
      const count = contributorsMap.get(assignment.mentorId) || 0;
      contributorsMap.set(assignment.mentorId, count + 1);
    });

    const contributors = Array.from(contributorsMap.entries()).map(([mentorId, count]) => ({
      mentorId,
      count,
    }));

    // 最も多く使用しているメンターをオーナーとする
    const owner = contributors.reduce((max, current) =>
      current.count > max.count ? current : max
    );

    floor = {
      ownerMentorId: owner.mentorId,
      total: floorAssignments.length,
      contributors,
      seatIds: floorAssignments.map(a => a.seatId),
    };
  }

  // ========================================
  // 結果を返す
  // ========================================
  return {
    assignments,
    floor,
    errors,
  };
};
