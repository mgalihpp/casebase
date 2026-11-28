"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { BottomNav, type TabKey } from "./bottom-nav";

export type { TabKey };

/** Bingkai layar utama: konten dengan ruang untuk bilah tab bawah. Layar push tanpa tab memakai showNav={false}. */
export function AppShell({
  tab,
  title,
  nav,
  showNav = true,
  children,
}: {
  tab: TabKey;
  title?: string;
  nav?: ReactNode;
  showNav?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/masuk");
  }, [isPending, session, router]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-app">
      <header className="sticky top-0 z-10 flex h-14 relative items-center justify-between border-b border-ink/10 bg-app/85 px-2 backdrop-blur-xl">
        {nav ?? <span className="min-w-11" />}
        {title ? (
          <span className="absolute left-1/2 -translate-x-1/2 truncate font-body text-[17px] font-semibold">
            {title}
          </span>
        ) : null}
      </header>
      <main
        className={`flex flex-1 flex-col ${showNav ? "pb-[calc(84px+env(safe-area-inset-bottom,0px))]" : "pb-6"}`}
      >
        {children}
      </main>
      {showNav ? <BottomNav tab={tab} /> : null}
    </div>
  );
}
