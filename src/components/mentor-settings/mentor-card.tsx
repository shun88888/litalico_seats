"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Mentor, CourseType } from "@/types/seating";

interface MentorCardProps {
  mentor: Mentor;
  color: string;
  availableNames: string[];
  onUpdateCount: (course: CourseType, value: number) => void;
  onUpdateName: (name: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function MentorCard({
  mentor,
  color,
  availableNames,
  onUpdateCount,
  onUpdateName,
  onRemove,
  canRemove,
}: MentorCardProps) {
  return (
    <Card className="relative">
      {/* 色インジケーター */}
      <div
        className="absolute top-0 left-0 w-2 h-full rounded-l-lg"
        style={{ backgroundColor: color }}
      />

      <CardHeader className="pl-6">
        <CardTitle className="text-lg flex items-center justify-between">
          {mentor.label}
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pl-6 space-y-4">
        {/* メンター名選択 */}
        <div>
          <Label>メンター名</Label>
          <Select value={mentor.label} onValueChange={onUpdateName}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={mentor.label}>{mentor.label}</SelectItem>
              {availableNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* コース別人数入力 */}
        <div className="space-y-2">
          <div>
            <Label htmlFor={`${mentor.id}-game`}>ゲーム (PG)</Label>
            <Input
              id={`${mentor.id}-game`}
              type="number"
              min="0"
              value={mentor.counts.game}
              onChange={(e) =>
                onUpdateCount("game", parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div>
            <Label htmlFor={`${mentor.id}-fab`}>デジファブ (DF)</Label>
            <Input
              id={`${mentor.id}-fab`}
              type="number"
              min="0"
              value={mentor.counts.fab}
              onChange={(e) =>
                onUpdateCount("fab", parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div>
            <Label htmlFor={`${mentor.id}-robot`}>ロボット (RC)</Label>
            <Input
              id={`${mentor.id}-robot`}
              type="number"
              min="0"
              value={mentor.counts.robot}
              onChange={(e) =>
                onUpdateCount("robot", parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div>
            <Label htmlFor={`${mentor.id}-prime`}>プライム (RT)</Label>
            <Input
              id={`${mentor.id}-prime`}
              type="number"
              min="0"
              value={mentor.counts.prime}
              onChange={(e) =>
                onUpdateCount("prime", parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* 合計表示 */}
        <div className="pt-2 border-t">
          <p className="text-sm font-semibold">
            合計:{" "}
            {mentor.counts.robot +
              mentor.counts.game +
              mentor.counts.fab +
              mentor.counts.prime}
            人
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
