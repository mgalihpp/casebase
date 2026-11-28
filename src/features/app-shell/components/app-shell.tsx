"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export type TabKey = "belajar" | "berkas" | "peringkat" | "profil";

const TABS: { key: TabKey; label: string; href: string }[] = [
  { key: "belajar", label: "Belajar", href: "/belajar" },
  { key: "berkas", label: "Berkas", href: "/berkas" },
  { key: "peringkat", label: "Peringkat", href: "/peringkat" },
  { key: "profil", label: "Profil", href: "/profil" },
];

function TabIcon({ tab, active }: { tab: TabKey; active: boolean }) {
  const fill = active ? "rgba(79,70,229,.18)" : "none";
  const common = {
    viewBox: "0 0 24 24",
    width: 26,
    height: 26,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (tab === "belajar") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"
          fill={fill}
        />
        <path d="M9 4v13.5M15 6.5V20" />
      </svg>
    );
  }
  if (tab === "berkas") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          fill={fill}
        />
      </svg>
    );
  }
  if (tab === "peringkat") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M7 4h10v4a5 5 0 0 1-10 0z" fill={fill} />
        <path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill={fill} />
      <path d="M4 21a8 8 0 0 1 16 0" fill={fill} />
    </svg>
  );
}

/** Bingkai layar aplikasi: konten, dan bilah tab bawah dengan 4 tab. */
export function AppShell({
  tab,
  title,
  nav,
  children,
}: {
  tab: TabKey;
  title?: string;
  nav?: ReactNode;
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
      <main className="flex flex-1 flex-col pb-24">{children}</main>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[60px] max-w-[430px] border-t border-ink/15 bg-white/90 backdrop-blur-xl"
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 font-body text-[10.5px] font-semibold"
              style={{ color: active ? "#4F46E5" : "#6E6987" }}
            >
              <TabIcon tab={t.key} active={active} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
