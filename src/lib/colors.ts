const PASTEL_PALETTE = [
  "hsl(210 70% 82%)",
  "hsl(175 55% 78%)",
  "hsl(42 74% 78%)",
  "hsl(330 60% 84%)",
  "hsl(120 45% 78%)",
  "hsl(260 55% 82%)",
  "hsl(10 70% 80%)",
  "hsl(290 50% 80%)",
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
