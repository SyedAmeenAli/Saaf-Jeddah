export const DAY = 86_400_000;

export function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
export function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
export function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtDT(ts: number) {
  return `${fmtDate(ts)} ${fmtTime(ts)}`;
}
export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
export function ago(ts: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Subsequence fuzzy score; 0 = no match. */
export function fuzzy(q: string, s: string) {
  q = q.toLowerCase().trim();
  s = s.toLowerCase();
  if (!q) return 1;
  if (s.includes(q)) return 100 - s.indexOf(q);
  let i = 0;
  let score = 0;
  for (const ch of s) {
    if (ch === q[i]) {
      i++;
      score += 2;
      if (i === q.length) return score;
    }
  }
  return 0;
}
