export type CourseType = "robot" | "game" | "fab";

export interface CourseCounts {
  robot: number;
  game: number;
  fab: number;
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
}

export interface AssignmentResult {
  assignments: SeatAssignment[];
  floor: FloorAllocation | null;
}
