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

// Available mentor names
const MENTOR_NAMES = [
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
  | {
      type: "update-mentor-name";
      mentorId: string;
      name: string;
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

const seatingReducer = (state: SeatingState, action: SeatingAction): SeatingState => {
  switch (action.type) {
    case "add-mentor": {
      // 空いている最小の番号を見つける
      const nextNumber = findNextAvailableNumber(state.mentors);
      const nextMentors = [
        ...state.mentors,
        createMentor(nextNumber),
      ];
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
    return state.mentors.reduce<Record<string, string>>((acc, mentor) => {
      acc[mentor.id] = getMentorColor(mentor.id);
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

  const handleUpdateMentorName = (mentorId: string, name: string) =>
    dispatch({ type: "update-mentor-name", mentorId, name });

  const handleCreate = () => {
    const assignments = assignSeats(state.mentors);
    dispatch({ type: "set-assignments", assignments });
  };

  const handleReset = () => dispatch({ type: "reset-assignments" });

  const links = [
    {
      label: "ダッシュボード",
      href: "#",
      icon: (
        <LayoutDashboard className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "メンター設定",
      href: "#",
      icon: (
        <Users className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "設定",
      href: "#",
      icon: (
        <Settings className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className={cn("bg-gradient-to-br from-slate-100 via-white to-slate-200 w-full min-h-screen")}>
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
      <motion.main
        className="overflow-auto"
        initial={{
          marginLeft: "60px",
        }}
        animate={{
          marginLeft: sidebarOpen ? "300px" : "60px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        <div className="container mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <section className="grid gap-6 lg:grid-cols-[360px,1fr] xl:grid-cols-[380px,1fr]">
            <MentorPanel
              mentors={state.mentors}
              onAdd={handleAddMentor}
              onRemove={handleRemoveMentor}
              onUpdateCount={handleUpdateCount}
              onUpdateMentorName={handleUpdateMentorName}
              onCreate={handleCreate}
              onResetAssignments={handleReset}
              mentorColors={mentorColors}
              assignments={state.assignments}
              availableMentorNames={MENTOR_NAMES}
            />
            <ClassroomView
              mentors={state.mentors}
              mentorColors={mentorColors}
              assignments={state.assignments}
            />
          </section>
        </div>
      </motion.main>
    </div>
  );
}
