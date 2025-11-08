const PASTEL_PALETTE = [
  "hsl(210 75% 70%)",
  "hsl(175 60% 65%)",
  "hsl(42 80% 68%)",
  "hsl(330 65% 72%)",
  "hsl(120 50% 65%)",
  "hsl(260 60% 70%)",
  "hsl(10 75% 68%)",
  "hsl(290 55% 70%)",
];

/**
 * メンターIDから一貫した色を取得
 * IDからインデックスを抽出して色を割り当てる
 */
export const getMentorColor = (mentorId: string): string => {
  // "mentor-1" から数字を抽出
  const match = mentorId.match(/mentor-(\d+)/);
  if (match) {
    const index = parseInt(match[1], 10) - 1; // 1始まりなので-1
    return PASTEL_PALETTE[index % PASTEL_PALETTE.length];
  }
  // フォールバック（想定外のID形式の場合）
  return PASTEL_PALETTE[0];
};
