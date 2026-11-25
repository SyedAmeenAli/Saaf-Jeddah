"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookLock, Bell, LogOut, MapPin, Palette, RotateCcw, Wifi } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Button, Card, Chip, PageHeader, Switch, inputCls } from "@/components/ui/Glass";

function Row({ icon: I, title, desc, children }: { icon: typeof Bell; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-t border-hair py-3.5 first:border-0 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-teal"><I size={18} strokeWidth={1.5} /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p>{desc && <p className="text-xs text-muted">{desc}</p>}</div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const prefs = useStore((s) => s.prefs);
  const setPref = useStore((s) => s.setPref);
  const offline = useStore((s) => s.offline);
  const toggleOffline = useStore((s) => s.toggleOffline);
  const locations = useStore((s) => s.locations);
  const active = useStore((s) => s.activeLocation);
  const setActive = useStore((s) => s.setActiveLocation);
  const reset = useStore((s) => s.resetDemo);
  const logout = useStore((s) => s.logout);

  return (
    <>
      <PageHeader title={t("Settings")} sub="Preferences, operations and demo data." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Preferences">
          <Row icon={Palette} title={t("Language")} desc="Interface language and layout direction">
            <div className="flex gap-2"><Chip active={lang === "en"} onClick={() => setLang("en")}>EN</Chip><Chip active={lang === "ar"} onClick={() => setLang("ar")}>عربي</Chip></div>
          </Row>
          <Row icon={MapPin} title={t("Location")} desc="Default scope for dashboards and lists">
            <select aria-label="Default location" className={`${inputCls} !h-10 max-w-48`} value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="all" className="text-black">{t("All")} {t("Locations")}</option>
              {locations.map((l) => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}
            </select>
          </Row>
          <Row icon={Bell} title="Failure alerts" desc="Toast and bell notification when a check fails"><Switch checked={prefs.notifyFail} onChange={(v) => setPref("notifyFail", v)} label="Failure alerts" /></Row>
          <Row icon={Bell} title="Overdue reminders" desc="Notify when a scheduled sample is overdue"><Switch checked={prefs.notifyOverdue} onChange={(v) => setPref("notifyOverdue", v)} label="Overdue reminders" /></Row>
          <Row icon={Palette} title="Haptic feedback" desc="Vibrate on NFC read where supported"><Switch checked={prefs.haptics} onChange={(v) => setPref("haptics", v)} label="Haptic feedback" /></Row>
        </Card>

        <div className="space-y-4">
          <Card title="Operations">
            <Row icon={Wifi} title="Offline mode (demo)" desc="Submissions queue on the device and sync when online"><Switch checked={offline} onChange={() => toggleOffline()} label="Offline mode" /></Row>
            <Row icon={BookLock} title="JIG standard version" desc="JIG 1 Issue 13 / JIG 2 Issue 13, rule set v1. Version-controlled and configurable for future issues."><Link href="/admin" className="text-sm text-teal hover:underline">Open</Link></Row>
          </Card>
          <Card title="Demo data">
            <p className="mb-3 text-sm text-muted">Everything here is illustrative. Reset to regenerate the seeded history relative to today.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={reset}><RotateCcw size={16} /> Reset demo data</Button>
              <Button onClick={() => router.push("/design")}>Design system</Button>
              <Button onClick={() => { logout(); router.push("/login"); }}><LogOut size={16} /> {t("Sign out")}</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
