"use client";
import { createContext, useContext, useState } from "react";

const Ctx = createContext<{ open: () => void; close: () => void; isOpen: boolean }>(
  { open: () => {}, close: () => {}, isOpen: false },
);

export function NewTaskController({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <Ctx.Provider
      value={{ isOpen, open: () => setOpen(true), close: () => setOpen(false) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useNewTask = () => useContext(Ctx);
