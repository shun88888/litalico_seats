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

export const getMentorColor = (index: number) =>
  PASTEL_PALETTE[index % PASTEL_PALETTE.length];
