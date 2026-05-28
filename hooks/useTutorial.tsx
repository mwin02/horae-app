import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getTutorialSeen, setTutorialSeen } from "@/lib/tutorial-storage";

export type TutorialPhase = "idle" | "welcome" | "tour" | "done";

export type TourStepId =
  | "start-activity"
  | "customize-activity"
  | "retroactive-and-edit"
  | "customize-insights"
  | "replay";

export interface TourStep {
  id: TourStepId;
  /** Pathname the user should be on when this step renders fully. */
  path: string;
  /** Human label shown in the "Go to <X>" hint. */
  destinationLabel: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "start-activity",
    path: "/",
    destinationLabel: "Focus",
    title: "Start an activity",
    body: "Tap the ring at the top to pick anything, or hit one of the quick-start chips below it to begin tracking instantly.",
  },
  {
    id: "customize-activity",
    path: "/",
    destinationLabel: "Focus",
    title: "Make it yours",
    body: "Long-press any quick-start activity to rename or recolor it. You can manage every activity and category from Settings.",
  },
  {
    id: "retroactive-and-edit",
    path: "/timeline",
    destinationLabel: "Timeline",
    title: "Log past time & edit entries",
    body: "Tap an empty gap on the timeline to backfill a past activity. Tap any existing entry to edit its time, category, or notes.",
  },
  {
    id: "customize-insights",
    path: "/insights",
    destinationLabel: "Insights",
    title: "Customize your insights",
    body: "Tap the sliders icon in the top-right to pin the charts that matter to you and hide the rest.",
  },
  {
    id: "replay",
    path: "/settings",
    destinationLabel: "Settings",
    title: "You're all set",
    body: "You can replay this tour anytime from Settings → Help. Happy tracking!",
  },
] as const;

interface TutorialContextValue {
  phase: TutorialPhase;
  stepIndex: number;
  step: TourStep | null;
  totalSteps: number;
  startWelcome: () => void;
  beginTour: () => void;
  next: () => void;
  skip: () => void;
  replay: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [phase, setPhase] = useState<TutorialPhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);

  // Auto-trigger welcome carousel for first-time users.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const seen = await getTutorialSeen();
      if (!cancelled && !seen) {
        setPhase("welcome");
      } else if (!cancelled) {
        setPhase("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(() => {
    setPhase("done");
    setStepIndex(0);
    void setTutorialSeen(true);
  }, []);

  const startWelcome = useCallback(() => {
    setStepIndex(0);
    setPhase("welcome");
  }, []);

  const beginTour = useCallback(() => {
    setStepIndex(0);
    setPhase("tour");
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        finish();
        return 0;
      }
      return i + 1;
    });
  }, [finish]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const replay = useCallback(() => {
    setStepIndex(0);
    setPhase("welcome");
    void setTutorialSeen(false);
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      phase,
      stepIndex,
      step: phase === "tour" ? TOUR_STEPS[stepIndex] ?? null : null,
      totalSteps: TOUR_STEPS.length,
      startWelcome,
      beginTour,
      next,
      skip,
      replay,
    }),
    [phase, stepIndex, startWelcome, beginTour, next, skip, replay],
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
