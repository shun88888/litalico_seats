"use client";

import { useMemo, useReducer, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Settings, Home } from "lucide-react";

import { ClassroomView } from "@/components/classroom-view";
import { MentorPanel } from "@/components/mentor-panel";
import { assignSeats } from "@/lib/assign-seats";
import { getMentorColor } from "@/lib/colors";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
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

const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-slate-700 py-1 relative z-20"
    >
      <Home className="h-6 w-6 flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-slate-700 whitespace-pre"
      >
        LITALICO
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-slate-700 py-1 relative z-20"
    >
      <Home className="h-6 w-6 flex-shrink-0" />
    </Link>
  );
};

export default function Page() {
  const [state, dispatch] = useReducer(seatingReducer, initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const links = [
    {
      label: "ホーム",
      href: "#",
      icon: <Home className="text-slate-700 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "メンター",
      href: "#",
      icon: <Users className="text-slate-700 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "設定",
      href: "#",
      icon: <Settings className="text-slate-700 h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className={cn("mx-auto max-w-6xl px-4 sm:px-6 lg:px-8", !sidebarOpen && "balanced-left-padding") }>
        <div className="flex flex-col md:flex-row gap-0 py-12">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <div className="mt-8 flex flex-col gap-2">
                  {links.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
            </SidebarBody>
          </Sidebar>

          {/* overlay removed */}

          <div className="flex-1 overflow-x-hidden relative">
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
        </div>
      </div>
    </main>
  );
}
