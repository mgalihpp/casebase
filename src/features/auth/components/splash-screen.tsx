"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/ui/mascot";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { COURSES } from "@/features/onboarding/data";
import { useEnterClass } from "@/lib/nav-direction";

// Order and sizes follow the design: five mascots in a row, the center one largest.
const SQUAD = [
  { index: 4, size: 64 },
  { index: 1, size: 82 },
  { index: 0, size: 112 },
  { index: 2, size: 82 },
  { index: 3, size: 64 },
];

const TIP_DURATION_MS = 2400;

export function SplashScreen() {
  const enterClass = useEnterClass("anim-pop-left");
  const [activeTip, setActiveTip] = useState<number | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(tipTimer.current), []);

  function greet(index: number) {
    clearTimeout(tipTimer.current);
    setActiveTip(index);
    tipTimer.current = setTimeout(() => setActiveTip(null), TIP_DURATION_MS);
  }

  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-app px-6 pb-8 pt-[max(env(safe-area-inset-top),24px)] ${enterClass}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4 flex items-end justify-center">
          {SQUAD.map(({ index, size }, order) => {
            const course = COURSES[index];
            return (
              <button
                key={course.key}
                type="button"
                aria-label={`Sapa ${course.mascot}`}
                onClick={() => greet(index)}
                className="nodein -mx-2 grid place-items-center rounded-full"
                style={{
                  width: size,
                  height: size,
                  animationDelay: `${order * 0.08}s`,
                }}
              >
                <Mascot name={course.mascot} size={size} />
              </button>
            );
          })}
        </div>

        <div className="relative h-8 w-full">
          {activeTip !== null && (
            <p
              key={activeTip}
              role="status"
              className="nodein absolute inset-x-0 mx-auto w-max max-w-[320px] rounded-xl border-[1.5px] border-line bg-white px-3 py-1.5 font-body text-sm font-semibold text-ind shadow-md"
            >
              {COURSES[activeTip].tip}
            </p>
          )}
        </div>

        <h1
          className="nodein mt-2 font-display text-[44px] font-black leading-none"
          style={{ animationDelay: "0.4s" }}
        >
          SQL <span className="text-ind">Quest</span>
        </h1>
        <p
          className="nodein mt-3 max-w-[320px] font-body text-[17px] leading-relaxed text-ink-soft"
          style={{ animationDelay: "0.5s" }}
        >
          Pecahkan kasus misteri sambil jago SQL, PostgreSQL, MongoDB, Redis,
          dan SQLite. Lima menit sehari sudah cukup.
        </p>
      </div>

      <div className="nodein grid gap-3.5" style={{ animationDelay: "0.7s" }}>
        <Link href="/onboarding" className={buttonPrimary}>
          Mulai jadi detektif
        </Link>
        <Link href="/masuk" className={buttonSecondary}>
          Aku sudah punya akun
        </Link>
      </div>
    </main>
  );
}
