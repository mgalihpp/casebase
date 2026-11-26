/* Progres pemain, disimpan lokal di perangkat (localStorage). */
import { MAX_HEARTS } from "./content";

export type MissionProgress = { xp: number; hints: number; mistakes: number; at: string };
export type Progress = {
  v: 1;
  started: boolean;
  xp: number;
  hearts: number;
  heartsDay: string;
  streak: number;
  streakDay: string | null;
  done: Record<string, MissionProgress>;
  drafts: Record<string, string>;
  solved: boolean;
};

const KEY = "casebase:progress:v1";

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fresh = (): Progress => ({
  v: 1,
  started: false,
  xp: 0,
  hearts: MAX_HEARTS,
  heartsDay: today(),
  streak: 0,
  streakDay: null,
  done: {},
  drafts: {},
  solved: false,
});

export function loadProgress(): Progress {
  let p = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1) p = { ...fresh(), ...parsed };
    }
  } catch {
    /* penyimpanan tidak tersedia, main tanpa simpan */
  }
  /* Nyawa terisi penuh setiap hari baru. Lentera padam kalau kemarin tidak main. */
  if (p.heartsDay !== today()) {
    p.hearts = MAX_HEARTS;
    p.heartsDay = today();
  }
  if (p.streakDay && p.streakDay !== today() && p.streakDay !== yesterday()) p.streak = 0;
  return p;
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* abaikan */
  }
}

/** Catat hari ini sebagai hari main. Kembalikan true kalau lentera bertambah. */
export function bumpStreak(p: Progress): boolean {
  const t = today();
  if (p.streakDay === t) return false;
  p.streak = p.streakDay === yesterday() ? p.streak + 1 : 1;
  p.streakDay = t;
  return true;
}
