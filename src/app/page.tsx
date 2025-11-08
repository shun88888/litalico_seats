"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Settings, Home } from "lucide-react";

import { ClassroomView } from "@/components/classroom-view";
import { MentorPanel } from "@/components/mentor-panel";
import { MemoPanel } from "@/components/memo-panel";
import { assignSeats } from "@/lib/assign-seats";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSeating } from "@/context/seating-context";
import type { CourseType } from "@/types/seating";

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
  const { state, dispatch, mentorColors, availableMentorNames } = useSeating();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

    // 教室座席図にスクロール
    setTimeout(() => {
      const element = document.getElementById("classroom-view");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleReset = () => dispatch({ type: "reset-all" });

  const handleManualAssignSeat = (
    seatId: string,
    mentorId: string | null,
    course: CourseType
  ) => {
    dispatch({ type: "manual-assign-seat", seatId, mentorId, course });
  };

  const links = [
    {
      label: "ダッシュボード",
      href: "/",
      icon: (
        <LayoutDashboard className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "メンター設定",
      href: "/mentor-settings",
      icon: (
        <Users className="text-slate-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "設定",
      href: "/settings",
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
        <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {/* 上段: メンター設定 + メモ欄 */}
          <section className="grid gap-6 lg:grid-cols-2">
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
              availableMentorNames={availableMentorNames}
            />
            <MemoPanel />
          </section>

          {/* 下段: 教室座席図 */}
          <section id="classroom-view">
            <ClassroomView
              mentors={state.mentors}
              mentorColors={mentorColors}
              assignments={state.assignments}
              onManualAssignSeat={handleManualAssignSeat}
            />
          </section>

          {/* エラー・警告表示 */}
          {((state.assignments?.errors && state.assignments.errors.length > 0) ||
            state.assignments?.floor) && (
            <section className="mt-2">
              <div className="space-y-2">
                {/* 床席使用の警告 */}
                {state.assignments?.floor && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-3 shadow-sm">
                    <div className="font-semibold text-yellow-800 mb-2 text-sm">
                      ⚠️ 床席を使用しています
                    </div>
                    <div className="text-yellow-700 text-xs">
                      座席{state.assignments.floor.seatIds.join(", ")}を床席として使用しています。
                      {state.assignments.floor.contributors.length > 0 && (
                        <>
                          <br />
                          使用メンター: {state.assignments.floor.contributors.map(c => {
                            const mentor = state.mentors.find(m => m.id === c.mentorId);
                            return `${mentor?.label || c.mentorId}(${c.count}人)`;
                          }).join(", ")}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 配置エラー */}
                {state.assignments?.errors && state.assignments.errors.map((error) => (
                  <div
                    key={error.mentorId}
                    className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 shadow-sm"
                  >
                    <div className="font-semibold text-red-700 mb-2 text-sm">
                      ⚠️ {error.mentorLabel}: 配置エラー
                    </div>
                    <div className="text-red-600 text-xs">
                      配置できなかった生徒:
                      {error.unassignedCounts.robot > 0 && ` ロボット${error.unassignedCounts.robot}人`}
                      {error.unassignedCounts.game > 0 && ` ゲーム${error.unassignedCounts.game}人`}
                      {error.unassignedCounts.fab > 0 && ` デジファブ${error.unassignedCounts.fab}人`}
                      {error.unassignedCounts.prime > 0 && ` プライム${error.unassignedCounts.prime}人`}
                    </div>
                    <div className="text-red-600 text-xs mt-1">
                      {error.reason}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.main>
    </div>
  );
}
