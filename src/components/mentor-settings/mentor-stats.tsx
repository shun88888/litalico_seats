"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Mentor } from "@/types/seating";

interface MentorStatsProps {
  mentors: Mentor[];
}

export function MentorStats({ mentors }: MentorStatsProps) {
  const totals = mentors.reduce(
    (acc, mentor) => ({
      robot: acc.robot + mentor.counts.robot,
      game: acc.game + mentor.counts.game,
      fab: acc.fab + mentor.counts.fab,
      prime: acc.prime + mentor.counts.prime,
    }),
    { robot: 0, game: 0, fab: 0, prime: 0 }
  );

  const grandTotal = totals.robot + totals.game + totals.fab + totals.prime;

  return (
    <Card>
      <CardHeader>
        <CardTitle>合計統計</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">ロボット</p>
            <p className="text-2xl font-bold">{totals.robot}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">ゲーム</p>
            <p className="text-2xl font-bold">{totals.game}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">デジファブ</p>
            <p className="text-2xl font-bold">{totals.fab}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">プライム</p>
            <p className="text-2xl font-bold">{totals.prime}</p>
          </div>
          <div className="text-center border-l">
            <p className="text-sm text-muted-foreground">総計</p>
            <p className="text-2xl font-bold">{grandTotal}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
