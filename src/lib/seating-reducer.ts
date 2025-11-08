import type { AssignmentResult, CourseType, Mentor } from "@/types/seating";

// Available mentor names
export const MENTOR_NAMES = [
  "か@ー",
  "わか@@",
  "し@す",
  "あ@",
  "もっ@ー",
  "す@",
  "あー@@",
  "も@",
  "きな@",
  "しょ@@",
  "なか@@@",
  "ヘルプ1",
  "ヘルプ2",
  "ヘルプ3",
];

export interface SeatingState {
  mentors: Mentor[];
  assignments: AssignmentResult | null;
  counter: number;
  memo: string;
}

export type SeatingAction =
  | { type: "add-mentor" }
  | { type: "remove-mentor"; mentorId: string }
  | {
      type: "update-count";
      mentorId: string;
      course: CourseType;
      value: number;
    }
  | {
      type: "update-mentor-name";
      mentorId: string;
      name: string;
    }
  | { type: "set-assignments"; assignments: AssignmentResult }
  | { type: "reset-assignments" }
  | { type: "reset-all" }
  | {
      type: "manual-assign-seat";
      seatId: string;
      mentorId: string | null;
      course: CourseType;
    }
  | { type: "update-memo"; memo: string };

const createMentor = (index: number): Mentor => ({
  id: `mentor-${index}`,
  label: `メンター${index}`,
  counts: {
    robot: 0,
    game: 0,
    fab: 0,
    prime: 0,
  },
});

/**
 * 既存のメンターから空いている最小の番号を見つける
 */
const findNextAvailableNumber = (mentors: Mentor[]): number => {
  // 既存のメンター番号を抽出（mentor-1 → 1）
  const existingNumbers = mentors
    .map(m => {
      const match = m.id.match(/mentor-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  // 1から順番にチェックして、使われていない最小の番号を返す
  let number = 1;
  while (existingNumbers.includes(number)) {
    number++;
  }
  return number;
};

export const seatingReducer = (
  state: SeatingState,
  action: SeatingAction
): SeatingState => {
  switch (action.type) {
    case "add-mentor": {
      // 空いている最小の番号を見つける
      const nextNumber = findNextAvailableNumber(state.mentors);
      const nextMentors = [...state.mentors, createMentor(nextNumber)];
      return {
        mentors: nextMentors,
        assignments: null,
        counter: state.counter, // counterは使わなくなったが、互換性のため保持
      };
    }
    case "remove-mentor": {
      if (state.mentors.length <= 1) {
        return state;
      }
      const filtered = state.mentors.filter(
        (mentor) => mentor.id !== action.mentorId
      );
      return {
        mentors: filtered,
        assignments: null,
        counter: state.counter,
      };
    }
    case "update-count": {
      const updated = state.mentors.map((mentor) =>
        mentor.id === action.mentorId
          ? {
              ...mentor,
              counts: {
                ...mentor.counts,
                [action.course]: action.value,
              },
            }
          : mentor
      );
      return {
        mentors: updated,
        assignments: null,
        counter: state.counter,
      };
    }
    case "update-mentor-name": {
      const updatedMentors = state.mentors.map((mentor) =>
        mentor.id === action.mentorId
          ? {
              ...mentor,
              label: action.name,
            }
          : mentor
      );
      return {
        mentors: updatedMentors,
        assignments: null,
        counter: state.counter,
      };
    }
    case "set-assignments":
      return {
        ...state,
        assignments: action.assignments,
      };
    case "reset-assignments":
      return {
        ...state,
        assignments: null,
      };
    case "reset-all":
      return initialState;
    case "manual-assign-seat": {
      // 自動配置が未実施の場合は、空の配置結果を作成
      const currentAssignments = state.assignments ?? {
        assignments: [],
        floor: null,
        errors: [],
      };

      // 既存の座席割り当てから該当座席を削除
      const filteredAssignments = currentAssignments.assignments.filter(
        (a) => a.seatId !== action.seatId
      );

      // メンターが指定されている場合のみ新しい割り当てを追加
      const newAssignments =
        action.mentorId !== null
          ? [
              ...filteredAssignments,
              {
                seatId: action.seatId,
                mentorId: action.mentorId,
                course: action.course,
              },
            ]
          : filteredAssignments;

      return {
        ...state,
        assignments: {
          ...currentAssignments,
          assignments: newAssignments,
        },
      };
    }
    case "update-memo":
      return {
        ...state,
        memo: action.memo,
      };
    default:
      return state;
  }
};

export const initialState: SeatingState = {
  mentors: [createMentor(1)],
  assignments: null,
  counter: 1,
  memo: "",
};
