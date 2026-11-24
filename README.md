# SAFAA by APSCO

**Every sample. Every point. Proven.** (صفاء)

Frontend-only pitch demo of a JIG-aligned digital aviation fuel quality-assurance and sampling system for APSCO, Jeddah.
All data is typed, generated mock data held in client state (Zustand). There is no backend, database or auth.

> Wording: this app says **JIG-aligned**, never "JIG-certified". Final checklist and acceptance criteria must be
> approved by APSCO Quality Control against controlled copies of the applicable standards.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

## Deploy (Vercel)

```bash
npm i -g vercel
vercel login
vercel --prod
```

No environment variables are needed.

## Demo roles

Flow: Splash → Sign In (any credentials) → Select Your Role. Switch role any time in the sidebar (Profile sheet on mobile). Also: Request Access, Reset Password, Mobile app showcase (`/mobile`) and `/design`.

| Role | Can do | Sees |
| --- | --- | --- |
| Operator | Scan, inspect, sign (employee no. + signature + PIN) | Dashboard, scan, holds, fleet, locations, matrix, training |
| Supervisor | Verify (approve / return with reason), countersign, authorised release of a HOLD, amendments, export | + Approvals, reports, audit |
| Manager | Read-only dashboards, reports, records, export | Dashboard, locations, fleet, reports, audit |
| Admin | Add locations / vehicles, assign NFC tags, matrix editor (UI only) | + Admin. **Cannot edit or delete submitted records** (locked state shown) |

Only authorised (in-date) operators can sign: try `EMP-1079` (expired) in the employee-number field.
Demo PIN: any 4 digits.

## Things to try

* Dashboard tiles, location cards, vehicle cards and report cards all **expand card → full screen** (shared-element, URL deep-linkable: `/fleet?open=REF-014`). `Esc`, the Back button, swipe-down (mobile) and the browser back button all close it.
* **Scan & Inspect** → *Simulate tap* → inspection sheet. Fail any check to raise a HOLD and see the Failed check → Re-sample → Authorised release chain.
* `REF-014` is on HOLD, `REF-009` is re-sampled and waiting for a supervisor release (switch to Supervisor, open *Holds*).
* Toggle **Offline** in the top bar, submit a check, then go online to watch the queue sync.
* `⌘K` / `Ctrl+K` opens the command palette. EN / العربية toggles full RTL.
* Reports → open one → *Export PDF* / *Export Excel* (generated client-side, libraries are lazy-loaded).

## Structure

```
app/                 routes (App Router). (app)/ is the authenticated shell
components/ui        glass primitives, expand-card, aurora
components/shell     sidebar, top bar, mobile tabs, command palette, toasts
components/features  vehicle/location detail, inspection sheet, signature, hold chain, report preview
components/illustrations  flat technical vehicle elevations, NFC glyph, phone frame
data/seed.ts         relative-to-today mock data (3 locations, 40 vehicles, 25 employees, 7 days)
lib/                 types, domain rules (sampling matrix), store, i18n dictionary, reports
```

## Replace before client use

1. **Logo**: `components/shell/Brand.tsx` (`ApscoWordmark`) is a neutral placeholder wordmark. Swap in the official APSCO logo (SVG) there. No real brand marks are used.
2. **Photos**: only the supplied apron photo (`public/images/hero-apron.webp`) is used, cropped per screen via `components/ui/Photo.tsx`. No other photos were downloaded because licences could not be verified here. Add licensed shots to `public/images` and credit them in `public/credits.md`.
3. **JIG checklist / acceptance criteria / DP range / matrix**: all illustrative placeholders pending APSCO QC approval.
4. **Hardware**: must be certified for the site's classified hazardous zone and verified with APSCO HSE and applicable Saudi regulatory requirements. No certification claims are made.

## Notes and decisions

* Next.js 16 App Router, Tailwind 4, Framer Motion, Zustand, Recharts (lazy), jsPDF + xlsx (lazy).
* The app renders client-side after hydration (the demo clock is "now", so server HTML would mismatch).
* Page transitions are enter-only slide + fade (App Router cannot cleanly animate exits).
* Arabic: UI labels are in `lib/i18n.ts` (English-keyed dictionary). Long explanatory sentences are partly English.
* `prefers-reduced-motion`, `prefers-contrast` and a `backdrop-filter` fallback are handled in `app/globals.css`.

* v2 design: sober enterprise look, no mascots/doodles; teal single accent; lucide icons at 1.5 stroke; dark only (no theme toggle).
