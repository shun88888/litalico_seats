import { useMemo, useState } from "react";

import type { AssignmentResult, CourseType, Mentor } from "@/types/seating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClassroomViewProps {
  mentors: Mentor[];
  mentorColors: Record<string, string>;
  assignments: AssignmentResult | null;
  onManualAssignSeat: (seatId: string, mentorId: string | null, course: CourseType) => void;
}

const DESK_BLOCKS = [
  { id: "l-vertical", left: 5, top: 4.44, width: 14, height: 22.22 },
  { id: "l-horizontal", left: 5, top: 4.44, width: 63, height: 9.33 },
  { id: "top-right", left: 73, top: 4.44, width: 23, height: 9.33 },
  { id: "left-mid-square", left: 18, top: 31.11, width: 20, height: 13.33 },
  { id: "right-upper-square", left:70, top: 21.78, width: 20, height: 13.33 },
  { id: "right-lower-square", left: 70, top: 43.56, width: 20, height: 13.33 },
  { id: "left-vertical-lower", left: 5, top: 53.33, width: 14, height: 22.22 },
  { id: "right-vertical-lower", left: 82, top: 62.22, width: 13, height: 22.22 },
  { id: "right-bottom-vertical", left: 82, top: 85.44, width: 13, height: 11.6 },
];

const SEAT_DOTS = [
  { seatId: "1", left: 22, top: 20.44 },
  { seatId: "2", left: 28.5, top: 16.00 },
  { seatId: "3", left: 38.5, top: 16.00 },
  { seatId: "4", left: 48.5, top: 16.00 },
  { seatId: "5", left: 58.5, top: 16.00 },
  { seatId: "6", left: 84.5, top: 16.00 },
  { seatId: "7", left: 79.5, top: 19.56 },
  { seatId: "8", left: 67, top: 28.44 },
  { seatId: "9", left: 79.5, top: 37.33 },
  { seatId: "10", left: 79.5, top: 41.33 },
  { seatId: "11", left: 67, top: 50.22 },
  { seatId: "12", left: 79.5, top: 59.11 },
  { seatId: "13", left: 79, top: 66.22 },
  { seatId: "14", left: 79, top: 73.33 },
  { seatId: "15", left: 79, top: 80.44 },
  { seatId: "16", left: 79, top: 90.67 },
  { seatId: "17", left: 45, top: 65 },
  { seatId: "18", left: 55, top: 65 },
  { seatId: "19", left: 22, top: 71.56 },
  { seatId: "20", left: 22, top: 64.44 },
  { seatId: "21", left: 22, top: 57.33 },
  { seatId: "22", left: 28, top: 46.67 },
  { seatId: "23", left: 41, top: 37.78 },
  { seatId: "24", left: 28, top: 28.89 },
];

// UIに表示される座席のIDリスト
export const VISIBLE_SEAT_IDS = SEAT_DOTS.map(dot => dot.seatId);

const DOT_SIZE = {
  width: 4,
  height: 2.67, // 3 * (800/900) = 2.67 to maintain circular shape
};

const COURSE_LABELS: Record<CourseType, string> = {
  robot: "ロボット(RC)",
  game: "ゲーム(PG)",
  fab: "ファブ(DF)",
  prime: "プライム(RT)",
};

const DEFAULT_SEAT_COLOR = "#d9d9d9";
const OCCUPIED_FALLBACK_COLOR = "hsl(200 60% 80%)";

