import type { DeskDefinition, SeatSlot, SeatType } from "@/types/seating";

type SeatPosition = {
  x: number;
  y: number;
};

interface DeskConfig
  extends Omit<DeskDefinition, "seats"> {
  seatPositions: SeatPosition[];
}

const createDesk = ({
  seatPositions,
  ...desk
}: DeskConfig): DeskDefinition => {
  const seats: SeatSlot[] = seatPositions.map((position, index) => ({
    id: `${desk.id}-${index + 1}`,
    deskId: desk.id,
    type: desk.type,
    slotIndex: index + 1,
    position,
  }));

  return {
    ...desk,
    seats,
  };
};

const squareSeats = (type: SeatType): SeatPosition[] => {
  if (type === "robot") {
    return [
      { x: 28, y: 25 },
      { x: 72, y: 25 },
      { x: 50, y: 72 },
    ];
  }
  return [
    { x: 28, y: 25 },
    { x: 72, y: 25 },
    { x: 28, y: 75 },
    { x: 72, y: 75 },
  ];
};

const createLongTableSeats = (count: number): SeatPosition[] => {
  if (count <= 4) {
    return [
      { x: 20, y: 30 },
      { x: 50, y: 30 },
      { x: 80, y: 30 },
      ...(count > 3 ? [{ x: 50, y: 70 }] : []),
    ].slice(0, count);
  }

  const topRow = Math.ceil(count / 2);
  const bottomRow = count - topRow;
  const topGap = 100 / (topRow + 1);
  const bottomGap = bottomRow ? 100 / (bottomRow + 1) : 0;

  const topSeats = Array.from({ length: topRow }, (_, index) => ({
    x: topGap * (index + 1),
    y: 28,
  }));
  const bottomSeats = Array.from({ length: bottomRow }, (_, index) => ({
    x: bottomGap * (index + 1),
    y: 72,
  }));

  return [...topSeats, ...bottomSeats];
};

export const DESKS: DeskDefinition[] = [
  createDesk({
    id: "robot-a",
    label: "Robot A",
    type: "robot",
    notes: "正方形",
    position: { x: 6, y: 18 },
    size: { width: 16, height: 18 },
    seatPositions: squareSeats("robot"),
  }),
  createDesk({
    id: "robot-b",
    label: "Robot B",
    type: "robot",
    notes: "正方形",
    position: { x: 24, y: 18 },
    size: { width: 16, height: 18 },
    seatPositions: squareSeats("robot"),
  }),
  createDesk({
    id: "robot-c",
    label: "Robot C",
    type: "robot",
    notes: "正方形",
    position: { x: 6, y: 40 },
    size: { width: 16, height: 18 },
    seatPositions: squareSeats("robot"),
  }),
  createDesk({
    id: "robot-d",
    label: "Robot D",
    type: "robot",
    notes: "正方形",
    position: { x: 24, y: 40 },
    size: { width: 16, height: 18 },
    seatPositions: squareSeats("robot"),
  }),
  createDesk({
    id: "game-a",
    label: "Game A",
    type: "game",
    notes: "長机 4席",
    position: { x: 52, y: 18 },
    size: { width: 36, height: 14 },
    seatPositions: createLongTableSeats(4),
  }),
  createDesk({
    id: "game-b",
    label: "Game B",
    type: "game",
    notes: "長机 3席",
    position: { x: 52, y: 34 },
    size: { width: 36, height: 14 },
    seatPositions: createLongTableSeats(3),
  }),
  createDesk({
    id: "game-c",
    label: "Game C",
    type: "game",
    notes: "長机 5席",
    position: { x: 52, y: 50 },
    size: { width: 36, height: 18 },
    seatPositions: createLongTableSeats(5),
  }),
  createDesk({
    id: "fab-a",
    label: "Fab A",
    type: "fab",
    notes: "長机 4席",
    position: { x: 6, y: 64 },
    size: { width: 16, height: 16 },
    seatPositions: squareSeats("fab"),
  }),
  createDesk({
    id: "fab-b",
    label: "Fab B",
    type: "fab",
    notes: "長机 4席",
    position: { x: 24, y: 64 },
    size: { width: 16, height: 16 },
    seatPositions: squareSeats("fab"),
  }),
];

export const SEAT_SLOTS: SeatSlot[] = DESKS.flatMap((desk) => desk.seats);

export const SEATS_BY_DESK = DESKS.reduce<Record<string, SeatSlot[]>>(
  (accumulator, desk) => {
    accumulator[desk.id] = desk.seats;
    return accumulator;
  },
  {}
);
