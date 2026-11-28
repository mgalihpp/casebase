// Tanggal kalender zona Asia/Jakarta dalam format yyyy-mm-dd.
const jakartaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toJakartaDate(date: Date): string {
  return jakartaDay.format(date);
}

function shiftDay(day: string, offset: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset))
    .toISOString()
    .slice(0, 10);
}

// dates: tanggal yyyy-mm-dd yang punya minimal satu node selesai.
// Streak hidup selama hari ini atau kemarin punya aktivitas; hari ini belum
// aktif tidak memutus streak.
export function computeStreak(dates: string[], today: string): number {
  const active = new Set(dates);
  let cursor = active.has(today) ? today : shiftDay(today, -1);

  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}
