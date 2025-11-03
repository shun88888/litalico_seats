import { SEAT_SLOTS } from "@/data/seat-map";
import type {
  AssignmentResult,
  CourseType,
  FloorAllocation,
  Mentor,
  SeatSlot,
} from "@/types/seating";

const sortSeats = (a: SeatSlot, b: SeatSlot) => {
  if (a.deskId === b.deskId) {
    return a.slotIndex - b.slotIndex;
  }
  return a.deskId.localeCompare(b.deskId);
};

const allocateSeats = (
  pool: SeatSlot[],
  mentorId: string,
  course: CourseType,
  count: number,
  assignments: AssignmentResult["assignments"]
) => {
  let remaining = count;
  while (remaining > 0 && pool.length > 0) {
    const seat = pool.shift();
    if (!seat) {
      break;
    }
    assignments.push({
      seatId: seat.id,
      mentorId,
      course,
    });
    remaining -= 1;
  }
  return remaining;
};

export const assignSeats = (
  mentors: Mentor[],
  seatSlots: SeatSlot[] = SEAT_SLOTS
): AssignmentResult => {
  const robotPool = seatSlots
    .filter((slot) => slot.type === "robot")
    .sort(sortSeats);
  const gamePool = seatSlots
    .filter((slot) => slot.type === "game")
    .sort(sortSeats);
  const fabPool = seatSlots
    .filter((slot) => slot.type === "fab")
    .sort(sortSeats);

  const assignments: AssignmentResult["assignments"] = [];

  let floorOwnerId: string | null = null;
  const floorContributors = new Map<string, number>();
  let floorTotal = 0;

  const assignToFloor = (mentorId: string, overflow: number) => {
    if (overflow <= 0) {
      return;
    }
    if (!floorOwnerId) {
      floorOwnerId = mentorId;
    }
    floorTotal += overflow;
    const current = floorContributors.get(mentorId) ?? 0;
    floorContributors.set(mentorId, current + overflow);
  };

  for (const mentor of mentors) {
    const robotCount = mentor.counts.robot;
    if (robotCount > 0) {
      const remainingRobot = allocateSeats(
        robotPool,
        mentor.id,
        "robot",
        robotCount,
        assignments
      );
      if (remainingRobot > 0) {
        assignToFloor(mentor.id, remainingRobot);
      }
    }
  }

  for (const mentor of mentors) {
    const gameCount = mentor.counts.game;
    if (gameCount > 0) {
      let remainingGame = allocateSeats(
        gamePool,
        mentor.id,
        "game",
        gameCount,
        assignments
      );
      if (remainingGame > 0) {
        remainingGame = allocateSeats(
          robotPool,
          mentor.id,
          "game",
          remainingGame,
          assignments
        );
      }
    }
  }

  for (const mentor of mentors) {
    const fabCount = mentor.counts.fab;
    if (fabCount > 0) {
      let remainingFab = allocateSeats(
        fabPool,
        mentor.id,
        "fab",
        fabCount,
        assignments
      );
      if (remainingFab > 0) {
        remainingFab = allocateSeats(
          gamePool,
          mentor.id,
          "fab",
          remainingFab,
          assignments
        );
      }
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
  };
};
