import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getTutorialSeen, setTutorialSeen } from "@/lib/tutorial-storage";

export type TutorialPhase = "idle" | "welcome" | "done";

interface TutorialContextValue {
  phase: TutorialPhase;
  finish: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [phase, setPhase] = useState<TutorialPhase>("idle");

  // Auto-trigger welcome carousel for first-time users.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const seen = await getTutorialSeen();
      if (cancelled) return;
      setPhase(seen ? "done" : "welcome");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(() => {
    setPhase("done");
    void setTutorialSeen(true);
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({ phase, finish }),
    [phase, finish],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return ctx;
}
