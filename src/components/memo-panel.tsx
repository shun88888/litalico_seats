"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSeating } from "@/context/seating-context";

export const MemoPanel = () => {
  const { state, dispatch } = useSeating();

  return (
    <Card className="flex flex-col border-none bg-muted/30 backdrop-blur-sm" style={{ minHeight: "600px" }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          メモ欄
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <textarea
          className="w-full h-[calc(100%-16px)] rounded-lg border border-border/60 bg-background/70 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="自由にメモを記入できます..."
          value={state.memo}
          onChange={(e) => dispatch({ type: "update-memo", memo: e.target.value })}
        />
      </CardContent>
    </Card>
  );
};
