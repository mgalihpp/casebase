import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CourseKey,
  DailyTarget,
  LevelKey,
  ReasonKey,
  ReminderKey,
} from "./data";

// Guest onboarding choices. They stay in the browser until the account exists (FR-ONB-06).
// Storage is a per-viewer convenience: every access is guarded, and the flow still works
// when localStorage is missing or blocked.
export type OnboardingDraft = {
  course?: CourseKey;
  level?: LevelKey;
  reason?: ReasonKey;
  dailyTarget?: DailyTarget;
  classCode?: string;
  reminder?: ReminderKey;
};

type OnboardingStore = OnboardingDraft & {
  setDraft: (patch: OnboardingDraft) => void;
  reset: () => void;
};

const safeLocalStorage = {
  getItem: (name: string) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage unavailable: the draft lasts only while the page is open.
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Nothing to clean up.
    }
  },
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      setDraft: (patch) => set(patch),
      reset: () =>
        set({
          course: undefined,
          level: undefined,
          reason: undefined,
          dailyTarget: undefined,
          classCode: undefined,
          reminder: undefined,
        }),
    }),
    {
      name: "sql-quest:onboarding",
      storage: createJSONStorage(() => safeLocalStorage),
      // Rehydrate in an effect, not during render, so server and client markup match.
      skipHydration: true,
      partialize: (state) => ({
        course: state.course,
        level: state.level,
        reason: state.reason,
        dailyTarget: state.dailyTarget,
        classCode: state.classCode,
        reminder: state.reminder,
      }),
    },
  ),
);

// Returns the request body only when every required choice is filled in.
export function toCompletePayload(draft: OnboardingDraft) {
  if (!draft.course || !draft.level || !draft.reason || !draft.dailyTarget) {
    return null;
  }
  return {
    course: draft.course,
    level: draft.level,
    reason: draft.reason,
    dailyTarget: draft.dailyTarget,
    classCode: draft.classCode ?? null,
    reminder: draft.reminder ?? null,
  };
}
