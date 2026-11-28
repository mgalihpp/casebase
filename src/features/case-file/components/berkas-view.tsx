"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { Sheet } from "@/features/app-shell/components/sheet";
import { useTRPC } from "@/trpc/client";

type Status = "semua" | "aktif" | "selesai" | "arsip";
type FileItem = {
  caseId: string;
  course: string;
  courseLabel: string;
  title: string;
  pinned: boolean;
  status: "aktif" | "selesai" | "arsip";
  doneCount: number;
  totalNodes: number;
};

const STATUS_LABEL: Record<Status, string> = {
  semua: "Semua",
  aktif: "Aktif",
  selesai: "Selesai",
  arsip: "Arsip",
};

const PILL: Record<
  FileItem["status"],
  { label: string; bg: string; fg: string }
> = {
  aktif: { label: "Aktif", bg: "#EEEDFD", fg: "#3730A3" },
  selesai: { label: "Selesai", bg: "#E6F6FA", fg: "#0E7490" },
  arsip: { label: "Diarsipkan", bg: "#EEEDFD", fg: "#5C5878" },
};

export function BerkasView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("semua");
  const [course, setCourse] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<FileItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; caseId?: string } | null>(
    null,
  );

  const list = useQuery(trpc.caseFile.list.queryOptions({ status, course, q }));
  const update = useMutation(trpc.caseFile.update.mutationOptions());
  const restore = useMutation(trpc.caseFile.restore.mutationOptions());

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: trpc.caseFile.list.queryKey(),
    });
  }

  async function act(
    item: FileItem,
    patch: { pinned?: boolean; archived?: boolean; deleted?: boolean },
    message: string,
  ) {
    setMenuFor(null);
    await update.mutateAsync({ caseId: item.caseId, ...patch });
    await refresh();
    setToast({ msg: message, caseId: patch.deleted ? item.caseId : undefined });
  }

  async function undo(caseId: string) {
    await restore.mutateAsync({ caseId });
    setToast(null);
    await refresh();
  }

  function rowProps(item: FileItem) {
    return {
      onMore: () => setMenuFor(item),
      onPin: () =>
        act(
          item,
          { pinned: !item.pinned },
          item.pinned ? "Sematan dilepas" : "Berkas disematkan",
        ),
      onArchive: () =>
        act(
          item,
          { archived: item.status !== "arsip" },
          item.status === "arsip" ? "Berkas dikembalikan" : "Berkas diarsipkan",
        ),
      onDelete: () => act(item, { deleted: true }, "Berkas dihapus"),
    };
  }

  const items = (list.data ?? []) as FileItem[];
  const pinned = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);
  const filterActive = status !== "semua" || course !== null;
  const filterLabel = [
    status !== "semua" ? STATUS_LABEL[status] : null,
    course ? "SQL Dasar" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <AppShell
      tab="berkas"
      title="Berkas"
      nav={
        <span className="flex min-w-11 justify-end">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Filter berkas"
            className="relative grid min-h-11 min-w-11 place-items-center text-ind"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            {filterActive ? (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-bad" />
            ) : null}
          </button>
        </span>
      }
    >
      <h1 className="px-4 pt-2 font-display text-[34px] font-black leading-[41px]">
        Berkas
      </h1>

      <label className="mx-4 mt-2 flex h-11 items-center gap-1.5 rounded-xl bg-[#76748C]/12 px-2.5 text-ink-soft">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <span className="sr-only">Cari berkas</span>
        <input
          type="search"
          placeholder="Cari kasus atau kursus"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-0 flex-1 bg-transparent font-body text-[17px] text-ink outline-none"
        />
      </label>

      {filterActive ? (
        <div className="mx-4 mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStatus("semua");
              setCourse(null);
            }}
            aria-label={`Hapus filter ${filterLabel}`}
            className="flex min-h-9 items-center gap-0.5 rounded-full bg-ind-soft py-0 pl-3 pr-1.5 font-body text-sm font-semibold text-ind-7"
          >
            {filterLabel}
            <span aria-hidden="true" className="px-1 text-lg">
              ✕
            </span>
          </button>
        </div>
      ) : null}

      {list.isPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Memuat berkas"
          className="grid gap-2 px-4 pt-4"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-line" />
          ))}
        </div>
      ) : null}

      {list.isError ? (
        <p role="alert" className="mx-4 mt-6 text-[15px] text-[#BE123C]">
          Berkas gagal dimuat. Coba lagi sebentar.
        </p>
      ) : null}

      {list.data && items.length === 0 ? (
        <div className="mx-8 mt-10 text-center text-ink-soft">
          <p className="mb-1.5 font-display text-xl font-extrabold text-ink">
            Tidak ada berkas
          </p>
          <p className="text-[15px]">Coba kata lain atau atur ulang filter.</p>
        </div>
      ) : null}

      {pinned.length > 0 ? <SectionHead label="Disematkan" /> : null}
      {pinned.map((item) => (
        <FileRow key={item.caseId} item={item} {...rowProps(item)} />
      ))}
      {rest.length > 0 ? (
        <SectionHead label={status === "arsip" ? "Arsip" : "Semua berkas"} />
      ) : null}
      {rest.map((item) => (
        <FileRow key={item.caseId} item={item} {...rowProps(item)} />
      ))}

      {filterOpen ? (
        <Sheet title="Filter berkas" onClose={() => setFilterOpen(false)}>
          <h3 className="mb-2 mt-3 font-body text-[15px] font-bold">Status</h3>
          <div className="flex rounded-[10px] bg-[#76748C]/12 p-0.5">
            {(["semua", "aktif", "selesai", "arsip"] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className="min-h-10 flex-1 rounded-lg font-body text-sm font-semibold"
                style={{ background: status === s ? "#fff" : "transparent" }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <h3 className="mb-2 mt-5 font-body text-[15px] font-bold">Kursus</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={course === null}
              onClick={() => setCourse(null)}
              className="min-h-11 rounded-full border-[1.5px] px-3.5 font-body text-[15px] font-semibold"
              style={{
                borderColor: course === null ? "#4F46E5" : "#E4E1F0",
                background: course === null ? "#EEEDFD" : "#fff",
              }}
            >
              Semua
            </button>
            <button
              type="button"
              aria-pressed={course === "sql"}
              onClick={() => setCourse("sql")}
              className="min-h-11 rounded-full border-[1.5px] px-3.5 font-body text-[15px] font-semibold"
              style={{
                borderColor: course === "sql" ? "#4F46E5" : "#E4E1F0",
                background: course === "sql" ? "#EEEDFD" : "#fff",
              }}
            >
              SQL Dasar
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setStatus("semua");
                setCourse(null);
              }}
            >
              Atur ulang
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setFilterOpen(false)}
            >
              Tampilkan {items.length} berkas
            </button>
          </div>
        </Sheet>
      ) : null}

      {menuFor ? (
        <ContextMenu
          item={menuFor}
          onClose={() => setMenuFor(null)}
          onPin={() =>
            act(
              menuFor,
              { pinned: !menuFor.pinned },
              menuFor.pinned ? "Sematan dilepas" : "Berkas disematkan",
            )
          }
          onArchive={() =>
            act(
              menuFor,
              { archived: menuFor.status !== "arsip" },
              menuFor.status === "arsip"
                ? "Berkas dikembalikan"
                : "Berkas diarsipkan",
            )
          }
          onDelete={() => act(menuFor, { deleted: true }, "Berkas dihapus")}
          onShare={() => {
            void navigator.clipboard?.writeText(
              `${window.location.origin}/berkas/${menuFor.caseId}`,
            );
            setMenuFor(null);
            setToast({ msg: "Tautan berkas disalin" });
          }}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className="pop fixed inset-x-4 top-3 z-50 mx-auto flex max-w-[398px] items-center gap-2.5 rounded-2xl border border-line bg-white py-2 pl-2.5 pr-1.5 shadow-[0_12px_30px_rgba(30,27,58,.16)]"
        >
          <span className="flex-1 font-body text-[15px] leading-snug">
            {toast.msg}
          </span>
          {toast.caseId ? (
            <button
              type="button"
              onClick={() => toast.caseId && undo(toast.caseId)}
              className="min-h-11 px-3 font-body text-[15px] font-bold text-ind"
            >
              Urungkan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup"
              className="min-h-11 px-3 text-ink-soft"
            >
              ✕
            </button>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <h2 className="mx-4 mt-6 mb-2 font-display text-xl font-extrabold">
      {label}
    </h2>
  );
}

function FileRow({
  item,
  onMore,
  onPin,
  onArchive,
  onDelete,
}: {
  item: FileItem;
  onMore: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const pill = PILL[item.status];
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dxRef = useRef(0);
  const blockClick = useRef(false);
  const gesture = useRef<{
    x: number;
    y: number;
    base: number;
    width: number;
    moved: boolean;
    axis: "x" | "y" | null;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  function settle(value: number) {
    dxRef.current = value;
    setDx(value);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const width = cardRef.current?.offsetWidth ?? 360;
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      base: dxRef.current,
      width,
      moved: false,
      axis: null,
      timer: setTimeout(() => {
        const g = gesture.current;
        if (!g || g.moved) return;
        gesture.current = null;
        blockClick.current = true;
        onMore();
      }, 480),
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    const deltaX = event.clientX - g.x;
    const deltaY = event.clientY - g.y;
    if (!g.moved) {
      if (Math.hypot(deltaX, deltaY) < 8) return;
      g.moved = true;
      if (g.timer) clearTimeout(g.timer);
    }
    if (!g.axis) g.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    if (g.axis !== "x") return;
    setDragging(true);
    settle(Math.min(110, Math.max(-g.width * 0.7, g.base + deltaX)));
  }

  function onPointerEnd() {
    const g = gesture.current;
    gesture.current = null;
    if (g?.timer) clearTimeout(g.timer);
    setDragging(false);
    if (!g || !g.moved) return;
    blockClick.current = true;
    setTimeout(() => {
      blockClick.current = false;
    }, 350);
    if (g.axis !== "x") return;
    const value = dxRef.current;
    if (value < -g.width * 0.55) {
      settle(0);
      onDelete();
      return;
    }
    settle(value < -60 ? -156 : value > 50 ? 80 : 0);
  }

  return (
    <div className="row-in relative mx-4 mb-2 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex justify-between">
        <button
          type="button"
          tabIndex={dx > 0 ? 0 : -1}
          onClick={onPin}
          className="flex w-20 flex-col items-center justify-center gap-1 font-body text-[13px] font-semibold text-white"
          style={{ background: "#4F46E5" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9" />
          </svg>
          {item.pinned ? "Lepas" : "Sematkan"}
        </button>
        <div className="flex">
          <button
            type="button"
            tabIndex={dx < 0 ? 0 : -1}
            onClick={onArchive}
            className="flex w-[78px] flex-col items-center justify-center gap-1 font-body text-[13px] font-semibold text-white"
            style={{ background: "#5C5878" }}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="4" rx="1" />
              <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
            </svg>
            {item.status === "arsip" ? "Pulihkan" : "Arsipkan"}
          </button>
          <button
            type="button"
            tabIndex={dx < 0 ? 0 : -1}
            onClick={onDelete}
            className="flex w-[78px] flex-col items-center justify-center gap-1 font-body text-[13px] font-semibold text-white"
            style={{ background: "#E11D48" }}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(event) => {
          event.preventDefault();
          onMore();
        }}
        className="relative flex items-center rounded-2xl border-2 border-line bg-white"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging
            ? "none"
            : "transform .3s cubic-bezier(.2,.9,.25,1)",
          touchAction: "pan-y",
        }}
      >
        <Link
          href={`/berkas/${item.caseId}`}
          onClick={(event) => {
            if (blockClick.current) {
              event.preventDefault();
              return;
            }
            if (dxRef.current !== 0) {
              event.preventDefault();
              settle(0);
            }
          }}
          className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-3 pl-3"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#00758F] font-mono text-xs font-extrabold text-white">
            {COURSE_ABBR[item.course] ?? "SQL"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-body text-[17px] font-semibold">
                {item.title}
              </span>
              {item.pinned ? (
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Disematkan"
                  style={{ flex: "none" }}
                >
                  <path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9" />
                </svg>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-ink-soft">
              {item.courseLabel}, {item.doneCount} dari {item.totalNodes} misi selesai
            </span>
            <span
              className="mt-1.5 inline-block rounded-full px-2 py-0.5 font-body text-[11.5px] font-bold tracking-wide"
              style={{ background: pill.bg, color: pill.fg }}
            >
              {pill.label}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onMore();
          }}
          aria-label={`Aksi untuk ${item.title}`}
          className="grid min-h-11 min-w-11 place-items-center text-ink-soft"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const COURSE_ABBR: Record<string, string> = { sql: "SQL" };

function ContextMenu({
  item,
  onClose,
  onPin,
  onArchive,
  onDelete,
  onShare,
}: {
  item: FileItem;
  onClose: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const itemClass =
    "flex min-h-[46px] w-full items-center justify-between px-4 text-[17px]";
  const icon = {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,18,40,0.4)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="menu"
        aria-label={`Aksi untuk ${item.title}`}
        className="fixed inset-x-4 top-[22%] z-50 mx-auto max-w-[398px]"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_12px_30px_rgba(30,27,58,0.2)]">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#00758F] font-mono text-xs font-extrabold text-white">
            {COURSE_ABBR[item.course] ?? "SQL"}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-body text-[17px] font-semibold">
              {item.title}
            </span>
            <span className="block text-[13px] text-ink-soft">
              {item.courseLabel}, {item.doneCount} dari {item.totalNodes} misi selesai
            </span>
          </span>
        </div>
        <div className="mt-2.5 w-[250px] overflow-hidden rounded-[14px] bg-white/95 shadow-[0_12px_30px_rgba(30,27,58,0.2)]">
          <Link
            role="menuitem"
            href={`/berkas/${item.caseId}`}
            className={itemClass}
            style={{ color: "#1E1B3A" }}
          >
            Buka
            <svg {...icon}>
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onPin}
            className={`${itemClass} border-t border-line`}
            style={{ color: "#1E1B3A" }}
          >
            {item.pinned ? "Lepas sematan" : "Sematkan"}
            <svg {...icon}>
              <path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9" />
            </svg>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onArchive}
            className={`${itemClass} border-t border-line`}
            style={{ color: "#1E1B3A" }}
          >
            {item.status === "arsip" ? "Pulihkan" : "Arsipkan"}
            <svg {...icon}>
              <rect x="3" y="4" width="18" height="4" rx="1" />
              <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
            </svg>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onShare}
            className={`${itemClass} border-t border-line`}
            style={{ color: "#1E1B3A" }}
          >
            Bagikan
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className={`${itemClass} border-t border-line`}
            style={{ color: "#E11D48" }}
          >
            Hapus
            <svg {...icon}>
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export { FileRow };
