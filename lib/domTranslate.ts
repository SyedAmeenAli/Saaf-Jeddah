import { AR } from "./i18n";

const orig = new WeakMap<Node, string>();
const ATTRS = ["placeholder", "aria-label", "title"] as const;
const origAttr = new WeakMap<Element, Record<string, string>>();
const SKIP = new Set(["SCRIPT", "STYLE", "CODE", "TEXTAREA", "NOSCRIPT"]);

const MON: Record<string, string> = { Jan: "يناير", Feb: "فبراير", Mar: "مارس", Apr: "أبريل", May: "مايو", Jun: "يونيو", Jul: "يوليو", Aug: "أغسطس", Sep: "سبتمبر", Oct: "أكتوبر", Nov: "نوفمبر", Dec: "ديسمبر" };
const UNIT: Record<string, string> = { m: "دقيقة", h: "ساعة", d: "يوم" };
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Today's samples \($/, () => `عينات اليوم (`],
  [/^Current: (.+)$/, (m) => `الحالي: ${m[1]}`],
  [/^authorisation expired$/, () => `التفويض منتهٍ`],
  [/^User (\S+) role set to (.+)$/, (m) => `تم تعيين دور المستخدم ${m[1]} إلى ${AR[m[2]] ?? m[2]}`],
  [/^Vehicle (\S+) added to (.+)$/, (m) => `أُضيفت المركبة ${m[1]} إلى ${m[2].replace(/^Location (\d+)$/, "الموقع $1")}`],
  [/^Tag (\S+) assigned$/, (m) => `تم تعيين الوسم ${m[1]}`],
  [/^Vehicle added to (\S+)$/, (m) => `أُضيفت مركبة إلى ${m[1]}`],
  [/^Location (\S+) added$/, (m) => `أُضيف الموقع ${m[1]}`],
  [/^User (\S+) added$/, (m) => `أُضيف المستخدم ${m[1]}`],
  [/^User role changed.*$/, () => `تم تغيير دور المستخدم`],
  [/^Expired (.+)$/, (m) => `منتهٍ ${m[1]}`],
  [/^Valid to (.+)$/, (m) => `صالح حتى ${m[1]}`],
  [/^expired$/, () => `منتهٍ`],
  [/^authorisation$/, () => `التفويض`],
  [/^(\d+)([mhd]) ago$/, (m) => `قبل ${m[1]} ${UNIT[m[2]]}`],
  [/^result (\d+)([mhd]) ago$/, (m) => `النتيجة قبل ${m[1]} ${UNIT[m[2]]}`],
  [/^due (.+)$/, (m) => `الاستحقاق ${m[1]}`],
  [/^(\d+) points$/, (m) => `${m[1]} نقاط`],
  [/^(\d+) samples need your review$/, (m) => `${m[1]} عينة بحاجة لمراجعتك`],
  [/^(\d+) failed need investigation$/, (m) => `${m[1]} غير مطابقة بحاجة لتحقيق`],
  [/^(\d{2}) ([A-Z][a-z]{2})$/, (m) => (MON[m[2]] ? `${m[1]} ${MON[m[2]]}` : m[0])],
  [/^(\d+) of (\d+) points tagged$/, (m) => `${m[1]} من ${m[2]} نقطة معلّمة`],
  [/^(\d+(?:\.\d+)?)% pass rate$/, (m) => `نسبة نجاح ${m[1]}%`],
  [/^(\d+) expected$/, (m) => `${m[1]} متوقعة`],
  [/^(\d+) still outstanding$/, (m) => `${m[1]} متبقية`],
  [/^(\d+) samples · (\d+) failed \(7 days\)$/, (m) => `${m[1]} عينة · ${m[2]} غير مطابقة (7 أيام)`],
  [/^(\d+) units · (\d+) samples · (\d+) failed$/, (m) => `${m[1]} وحدة · ${m[2]} عينة · ${m[3]} غير مطابقة`],
  [/^(\d+) authorisation expired$/, (m) => `${m[1]} تفويض منتهٍ`],
  [/^: authorisation expired$/, () => `: التفويض منتهٍ`],
  [/^All \($/, () => `الكل (`],
  [/^Unassigned \($/, () => `غير معيّن (`],
  [/^(\d+) passed$/, (m) => `${m[1]} مطابقة`],
  [/^(\d+) dispensers · (\d+) refuellers$/, (m) => `${m[1]} موزّعاً · ${m[2]} مزوّداً`],
];

function tx(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const a = AR[t];
  if (a) return raw.replace(t, a);
  for (const [re, f] of RULES) { const m = t.match(re); if (m) return raw.replace(t, f(m)); }
  if (t.includes(" · ")) {
    const parts = t.split(" · ");
    let hit = false;
    const out = parts.map((p) => { const r = AR[p] ?? RULES.reduce<string | null>((acc, [re, f]) => acc ?? (p.match(re) ? f(p.match(re)!) : null), null); if (r) hit = true; return r ?? p; });
    if (hit) return raw.replace(t, out.join(" · "));
  }
  return null;
}

function text(n: Text) {
  const p = n.parentElement;
  if (!p || SKIP.has(p.tagName) || p.closest("[data-no-tr]")) return;
  const cur = n.data;
  const base = orig.get(n);
  if (base !== undefined && cur === tx(base)) return;
  const r = tx(cur);
  if (r !== null) { orig.set(n, cur); n.data = r; }
}

function attrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const r = tx(v);
    if (r !== null) {
      const o = origAttr.get(el) ?? {};
      o[a] = v; origAttr.set(el, o);
      el.setAttribute(a, r);
    }
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { text(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  attrs(el);
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = w.nextNode();
  while (n) { if (n.nodeType === Node.TEXT_NODE) text(n as Text); else attrs(n as Element); n = w.nextNode(); }
}

/** Backstop for strings that come from data (point names, occasions, statuses) rather than JSX literals. Restores English when switched off. */
export function startDomTranslate(): () => void {
  walk(document.body);
  const mo = new MutationObserver((muts) => {
    mo.disconnect();
    for (const m of muts) {
      if (m.type === "characterData") text(m.target as Text);
      else if (m.type === "attributes") attrs(m.target as Element);
      else m.addedNodes.forEach((n) => walk(n));
    }
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  });
  mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  return () => {
    mo.disconnect();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n = w.nextNode();
    while (n) { const o = orig.get(n); if (o !== undefined) (n as Text).data = o; n = w.nextNode(); }
    document.querySelectorAll("*").forEach((el) => { const o = origAttr.get(el); if (o) for (const k in o) el.setAttribute(k, o[k]); });
  };
}
