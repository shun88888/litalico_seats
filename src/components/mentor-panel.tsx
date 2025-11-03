import { Minus, Plus, RefreshCw, Sparkles } from "lucide-react";
import { useMemo } from "react";

import type { AssignmentResult, Mentor, CourseType } from "@/types/seating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CourseKey = CourseType;

const COURSE_LABELS: Record<CourseKey, string> = {
  robot: "ロボット",
  game: "ゲーム",
  fab: "ファブ",
};

// 入力フォームの表示順序（ゲーム → ファブ → ロボット）
const COURSE_ORDER: CourseType[] = ["game", "fab", "robot"];

interface MentorPanelProps {
  mentors: Mentor[];
  onAdd: () => void;
  onRemove: (mentorId: string) => void;
  onUpdateCount: (mentorId: string, course: CourseType, value: number) => void;
  onCreate: () => void;
  onResetAssignments: () => void;
  mentorColors: Record<string, string>;
  assignments: AssignmentResult | null;
}

export const MentorPanel = ({
  mentors,
  onAdd,
  onRemove,
  onUpdateCount,
  onCreate,
  onResetAssignments,
  mentorColors,
  assignments,
}: MentorPanelProps) => {
  const totalByCourse = useMemo(() => {
    return mentors.reduce(
      (acc, mentor) => {
        acc.robot += mentor.counts.robot;
        acc.game += mentor.counts.game;
        acc.fab += mentor.counts.fab;
        return acc;
      },
      { robot: 0, game: 0, fab: 0 }
    );
  }, [mentors]);

  const mentorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    mentors.forEach((mentor) => {
      map.set(mentor.id, mentor.label);
    });
    return map;
  }, [mentors]);

  const floorSummary = useMemo(() => {
    if (!assignments?.floor) {
      return null;
    }
    return {
      ...assignments.floor,
      ownerLabel: mentorLabelMap.get(assignments.floor.ownerMentorId),
    };
  }, [assignments, mentorLabelMap]);

  const renderMentorCard = (mentor: Mentor) => {
    const color = mentorColors[mentor.id];
    return (
      <div
        key={mentor.id}
        className="rounded-xl border border-dashed border-muted bg-card/60 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <p className="text-sm font-semibold text-foreground">{mentor.label}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(mentor.id)}
            disabled={mentors.length === 1}
            aria-label={`${mentor.label}を削除`}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {COURSE_ORDER.map((course) => (
            <div key={course} className="grid gap-1.5">
              <Label htmlFor={`${mentor.id}-${course}`} className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{COURSE_LABELS[course]}</span>
              </Label>
              <Input
                id={`${mentor.id}-${course}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={mentor.counts[course]}
                onChange={(event) =>
                  onUpdateCount(
                    mentor.id,
                    course,
                    Math.max(0, Number.parseInt(event.target.value, 10) || 0)
                  )
                }
                className="h-9"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col border-none bg-muted/30 backdrop-blur-sm">
      <CardHeader className="flex flex-col space-y-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          メンター設定
        </CardTitle>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          {COURSE_ORDER.map((course) => (
            <div key={course} className="rounded-md bg-background/70 px-3 py-2">
              <p className="font-medium text-foreground/70">{COURSE_LABELS[course]}</p>
              <p className="text-lg font-semibold text-foreground">
                {totalByCourse[course]}
              </p>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="input">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="input">入力</TabsTrigger>
            <TabsTrigger value="rules">ルール</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="mt-4">
            <ScrollArea className="h-[calc(100vh-320px)] pr-4">
              <div className="flex flex-col gap-4 pb-6">
                {mentors.map((mentor) => renderMentorCard(mentor))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={onAdd}
                  aria-label="メンターを追加"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  メンターを追加
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="rules" className="mt-4">
            <ScrollArea className="h-[calc(100vh-320px)] pr-4">
              <div className="space-y-3 pb-6 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground/70">配置優先ルール</p>
                <ul className="list-outside list-disc space-y-1 pl-5">
                  <li>各コースは専用の机を優先して使用します。</li>
                  <li>ゲーム席が不足したら余りのロボット席へ移します。</li>
                  <li>ファブ席が不足したら余りのゲーム席へ移します。</li>
                  <li>ロボット席が不足した分は床扱いになります。</li>
                </ul>
                <p className="font-semibold text-foreground/70">床配置の扱い</p>
                <ul className="list-outside list-disc space-y-1 pl-5">
                  <li>床はロボットコースのみ、担当メンターは1名に統一。</li>
                  <li>床になった人数は右側の床領域にまとめて表示します。</li>
                </ul>
                <p className="font-semibold text-foreground/70">その他</p>
                <ul className="list-outside list-disc space-y-1 pl-5">
                  <li>座席は教室図上のドットカラーで表示されます。</li>
                  <li>リセットで全ドットを未割り当て（灰色）に戻します。</li>
                  <li>個人名は入力せず「メンター1」などのIDで管理します。</li>
                </ul>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-background/40 py-4">
        {floorSummary ? (
          <div
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold",
              "bg-secondary/60 text-secondary-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>
                床担当:{" "}
                {floorSummary.ownerLabel ?? floorSummary.ownerMentorId}
              </span>
            </div>
            <span>{floorSummary.total} 名</span>
          </div>
        ) : (
          <div className="w-full rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            座席を作成すると床配置や例外処理の情報が表示されます。
          </div>
        )}
        <div className="flex w-full gap-2">
          <Button type="button" className="flex-1" onClick={onCreate}>
            作成
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onResetAssignments}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            リセット
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
