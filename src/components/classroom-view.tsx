import { useMemo } from "react";

import type { AssignmentResult, CourseType, Mentor } from "@/types/seating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassroomViewProps {
  mentors: Mentor[];
  mentorColors: Record<string, string>;
  assignments: AssignmentResult | null;
}

const DESK_BLOCKS = [
  { id: "l-vertical", left: 5, top: 5, width: 14, height: 25 },
  { id: "l-horizontal", left: 5, top: 5, width: 63, height: 10.5 },
  { id: "top-right", left: 73, top: 5, width: 23, height: 10.5 },
  { id: "left-mid-square", left: 18, top: 35, width: 20, height: 15 },
  { id: "right-upper-square", left:70, top: 24.5, width: 20, height: 15 },
  { id: "right-lower-square", left: 70, top: 49, width: 20, height: 15 },
  { id: "left-vertical-lower", left: 5, top: 60, width: 14, height: 25 },
  { id: "right-vertical-lower", left: 82, top: 70, width: 13, height: 25 },
  { id: "right-bottom-vertical", left: 82, top: 95, width: 13, height: 23 },
];

const SEAT_DOTS = [
  { seatId: "1", left: 22, top: 23 },
  { seatId: "2", left: 28.5, top: 18 },
  { seatId: "3", left: 38.5, top: 18 },
  { seatId: "4", left: 48.5, top: 18 },
  { seatId: "5", left: 58.5, top: 18 },
  { seatId: "6", left: 84.5, top: 18 },
  { seatId: "7", left: 79.5, top: 22 },
  { seatId: "8", left: 67, top: 32 },
  { seatId: "9", left: 79.5, top: 42 },
  { seatId: "10", left: 79.5, top: 46.5 },
  { seatId: "11", left: 67, top: 56.5 },
  { seatId: "12", left: 79.5, top: 66.5 },
  { seatId: "13", left: 79, top: 74.5 },
  { seatId: "14", left: 79, top: 82.5 },
  { seatId: "15", left: 79, top: 90.5 },
  { seatId: "16", left: 22, top: 80.5 },
  { seatId: "17", left: 22, top: 72.5 },
  { seatId: "18", left: 22, top: 64.5 },
  { seatId: "19", left: 28, top: 52.5 },
  { seatId: "20", left: 41, top: 42.5 },
  { seatId: "21", left: 28, top: 32.5 },
  { seatId: "22", left: 88.5, top: 102 },
  { seatId: "23", left: 88.5, top: 110 },
];

// UIに表示される座席のIDリスト
export const VISIBLE_SEAT_IDS = SEAT_DOTS.map(dot => dot.seatId);

const DOT_SIZE = {
  width: 4,
  height: 3,
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
}: ClassroomViewProps) => {
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
    // 座席1-21のタイプマッピング（厳格なルール）
    // ロボット(RC)専用席（正方形机）: 7, 8, 9, 10, 11, 12, 19, 20, 21
    // ゲーム(PG)/ファブ(DF)/プライム(RT)専用席（長方形机）: 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18
    // 相互利用は一切不可
    const robotSeats = ["7", "8", "9", "10", "11", "12", "19", "20", "21"];
    SEAT_DOTS.forEach((dot) => {
      if (robotSeats.includes(dot.seatId)) {
        map.set(dot.seatId, "robot");
      } else {
        map.set(dot.seatId, "game"); // game-fab-prime専用席はgameとして表示
      }
    });
    return map;
  }, []);

  const floorInfo = useMemo(() => {
    if (!assignments?.floor) {
      return null;
    }
    const ownerLabel =
      mentorLabelMap.get(assignments.floor.ownerMentorId) ??
      assignments.floor.ownerMentorId;
    return {
      ownerLabel,
      color:
        mentorColors[assignments.floor.ownerMentorId] ?? DEFAULT_SEAT_COLOR,
      total: assignments.floor.total,
      contributors: assignments.floor.contributors.map((entry) => ({
        mentorLabel:
          mentorLabelMap.get(entry.mentorId) ?? entry.mentorId,
        count: entry.count,
      })),
    };
  }, [assignments, mentorColors, mentorLabelMap]);

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
        <div className="relative mx-auto mt-2 w-full max-w-[520px]">
          <div
            className="relative w-full overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-inner"
            style={{ aspectRatio: "600 / 800" }}
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
                <div
                  key={dot.seatId}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border border-white/70 shadow"
                  style={{
                    left: `${dot.left}%`,
                    top: `${dot.top}%`,
                    width: `${DOT_SIZE.width}%`,
                    height: `${DOT_SIZE.height}%`,
                    backgroundColor,
                  }}
                  title={title}
                >
                  <span className="text-[8px] font-bold text-gray-700 select-none">
                    {dot.seatId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      {floorInfo && (
        <div className="mx-auto mb-6 w-full max-w-[520px] rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-3 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span
                aria-hidden
                className="inline-flex h-3 w-3 rounded-full border border-white/70"
                style={{ backgroundColor: floorInfo.color }}
              />
              <span className="font-semibold">
                床担当: {floorInfo.ownerLabel}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-600">
              {floorInfo.total} 名
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            {floorInfo.contributors.map((contributor) => (
              <span
                key={`${floorInfo.ownerLabel}-${contributor.mentorLabel}`}
              >
                {contributor.mentorLabel} ({contributor.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
