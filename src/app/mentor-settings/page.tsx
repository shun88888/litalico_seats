"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Settings, Home, Plus } from "lucide-react";
import { useSeating } from "@/context/seating-context";
import { MentorCard } from "@/components/mentor-settings/mentor-card";
import { MentorStats } from "@/components/mentor-settings/mentor-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { assignSeats } from "@/lib/assign-seats";
import { cn } from "@/lib/utils";

const Logo = () => {
  return (
    <Link
      href="/"
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
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-slate-700 py-1 relative z-20"
    >
      <Home className="h-6 w-6 flex-shrink-0" />
    </Link>
  );
};

export default function MentorSettingsPage() {
  const { state, dispatch, mentorColors, availableMentorNames } = useSeating();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleCreate = () => {
    const result = assignSeats(state.mentors);
    dispatch({ type: "set-assignments", assignments: result });
    router.push("/#classroom-view");
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
      icon: <Users className="text-slate-700 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "設定",
      href: "/settings",
      icon: <Settings className="text-slate-700 h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-slate-100 via-white to-slate-200 w-full min-h-screen"
      )}
    >
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
        <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">メンター設定</h1>

          {/* メンター一覧グリッド */}
          <Card>
            <CardHeader>
              <CardTitle>メンター一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {state.mentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    color={mentorColors[mentor.id]}
                    availableNames={availableMentorNames}
                    onUpdateCount={(course, value) =>
                      dispatch({
                        type: "update-count",
                        mentorId: mentor.id,
                        course,
                        value,
                      })
                    }
                    onUpdateName={(name) =>
                      dispatch({
                        type: "update-mentor-name",
                        mentorId: mentor.id,
                        name,
                      })
                    }
                    onRemove={() =>
                      dispatch({ type: "remove-mentor", mentorId: mentor.id })
                    }
                    canRemove={state.mentors.length > 1}
                  />
                ))}

                {/* 新規追加カード */}
                <Card
                  className="border-dashed cursor-pointer hover:bg-accent/50 transition-colors flex items-center justify-center min-h-[300px]"
                  onClick={() => dispatch({ type: "add-mentor" })}
                >
                  <div className="text-center">
                    <Plus className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      メンターを追加
                    </p>
                  </div>
                </Card>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-4 mt-6">
                <Button onClick={handleCreate} size="lg">
                  作成
                </Button>
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: "reset-assignments" })}
                  size="lg"
                >
                  リセット
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 統計サマリー */}
          <div className="mt-6">
            <MentorStats mentors={state.mentors} />
          </div>

          {/* エラー表示 */}
          {state.assignments?.errors && state.assignments.errors.length > 0 && (
            <Card className="mt-6 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">配置エラー</CardTitle>
              </CardHeader>
              <CardContent>
                {state.assignments.errors.map((error, idx) => (
                  <div key={idx} className="mb-4">
                    <p className="font-semibold">{error.mentorLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {error.reason}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </motion.main>
    </div>
  );
}
