export const HEARTS_MAX = 5;
export const HEART_REGEN_MS = 4 * 60 * 60 * 1000;
export const FAST_ANSWER_MS = 30_000;
export const QUERY_KILAT_TARGET = 5;
export const CHECKS_PER_MINUTE = 20;
export const HINT_COIN_COST = 1;
export const HINT_PENALTY = 10;
export const XP_FIRST = 10;
export const XP_REPEAT = 5;
export const TIME_ZONE = "Asia/Jakarta";

/** SDD 3.7.3: nyawa dihitung saat dibaca, tanpa cron. */
export function heartsNow(hearts: number, updatedAt: Date, now: Date): number {
  const gained = Math.floor(
    (now.getTime() - updatedAt.getTime()) / HEART_REGEN_MS,
  );
  return Math.min(HEARTS_MAX, hearts + Math.max(0, gained));
}

/** Nyawa berkurang 1 saat jawaban salah. Mengembalikan nilai dan waktu baru. */
export function loseHeart(
  hearts: number,
  updatedAt: Date,
  now: Date,
): { hearts: number; updatedAt: Date } {
  const current = heartsNow(hearts, updatedAt, now);
  return { hearts: Math.max(0, current - 1), updatedAt: now };
}

/** SDD 3.7.2: 100 dikurangi 10 per petunjuk, paling rendah 0. */
export function scoreFor(hintsUsed: number): number {
  return Math.max(0, 100 - HINT_PENALTY * hintsUsed);
}

export function accuracyFor(correct: number, answered: number): number {
  if (answered === 0) return 0;
  return Math.round((correct / answered) * 100);
}

export function xpFor(isRepeat: boolean): number {
  return isRepeat ? XP_REPEAT : XP_FIRST;
}

/** Tanggal kalender di zona waktu pengguna, format YYYY-MM-DD. */
export function calendarDate(at: Date, timeZone = TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * SDD 3.7.4: misi terakhir hari ini membiarkan lentera tetap, kemarin menambah 1,
 * selain itu lentera kembali ke 1.
 */
export function nextLantern(
  lantern: number,
  lastDate: string | null,
  today: string,
): number {
  if (lastDate === today) return lantern;
  if (lastDate === previousDate(today)) return lantern + 1;
  return 1;
}

/** Minggu liga dimulai Senin 00.00 WIB. Mengembalikan tanggal Senin untuk tanggal ini. */
export function leagueWeekStart(today: string): string {
  const d = new Date(`${today}T00:00:00Z`);
  const day = d.getUTCDay();
  const offset = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}
