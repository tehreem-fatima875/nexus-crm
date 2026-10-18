"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { initialDemoData } from "@/data/demo-data";
import type { DemoData } from "@/types/crm";

const DemoContext = createContext<{ data: DemoData; setData: Dispatch<SetStateAction<DemoData>> } | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialDemoData);
  return <DemoContext.Provider value={{ data, setData }}>{children}</DemoContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemoStore must be used inside DemoProvider");
  return value;
}