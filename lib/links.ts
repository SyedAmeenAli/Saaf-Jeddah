/** Resolve the best in-app destination for an audit/notification target string. */
export function targetHref(target: string): string {
  const v = target.match(/(REF|DSP)-?(\d{3})/);
  if (v) return `/fleet?open=${v[1]}-${v[2]}`;
  if (/^EMP-\d+/.test(target)) return `/users?open=${target}`;
  if (/^LOC\d+$/.test(target)) return `/locations?open=${target}`;
  return "/audit";
}
