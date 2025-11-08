"use client";

import React, { createContext, useContext, useReducer, useMemo, ReactNode } from "react";
import {
  seatingReducer,
  initialState,
  MENTOR_NAMES,
  type SeatingState,
  type SeatingAction,
} from "@/lib/seating-reducer";
import { getMentorColor } from "@/lib/colors";

interface SeatingContextType {
  state: SeatingState;
  dispatch: React.Dispatch<SeatingAction>;
  mentorColors: Record<string, string>;
  availableMentorNames: string[];
}

const SeatingContext = createContext<SeatingContextType | null>(null);

export function SeatingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(seatingReducer, initialState);

  // メンター色の計算
  const mentorColors = useMemo(() => {
    return state.mentors.reduce<Record<string, string>>((acc, mentor) => {
      acc[mentor.id] = getMentorColor(mentor.id);
      return acc;
    }, {});
  }, [state.mentors]);

  // 利用可能なメンター名の計算
  const availableMentorNames = useMemo(() => {
    const used = new Set(state.mentors.map((m) => m.label));
    return MENTOR_NAMES.filter((name) => !used.has(name));
  }, [state.mentors]);

  return (
    <SeatingContext.Provider
      value={{ state, dispatch, mentorColors, availableMentorNames }}
    >
      {children}
    </SeatingContext.Provider>
  );
}

export function useSeating() {
  const context = useContext(SeatingContext);
  if (!context) {
    throw new Error("useSeating must be used within SeatingProvider");
  }
  return context;
}
