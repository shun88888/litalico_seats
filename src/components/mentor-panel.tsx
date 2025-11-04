import { Minus, Plus, RefreshCw } from "lucide-react";
import { useMemo } from "react";

import type { AssignmentResult, Mentor, CourseType } from "@/types/seating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CourseKey = CourseType;

const COURSE_LABELS: Record<CourseKey, string> = {
  robot: "ロボット(RC)",
  game: "ゲーム(PG)",
  fab: "ファブ(DF)",
  prime: "プライム(RT)",
};

// 入力フォームの表示順序（ゲーム → ファブ → ロボット → プライム）
const COURSE_ORDER: CourseType[] = ["game", "fab", "robot", "prime"];

interface MentorPanelProps {
  mentors: Mentor[];
  onAdd: () => void;
  onRemove: (mentorId: string) => void;
  onUpdateCount: (mentorId: string, course: CourseType, value: number) => void;
  onUpdateMentorName: (mentorId: string, name: string) => void;
  onCreate: () => void;
  onResetAssignments: () => void;
  mentorColors: Record<string, string>;
  assignments: AssignmentResult | null;
  availableMentorNames: string[];
}

export const MentorPanel = ({
  mentors,
  onAdd,
  onRemove,
  onUpdateCount,
  onUpdateMentorName,
  onCreate,
  onResetAssignments,
  mentorColors,
  assignments,
  availableMentorNames,
}: MentorPanelProps) => {
  const totalByCourse = useMemo(() => {
    return mentors.reduce(
      (acc, mentor) => {
        acc.robot += mentor.counts.robot;
        acc.game += mentor.counts.game;
        acc.fab += mentor.counts.fab;
        acc.prime += mentor.counts.prime;
        return acc;
      },
      { robot: 0, game: 0, fab: 0, prime: 0 }
    );
  }, [mentors]);

  const mentorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    mentors.forEach((mentor) => {
      map.set(mentor.id, mentor.label);
    });
    return map;
  }, [mentors]);


  const renderMentorCard = (mentor: Mentor) => {
    const color = mentorColors[mentor.id];
    const isDefaultLabel = !availableMentorNames.includes(mentor.label);

    return (
      <div
        key={mentor.id}
        className="rounded-xl border border-dashed border-muted bg-card/60 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <Select
              value={isDefaultLabel ? "" : mentor.label}
              onValueChange={(value) => onUpdateMentorName(mentor.id, value)}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder={isDefaultLabel ? mentor.label : "メンター名を選択"} />
              </SelectTrigger>
              <SelectContent>
                {availableMentorNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
        {assignments?.errors && assignments.errors.length > 0 && (
          <div className="w-full space-y-2">
            {assignments.errors.map((error) => (
              <div
                key={error.mentorId}
                className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs"
              >
                <div className="font-semibold text-red-700 mb-1">
                  ⚠️ {error.mentorLabel}: 配置エラー
                </div>
                <div className="text-red-600 text-[11px]">
                  配置できなかった生徒:
                  {error.unassignedCounts.robot > 0 && ` ロボット${error.unassignedCounts.robot}人`}
                  {error.unassignedCounts.game > 0 && ` ゲーム${error.unassignedCounts.game}人`}
                  {error.unassignedCounts.fab > 0 && ` ファブ${error.unassignedCounts.fab}人`}
                  {error.unassignedCounts.prime > 0 && ` プライム${error.unassignedCounts.prime}人`}
                </div>
                <div className="text-red-600 text-[11px] mt-1">
                  {error.reason}
                </div>
              </div>
            ))}
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
