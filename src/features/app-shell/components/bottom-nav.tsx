"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";

export type TabKey = "belajar" | "berkas" | "peringkat" | "profil";

function tabsFor(course: string | null) {
  return [
    {
      key: "belajar" as const,
      label: "Belajar",
      href: `/belajar/${course ?? "sql"}`,
    },
    { key: "berkas" as const, label: "Berkas", href: "/berkas" },
    { key: "peringkat" as const, label: "Peringkat", href: "/peringkat" },
    { key: "profil" as const, label: "Profil", href: "/profil" },
  ];
}

function TabIcon({ tab, fill }: { tab: TabKey; fill: string }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 26,
    height: 26,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (tab === "belajar") {
    return (
      <svg {...common}>
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
      <svg {...common}>
        <path
          d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          fill={fill}
        />
      </svg>
    );
  }
  if (tab === "peringkat") {
    return (
      <svg {...common}>
        <path d="M7 4h10v4a5 5 0 0 1-10 0z" fill={fill} />
        <path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" fill={fill} />
      <path d="M4 21a8 8 0 0 1 16 0" fill={fill} />
    </svg>
  );
}

// Bilah tab bawah sesuai desain: kaca buram, tinggi 60px ditambah area aman, empat tab.
export function BottomNav({ tab }: { tab: TabKey }) {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.profile.me.queryOptions());
  const tabs = tabsFor(data?.course ?? null);
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[calc(60px+env(safe-area-inset-bottom,0px))] max-w-[430px] border-t-[0.5px] border-[rgba(30,27,58,0.16)] bg-[rgba(250,250,253,0.86)] pb-[env(safe-area-inset-bottom,0px)] [backdrop-filter:saturate(180%)_blur(20px)]"
    >
      {tabs.map((item) => {
        const active = item.key === tab;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 font-body text-[10.5px] font-semibold"
            style={{ color: active ? "#4F46E5" : "#6E6987" }}
          >
            <span className="grid h-7 place-items-center">
              <TabIcon
                tab={item.key}
                fill={active ? "rgba(79,70,229,0.18)" : "none"}
              />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
