import {
  SEATS,
  getAdjacentSeats,
  getSeatType,
  getSeatsByType,
  CLOCKWISE_ORDER,
  PREFERRED_SEAT_GROUPS,
  isClockwiseAdjacent,
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

export const assignSeats = (mentors: Mentor[]): AssignmentResult => {
  const assignments: SeatAssignment[] = [];
  const assignedSeats = new Set<string>();
  const errors: AssignmentError[] = [];

  let floorOwnerId: string | null = null;
  const floorContributors = new Map<string, number>();
  let floorTotal = 0;

  const assignToFloor = (mentorId: string, count: number) => {
    if (count <= 0) return;
    if (!floorOwnerId) {
      floorOwnerId = mentorId;
    }
    floorTotal += count;
    const current = floorContributors.get(mentorId) ?? 0;
    floorContributors.set(mentorId, current + count);
  };

  const isAvailable = (seatId: string): boolean => {
    return !assignedSeats.has(seatId);
  };

  const assignSeat = (seatId: string, mentorId: string, course: CourseType) => {
    assignments.push({ seatId, mentorId, course });
    assignedSeats.add(seatId);
  };

  /**
   * 座席タイプの厳格な制約チェック
   * - ロボット(RC)生徒: ロボット席(7,8,9,10,11,12,19,20,21)のみ使用可能
   * - ゲーム(PG)・ファブ(DF)・プライム(RT)生徒: ゲーム/ファブ席(1,2,3,4,5,6,13,14,15,16,17,18)のみ使用可能
   * - 相互利用は一切不可
   */
  const canUseSeat = (seatId: string, courseType: CourseType): boolean => {
    const seatType = getSeatType(seatId);
    if (!seatType) return false;

    // ロボット生徒はロボット席のみ（長方形の机は使用不可）
    if (courseType === "robot") {
      return seatType === "robot";
    }
    // ゲーム・ファブ・プライム生徒はゲーム/ファブ席のみ（ロボット机は使用不可）
    return seatType === "game-fab";
  };

  /**
   * 時計回り順で連続した空き座席を探す（経験則に基づく優先順位付き）
   */
  const findContinuousSeats = (
    requiredCounts: CourseCounts
  ): SeatAssignment[] | null => {
    const totalNeeded =
      requiredCounts.robot + requiredCounts.game + requiredCounts.fab + requiredCounts.prime;
    const gameFabPrimeCount = requiredCounts.game + requiredCounts.fab + requiredCounts.prime;

    // 経験則による開始位置の優先順位を決定
    const startPositions: number[] = [];

    // ゲーム/ファブ/プライムが4人以上なら上部L字エリア（1,2,3,4）を最優先
    if (gameFabPrimeCount >= 4 && requiredCounts.robot === 0) {
      // ゲーム/ファブ/プライムのみの場合、座席1から開始（1,2,3,4の連続4席）
      startPositions.push(0); // インデックス0 = 座席1
    }

    // ロボット+ゲーム/ファブ/プライムの混合なら混合エリアを優先
    if (requiredCounts.robot > 0 && gameFabPrimeCount > 0) {
      // 経験則: 20,19,18,17 や 5,6,7,8 や 11,12,13,14
      startPositions.push(19, 4, 10, 16); // 座席20, 5, 11, 17から開始
    }

    // その他のゲーム/ファブ/プライム4人以上のケース
    if (gameFabPrimeCount >= 4 && !startPositions.includes(0)) {
      startPositions.push(0, 1, 2, 3); // 座席1,2,3,4から
    }

    // その他の全位置も試す
    for (let i = 0; i < 23; i++) {
      if (!startPositions.includes(i)) {
        startPositions.push(i);
      }
    }

    // 各開始位置から連続座席を探す
    for (const startIdx of startPositions) {
      const result = tryFromPosition(startIdx, totalNeeded, requiredCounts);
      if (result) return result;
    }

    return null;
  };

  /**
   * 指定位置から時計回りに連続座席を試す
   */
  const tryFromPosition = (
    startIdx: number,
    totalNeeded: number,
    requiredCounts: CourseCounts
  ): SeatAssignment[] | null => {
    const candidates: string[] = [];
    let currentIdx = startIdx;

    // 連続座席を収集（最大23+totalNeeded回ループして循環対応）
    for (let i = 0; i < 23 && candidates.length < totalNeeded; i++) {
      const seatId = CLOCKWISE_ORDER[currentIdx % 23];

      // 空きチェック
      if (!isAvailable(seatId)) {
        // 連続が途切れたらリセット
        candidates.length = 0;
        currentIdx++;
        continue;
      }

      // 隣接チェック（最初の席 or 前の席と隣接している）
      if (
        candidates.length === 0 ||
        isClockwiseAdjacent(candidates[candidates.length - 1], seatId)
      ) {
        candidates.push(seatId);
        currentIdx++;
      } else {
        // 隣接していない場合はリセット
        candidates.length = 0;
        candidates.push(seatId);
        currentIdx++;
      }
    }

    // デバッグ: 候補座席を出力
    if (candidates.length >= totalNeeded) {
      console.log(`[tryFromPosition] 開始=${CLOCKWISE_ORDER[startIdx]}, 候補=[${candidates.join(',')}]`);
    }

    // 必要数が確保できなかった
    if (candidates.length < totalNeeded) {
      return null;
    }

    // 座席タイプの検証と配置
    return tryArrangeSeats(candidates, requiredCounts);
  };

  /**
   * 連続座席内で各コースの生徒を配置
   * 時計回り順序を保持しながら、各座席タイプに適切に配置する
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
      if (seatType === "robot") robotSeatsCount++;
      else if (seatType === "game-fab") gameFabSeatsCount++;
    }

    // ロボット生徒がロボット席に収まるか
    if (required.robot > robotSeatsCount) return null;

    // ゲーム・ファブ・プライム生徒がゲームファブ席に収まるか
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
        // ロボット席にはロボット生徒のみ配置可能
        if (robotAssigned < required.robot) {
          result.push({ seatId, mentorId: "", course: "robot" });
          robotAssigned++;
        }
        // ロボット席が余っても他のコースは配置しない
      } else if (seatType === "game-fab") {
        // ゲーム/ファブ/プライム席にゲーム、ファブ、またはプライム生徒を配置
        // ロボット生徒は配置しない（厳格なルール）
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
        // game-fab席が余ってもロボットは配置しない
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

  const findNearestAvailableSeat = (
    mentorAssignedSeats: string[],
    courseType: CourseType
  ): string | null => {
    if (mentorAssignedSeats.length === 0) {
      // 最初の座席：適切なタイプの座席を探す
      const targetType = courseType === "robot" ? "robot" : "game-fab";
      const availableSeats = getSeatsByType(targetType).filter(isAvailable);
      return availableSeats[0] ?? null;
    }

    // すでに配置済みの座席がある場合：時計回り順で隣接する座席を優先
    const adjacentSeats = new Set<string>();

    // 全ての配置済み座席の隣接座席を収集
    for (const assignedSeat of mentorAssignedSeats) {
      const adjacent = getAdjacentSeats(assignedSeat);
      for (const adjSeat of adjacent) {
        if (isAvailable(adjSeat) && canUseSeat(adjSeat, courseType)) {
          adjacentSeats.add(adjSeat);
        }
      }
    }

    // 隣接座席がある場合、時計回り順で最も近いものを返す
    if (adjacentSeats.size > 0) {
      const adjacentArray = Array.from(adjacentSeats);

      // 配置済み座席の中で最後の座席を取得
      const lastAssignedSeat = mentorAssignedSeats[mentorAssignedSeats.length - 1];
      const lastIdx = (CLOCKWISE_ORDER as readonly string[]).indexOf(lastAssignedSeat);

      // 時計回りで最も近い隣接座席を探す
      for (let offset = 1; offset <= 23; offset++) {
        const nextIdx = (lastIdx + offset) % 23;
        const candidateSeat = CLOCKWISE_ORDER[nextIdx];
        if (adjacentArray.includes(candidateSeat)) {
          return candidateSeat;
        }
      }

      // 見つからない場合は最初のもの
      return adjacentArray[0];
    }

    // 隣接座席がない場合：適切なタイプの任意の空き席を探す
    const targetType = courseType === "robot" ? "robot" : "game-fab";
    const availableSeats = getSeatsByType(targetType).filter(isAvailable);
    return availableSeats[0] ?? null;
  };

  /**
   * メンターの優先順位を決定
   * 1. ゲーム/ファブ/プライムが4人以上のメンターを最優先（座席1,2,3,4が必要）
   * 2. 次に総人数が多いメンター
   * 3. 同じ人数なら元の順序を保持
   */
  const sortedMentors = [...mentors].sort((a, b) => {
    const aGameFabPrime = a.counts.game + a.counts.fab + a.counts.prime;
    const bGameFabPrime = b.counts.game + b.counts.fab + b.counts.prime;
    const aTotal = a.counts.robot + aGameFabPrime;
    const bTotal = b.counts.robot + bGameFabPrime;

    // ゲーム/ファブ/プライム4人以上が最優先
    const aHasGameFabPrime4Plus = aGameFabPrime >= 4 && a.counts.robot === 0;
    const bHasGameFabPrime4Plus = bGameFabPrime >= 4 && b.counts.robot === 0;

    if (aHasGameFabPrime4Plus && !bHasGameFabPrime4Plus) return -1;
    if (!aHasGameFabPrime4Plus && bHasGameFabPrime4Plus) return 1;

    // 次に総人数が多い順
    if (aTotal !== bTotal) return bTotal - aTotal;

    // 同じなら元の順序を保持
    return 0;
  });

  // デバッグ: ソート後の順序を出力
  console.log('[優先順位] ソート後のメンター順序:', sortedMentors.map(m =>
    `${m.label}(RC:${m.counts.robot},PG:${m.counts.game},DF:${m.counts.fab},RT:${m.counts.prime})`
  ));

  /**
   * 部分的な座席配置を試みる（N人中M人を座席に配置し、残りを床に）
   * 床は最終手段として使用する
   */
  const tryPartialSeatingWithFloor = (
    mentor: Mentor
  ): { seated: SeatAssignment[], floorCount: number } | null => {
    const totalNeeded = mentor.counts.robot + mentor.counts.game + mentor.counts.fab + mentor.counts.prime;

    // N人から1人ずつ減らして連続座席を探す
    for (let seatedCount = totalNeeded; seatedCount >= 2; seatedCount--) {
      // ロボットを優先的に減らす（床はロボットのみ）
      for (let robotFloor = 0; robotFloor <= mentor.counts.robot && totalNeeded - robotFloor >= seatedCount; robotFloor++) {
        const reducedCounts: CourseCounts = {
          robot: mentor.counts.robot - robotFloor,
          game: mentor.counts.game,
          fab: mentor.counts.fab,
          prime: mentor.counts.prime,
        };

        const result = findContinuousSeats(reducedCounts);
        if (result) {
          return { seated: result, floorCount: robotFloor };
        }
      }
    }

    return null;
  };

  // メンター毎に処理（優先順位順）
  for (const mentor of sortedMentors) {
    // Step 1: 全員分の連続座席での配置を試みる
    const continuousAssignments = findContinuousSeats(mentor.counts);

    if (continuousAssignments) {
      // 連続座席に配置成功
      console.log(`[配置成功] ${mentor.label}: 座席 ${continuousAssignments.map(a => `${a.seatId}(${a.course})`).join(',')}`);

      // 配置前にルール違反チェック（デバッグ用）
      for (const assignment of continuousAssignments) {
        const seatType = getSeatType(assignment.seatId);
        if (assignment.course === "robot" && seatType !== "robot") {
          console.error(`[エラー] ロボット生徒が非ロボット席(${assignment.seatId})に配置されようとしています！`);
        } else if (assignment.course !== "robot" && seatType === "robot") {
          console.error(`[エラー] ${assignment.course}生徒がロボット席(${assignment.seatId})に配置されようとしています！`);
        }
      }

      for (const assignment of continuousAssignments) {
        assignSeat(assignment.seatId, mentor.id, assignment.course);
      }
      continue; // 次のメンターへ
    }

    // Step 2: 部分配置 + 床を試みる（床は最終手段）
    const partialResult = tryPartialSeatingWithFloor(mentor);
    if (partialResult) {
      console.log(`[部分配置] ${mentor.label}: 座席 ${partialResult.seated.map(a => a.seatId).join(',')} + 床 ${partialResult.floorCount}人`);

      // 座席に配置
      for (const assignment of partialResult.seated) {
        assignSeat(assignment.seatId, mentor.id, assignment.course);
      }

      // 床に配置
      if (partialResult.floorCount > 0) {
        assignToFloor(mentor.id, partialResult.floorCount);
      }

      continue; // 次のメンターへ
    }

    // Step 3: どうしても配置できない場合のフォールバック（隣接チェック付き）
    // このケースはほとんど発生しないはずだが、念のため実装
    console.warn(`[警告] ${mentor.label}: 連続座席も部分配置も不可能。個別配置を試みます。`);

    const mentorAssignedSeats: string[] = [];
    let totalRobotFloor = 0;

    // 配置できなかった生徒数を追跡
    let unassignedRobot = 0;
    let unassignedGame = 0;
    let unassignedFab = 0;
    let unassignedPrime = 0;

    // ロボット生徒を配置（隣接チェック付き）
    let robotRemaining = mentor.counts.robot;
    while (robotRemaining > 0) {
      const seat = findNearestAvailableSeat(mentorAssignedSeats, "robot");

      if (seat) {
        // 隣接チェック：既に座席がある場合、隣接しているかチェック
        if (mentorAssignedSeats.length > 0) {
          const isAdjacent = mentorAssignedSeats.some(assignedSeat => {
            const adjacent = getAdjacentSeats(assignedSeat);
            return adjacent.includes(seat);
          });

          if (!isAdjacent) {
            // 隣接していない場合は床へ
            console.log(`[床配置] ${mentor.label}: 座席${seat}は既存座席と隣接していないため、残り${robotRemaining}人を床へ`);
            assignToFloor(mentor.id, robotRemaining);
            totalRobotFloor += robotRemaining;
            break;
          }
        }

        assignSeat(seat, mentor.id, "robot");
        mentorAssignedSeats.push(seat);
        robotRemaining--;
      } else {
        // ロボット席がない場合は床へ
        assignToFloor(mentor.id, robotRemaining);
        totalRobotFloor += robotRemaining;
        break;
      }
    }

    // ゲーム生徒を配置（隣接チェック付き）
    let gameRemaining = mentor.counts.game;
    while (gameRemaining > 0) {
      const seat = findNearestAvailableSeat(mentorAssignedSeats, "game");

      if (seat) {
        // 隣接チェック
        if (mentorAssignedSeats.length > 0) {
          const isAdjacent = mentorAssignedSeats.some(assignedSeat => {
            const adjacent = getAdjacentSeats(assignedSeat);
            return adjacent.includes(seat);
          });

          if (!isAdjacent) {
            // 隣接していない場合は配置しない
            console.log(`[配置不可] ${mentor.label}: ゲーム生徒の座席${seat}が隣接していないため、残り${gameRemaining}人は配置できません`);
            unassignedGame = gameRemaining;
            break;
          }
        }

        assignSeat(seat, mentor.id, "game");
        mentorAssignedSeats.push(seat);
        gameRemaining--;
      } else {
        unassignedGame = gameRemaining;
        break;
      }
    }

    // ファブ生徒を配置（隣接チェック付き）
    let fabRemaining = mentor.counts.fab;
    while (fabRemaining > 0) {
      const seat = findNearestAvailableSeat(mentorAssignedSeats, "fab");

      if (seat) {
        // 隣接チェック
        if (mentorAssignedSeats.length > 0) {
          const isAdjacent = mentorAssignedSeats.some(assignedSeat => {
            const adjacent = getAdjacentSeats(assignedSeat);
            return adjacent.includes(seat);
          });

          if (!isAdjacent) {
            console.log(`[配置不可] ${mentor.label}: ファブ生徒の座席${seat}が隣接していないため、残り${fabRemaining}人は配置できません`);
            unassignedFab = fabRemaining;
            break;
          }
        }

        assignSeat(seat, mentor.id, "fab");
        mentorAssignedSeats.push(seat);
        fabRemaining--;
      } else {
        unassignedFab = fabRemaining;
        break;
      }
    }

    // プライム生徒を配置（隣接チェック付き）
    let primeRemaining = mentor.counts.prime;
    while (primeRemaining > 0) {
      const seat = findNearestAvailableSeat(mentorAssignedSeats, "prime");

      if (seat) {
        // 隣接チェック
        if (mentorAssignedSeats.length > 0) {
          const isAdjacent = mentorAssignedSeats.some(assignedSeat => {
            const adjacent = getAdjacentSeats(assignedSeat);
            return adjacent.includes(seat);
          });

          if (!isAdjacent) {
            console.log(`[配置不可] ${mentor.label}: プライム生徒の座席${seat}が隣接していないため、残り${primeRemaining}人は配置できません`);
            unassignedPrime = primeRemaining;
            break;
          }
        }

        assignSeat(seat, mentor.id, "prime");
        mentorAssignedSeats.push(seat);
        primeRemaining--;
      } else {
        unassignedPrime = primeRemaining;
        break;
      }
    }

    // 配置できなかった生徒がいる場合、エラーとして記録
    const totalUnassigned = unassignedRobot + unassignedGame + unassignedFab + unassignedPrime;
    if (totalUnassigned > 0) {
      errors.push({
        mentorId: mentor.id,
        mentorLabel: mentor.label,
        unassignedCounts: {
          robot: unassignedRobot,
          game: unassignedGame,
          fab: unassignedFab,
          prime: unassignedPrime,
        },
        reason: "連続した座席を確保できませんでした。座席数を減らすか、他のメンターの配置を調整してください。",
      });
    }
  }

  const floor: FloorAllocation | null =
    floorOwnerId && floorTotal > 0
      ? {
          ownerMentorId: floorOwnerId,
          total: floorTotal,
          contributors: Array.from(floorContributors.entries()).map(
            ([mentorId, count]) => ({
              mentorId,
              count,
            })
          ),
        }
      : null;

  return {
    assignments,
    floor,
    errors,
  };
};
