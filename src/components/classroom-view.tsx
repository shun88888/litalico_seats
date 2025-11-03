import type { AssignmentResult, Mentor } from "@/types/seating";
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
];

const SEAT_DOTS = [
  { id: "top-left-inner", left: 22, top: 23 },
  { id: "top-1", left: 28.5, top: 18 },
  { id: "top-2", left: 38.5, top: 18 },
  { id: "top-3", left: 48.5, top: 18 },
  { id: "top-4", left: 58.5, top: 18 },
  { id: "top-right-side", left: 84.5, top: 18 },
  { id: "left-square-upper", left: 28, top: 32.5 },
  { id: "left-square-medium", left: 41, top: 42.5 },
  { id: "left-square-lower", left: 28, top: 52.5 },
  { id: "right-square-upper", left: 79.5, top: 22 },
  { id: "right-square-medium", left: 67, top: 32 },
  { id: "right-square-lower", left: 79.5, top: 42 },
  { id: "right-column-1", left: 79.5, top: 46.5 },
  { id: "right-column-2", left: 67, top: 56.5 },
  { id: "right-column-3", left: 79.5, top: 66.5 },
  { id: "right-lower-1", left: 79, top: 74.5 },
  { id: "right-lower-2", left: 79, top: 82.5 },
  { id: "right-lower-3", left: 79, top: 90.5 },
  { id: "left-lower-1", left: 22, top: 64.5 },
  { id: "left-lower-2", left: 22, top: 72.5 },
  { id: "left-lower-3", left: 22, top: 80.5 },
];

const DOT_SIZE = {
  width: 4,
  height: 3,
};

export const ClassroomView = ({
  mentors,
  mentorColors,
  assignments: _assignments,
}: ClassroomViewProps) => {
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
                className="absolute rounded-2xl bg-[#87c7ff]"
                style={{
                  left: `${block.left}%`,
                  top: `${block.top}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                }}
              />
            ))}
            {SEAT_DOTS.map((dot) => (
              <div
                key={dot.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9d9d9]"
                style={{
                  left: `${dot.left}%`,
                  top: `${dot.top}%`,
                  width: `${DOT_SIZE.width}%`,
                  height: `${DOT_SIZE.height}%`,
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
