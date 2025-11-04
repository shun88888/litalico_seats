export type CourseType = "robot" | "game" | "fab" | "prime";

export interface CourseCounts {
  robot: number;
  game: number;
  fab: number;
  prime: number;
}

export interface Mentor {
  id: string;
  label: string;
  counts: CourseCounts;
}

export type SeatType = CourseType;

export interface SeatSlot {
  id: string;
  deskId: string;
  type: SeatType;
  slotIndex: number;
  position: {
    x: number;
    y: number;
  };
}

export interface DeskDefinition {
  id: string;
  label: string;
  type: SeatType;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  notes?: string;
  seats: SeatSlot[];
}

export interface SeatAssignment {
  seatId: string;
  mentorId: string;
  course: CourseType;
}

export interface FloorAllocation {
  ownerMentorId: string;
  total: number;
  contributors: Array<{ mentorId: string; count: number }>;
  // 床席の具体的な座席ID（17または18）
  seatIds: string[];
}

export interface AssignmentError {
  mentorId: string;
  mentorLabel: string;
  unassignedCounts: CourseCounts;
  reason: string;
}

export interface AssignmentResult {
  assignments: SeatAssignment[];
  floor: FloorAllocation | null;
  errors: AssignmentError[];
}