export const ClassroomView = ({
  mentors,
  mentorColors,
  assignments,
  onManualAssignSeat,
}: ClassroomViewProps) => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const assignmentMap = useMemo(() => {
    if (!assignments) {
      return new Map<string, { mentorId: string; course: CourseType }>();
    }
    return new Map(
      assignments.assignments.map((item) => [
        item.seatId,
        { mentorId: item.mentorId, course: item.course },
      ])
    );
  }, [assignments]);

  const mentorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    mentors.forEach((mentor) => map.set(mentor.id, mentor.label));
    return map;
  }, [mentors]);

  const seatTypeMap = useMemo(() => {
    const map = new Map<string, CourseType | "any">();
    // 座席1-24のタイプマッピング（厳格なルール）
    // ロボット(RC)専用席（正方形机）: 7, 8, 9, 10, 11, 12, 17, 18, 22, 23, 24
    // ゲーム(PG)/ファブ(DF)/プライム(RT)専用席（長方形机）: 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 19, 20, 21
    // 相互利用は一切不可
    // 座席17, 18は床席（ロボット専用、最終手段のみ使用）
    const robotSeats = ["7", "8", "9", "10", "11", "12", "17", "18", "22", "23", "24"];
    SEAT_DOTS.forEach((dot) => {
      if (robotSeats.includes(dot.seatId)) {
        map.set(dot.seatId, "robot");
      } else {
        map.set(dot.seatId, "game"); // game-fab-prime専用席はgameとして表示
      }
    });
    return map;
  }, []);


  const legendItems = mentors.map((mentor, index) => ({
    id: mentor.id,
    label: mentor.label,
    color: mentorColors[mentor.id],
    index,
  }));

  return (
    <Card className="flex h-full flex-col border-none bg-white/60 backdrop-blur-sm">
      <CardHeader className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <CardTitle className="text-lg font-semibold text-foreground">
          教室座席図
        </CardTitle>
        <div className="flex flex-wrap gap-3 text-xs">
          {legendItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5"
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full border border-white/50 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="relative mx-auto mt-2 w-full max-w-[440px]">
          <div
            className="relative w-full overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-inner"
            style={{ aspectRatio: "600 / 900" }}
          >
            {DESK_BLOCKS.map((block) => (
              <div
                key={block.id}
                className="absolute rounded-2xl bg-gray-200"
                style={{
                  left: `${block.left}%`,
                  top: `${block.top}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                }}
              />
            ))}
            {SEAT_DOTS.map((dot) => {
              const occupant = assignmentMap.get(dot.seatId);
              const backgroundColor = occupant
                ? mentorColors[occupant.mentorId] ?? OCCUPIED_FALLBACK_COLOR
                : DEFAULT_SEAT_COLOR;
              const seatType = seatTypeMap.get(dot.seatId);
              const title = occupant
                ? `${mentorLabelMap.get(occupant.mentorId) ?? occupant.mentorId} / ${
                    COURSE_LABELS[occupant.course]
                  }`
                : seatType && seatType !== "any" && seatType in COURSE_LABELS
                ? `${COURSE_LABELS[seatType as CourseType]}（未割り当て）`
                : "未割り当て";

              return (
                <DropdownMenu key={dot.seatId}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border border-white/70 shadow cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                      style={{
                        left: `${dot.left}%`,
                        top: `${dot.top}%`,
                        width: `${DOT_SIZE.width}%`,
                        height: `${DOT_SIZE.height}%`,
                        backgroundColor,
                      }}
                      title={title}
                      onClick={() => setSelectedSeat(dot.seatId)}
                    >
                      <span className="text-[8px] font-bold text-gray-700 select-none">
                        {dot.seatId}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>座席 {dot.seatId} - メンターを選択</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {mentors.map((mentor) => (
                      <DropdownMenuItem
                        key={mentor.id}
                        onClick={() => {
                          const defaultCourse = seatType === "robot" ? "robot" : "game";
                          onManualAssignSeat(dot.seatId, mentor.id, defaultCourse);
                        }}
                      >
                        <span
                          className="h-3 w-3 rounded-full mr-2 inline-block"
                          style={{ backgroundColor: mentorColors[mentor.id] }}
                        />
                        {mentor.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        const defaultCourse = seatType === "robot" ? "robot" : "game";
                        onManualAssignSeat(dot.seatId, null, defaultCourse);
                      }}
                    >
                      クリア
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
