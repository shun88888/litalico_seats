"use client";

import { useMemo, useReducer } from "react";

import { ClassroomView } from "@/components/classroom-view";
import { MentorPanel } from "@/components/mentor-panel";
import { assignSeats } from "@/lib/assign-seats";
import { getMentorColor } from "@/lib/colors";
import type {
  AssignmentResult,
  CourseType,
  Mentor,
} from "@/types/seating";

interface SeatingState {
  mentors: Mentor[];
  assignments: AssignmentResult | null;
  counter: number;
}

type SeatingAction =
  | { type: "add-mentor" }
  | { type: "remove-mentor"; mentorId: string }
  | {
      type: "update-count";
      mentorId: string;
      course: CourseType;
      value: number;
    }
  | { type: "set-assignments"; assignments: AssignmentResult }
  | { type: "reset-assignments" };

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

const normalizeLabels = (mentors: Mentor[]): Mentor[] =>
  mentors.map((mentor, index) => ({
    ...mentor,
    label: `メンター${index + 1}`,
  }));

const seatingReducer = (state: SeatingState, action: SeatingAction): SeatingState => {
  switch (action.type) {
    case "add-mentor": {
      const nextCounter = state.counter + 1;
      const nextMentors = normalizeLabels([
        ...state.mentors,
        createMentor(nextCounter),
      ]);
      return {
        mentors: nextMentors,
        assignments: null,
        counter: nextCounter,
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
        mentors: normalizeLabels(filtered),
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
    default:
      return state;
  }
};

const initialState: SeatingState = {
  mentors: [createMentor(1)],
  assignments: null,
  counter: 1,
};

export default function Page() {
  const [state, dispatch] = useReducer(seatingReducer, initialState);

  const mentorColors = useMemo(() => {
    return state.mentors.reduce<Record<string, string>>((acc, mentor, index) => {
      acc[mentor.id] = getMentorColor(index);
      return acc;
    }, {});
  }, [state.mentors]);

  const handleAddMentor = () => dispatch({ type: "add-mentor" });

  const handleRemoveMentor = (mentorId: string) =>
    dispatch({ type: "remove-mentor", mentorId });

  const handleUpdateCount = (
    mentorId: string,
    course: CourseType,
    value: number
  ) => dispatch({ type: "update-count", mentorId, course, value });

  const handleCreate = () => {
    const assignments = assignSeats(state.mentors);
    dispatch({ type: "set-assignments", assignments });
  };

  const handleReset = () => dispatch({ type: "reset-assignments" });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 py-12">
      <div className="container mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            LITALICOワンダー
          </p>
          <h1 className="text-3xl font-semibold text-slate-700 md:text-4xl">
            授業席配置システム
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            メンターごとの受講人数を入力すると、教室図に自動で座席割り当てを表示します。
          </p>
        </header>
        <section className="grid gap-6 lg:grid-cols-[360px,1fr] xl:grid-cols-[380px,1fr]">
          <MentorPanel
            mentors={state.mentors}
            onAdd={handleAddMentor}
            onRemove={handleRemoveMentor}
            onUpdateCount={handleUpdateCount}
            onCreate={handleCreate}
            onResetAssignments={handleReset}
            mentorColors={mentorColors}
            assignments={state.assignments}
          />
          <ClassroomView
            mentors={state.mentors}
            mentorColors={mentorColors}
            assignments={state.assignments}
          />
        </section>
      </div>
    </main>
  );
}
