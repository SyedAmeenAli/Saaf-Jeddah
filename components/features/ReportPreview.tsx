"use client";
import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { REPORTS, buildReport } from "@/lib/reports";
import { fmtDT } from "@/lib/utils";
import { Button, inputCls } from "@/components/ui/Glass";
import { ApscoWordmark } from "@/components/shell/Brand";

function Scribble({ seed }: { seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = (n: number) => ((h >> n) & 15) / 15;
  const d = `M2 ${14 + r(1) * 6} q${6 + r(2) * 6} ${-14 - r(3) * 6} ${12} ${2} t${12} ${-4 - r(4) * 6} t${12} ${6 + r(5) * 4} t${14} ${-8 + r(6) * 6}`;
  return <svg viewBox="0 0 64 26" className="h-5 w-14" aria-label={`Signature of ${seed}`}><path d={d} fill="none" stroke="#1d3a8a" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

const clean = (v: string | number) => String(v).replace("✓", "OK").replace("✕", "X");

export function ReportPreview({ id }: { id: string }) {
  const t = useT();
  const can = useCan();
  const checks = useStore((s) => s.checks);
  const due = useStore((s) => s.due);
  const audit = useStore((s) => s.audit);
  const employees = useStore((s) => s.employees);
  const vehicles = useStore((s) => s.vehicles);
  const [vehicleId, setVehicleId] = useState("REF-014");
  const [employeeId, setEmployeeId] = useState("EMP-1024");
    const def = REPORTS.find((r) => r.id === id) ?? REPORTS[0];
  const data = useMemo(() => buildReport(id, { checks, due, audit, employees }, { vehicleId, employeeId }), [id, checks, due, audit, employees, vehicleId, employeeId]);
  const showSig = !!data.sig;
  const stamp = new Date();

  const toast = useStore((s) => s.toast);
  const fly = () => toast("pass", "Export ready: file downloaded");

  const exportPdf = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16); doc.text(`SAFAA by APSCO - ${def.title}`, 40, 40);
    doc.setFontSize(9); doc.setTextColor(110); doc.text(`Generated ${fmtDT(stamp.getTime())} | Illustrative demo data | JIG-aligned (not JIG-certified)`, 40, 56);
    autoTable(doc, {
      startY: 72, head: [[...data.head, ...(showSig ? ["Operator sig.", "Supervisor sig."] : [])]],
      body: data.rows.map((r) => [...r.cells.map(clean), ...(showSig ? ["signed", String(r.cells[r.cells.length - 1]).startsWith("EMP") ? "signed" : ""] : [])]),
      styles: { fontSize: 7.5, cellPadding: 3 }, headStyles: { fillColor: [20, 40, 90] },
      didParseCell: (d) => { if (d.section === "body" && (d.cell.raw === "X" || d.cell.raw === "FAIL")) { d.cell.styles.textColor = [200, 30, 30]; d.cell.styles.fontStyle = "bold"; } },
    });
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(120); doc.text("Illustrative demo data. Final checklist and acceptance criteria to be approved by APSCO Quality Control against controlled copies of the applicable standards.", 40, doc.internal.pageSize.getHeight() - 18); }
    doc.save(`SAFAA-${id}-${new Date().toISOString().slice(0, 10)}.pdf`);
    fly();
  };
  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([data.head, ...data.rows.map((r) => r.cells.map(clean))]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, def.title.slice(0, 28));
    XLSX.writeFile(wb, `SAFAA-${id}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    fly();
  };

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {id === "vehicle" && <select aria-label="Vehicle" className={`${inputCls} !h-10 !w-44`} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>{vehicles.map((v) => <option key={v.id} className="text-black">{v.id}</option>)}</select>}
        {id === "employee" && <select aria-label="Employee" className={`${inputCls} !h-10 !w-64`} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>{employees.filter((e) => e.role === "operator").map((e) => <option key={e.id} value={e.id} className="text-black">{e.id} · {e.name}</option>)}</select>}
        <div className="ms-auto flex gap-2">
          <Button onClick={exportPdf} disabled={!can("export")}><FileText size={16} /> {t("Export PDF")}</Button>
          <Button onClick={exportXlsx} disabled={!can("export")}><FileSpreadsheet size={16} /> {t("Export Excel")}</Button>
        </div>
      </div>
      {!can("export") && <p className="text-xs text-muted">{t("Read-only for this role")}: export is available to Supervisor, Manager and Admin.</p>}

      {/* paper form */}
      <div className="overflow-x-auto rounded-xl bg-white p-5 text-[#0b1426] shadow-2xl md:p-8" style={{ colorScheme: "light" }}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#0b1426] pb-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a5873]">Fuel quality assurance record</p><h3 className="font-display text-xl font-bold">{def.title}</h3><p className="text-xs text-[#4a5873]">JIG-aligned form (demo layout). Illustrative demo data.</p></div>
          <div className="text-end text-xs text-[#4a5873]"><p className="font-bold tracking-[0.25em] text-[#0b1426]">APSCO</p><ApscoWordmark className="!text-[#4a5873]" /><p>{fmtDT(stamp.getTime())}</p></div>
        </div>
        <table className="w-full min-w-[56rem] border-collapse text-[11px]">
          <thead>
            <tr>{[...data.head, ...(showSig ? ["Operator sig.", "Supervisor sig."] : [])].map((h) => <th key={h} className="border border-[#9aa8c7] bg-[#eef2fa] px-2 py-1.5 text-start font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && <tr><td className="border border-[#9aa8c7] p-6 text-center text-[#4a5873]" colSpan={data.head.length + 2}>{t("No records")}</td></tr>}
            {data.rows.slice(0, 60).map((r, i) => (
              <tr key={i} className={r.result === "fail" ? "bg-[#ffecec]" : ""}>
                {r.cells.map((c, j) => {
                  const s = String(c);
                  return <td key={j} className={`border border-[#c3cde0] px-2 py-1.5 ${s === "✕" || s === "FAIL" || s === "OVERDUE" ? "font-bold text-[#c0262d]" : s === "✓" || s === "PASS" ? "font-bold text-[#0f7b55]" : ""}`}>{s}</td>;
                })}
                {showSig && <td className="border border-[#c3cde0] px-2 py-0.5"><Scribble seed={String(r.cells[9] ?? "x")} /></td>}
                {showSig && <td className="border border-[#c3cde0] px-2 py-0.5">{String(r.cells[11]).startsWith("EMP") ? <Scribble seed={String(r.cells[11])} /> : <span className="text-[#9aa8c7]">pending</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length > 60 && <p className="mt-2 text-xs text-[#4a5873]">Showing 60 of {data.rows.length} rows. Export for the full set.</p>}
        <p className="mt-4 text-[10px] leading-relaxed text-[#6c7a94]">Illustrative demo data. Final checklist and acceptance criteria to be approved by APSCO Quality Control against controlled copies of the applicable standards.</p>
      </div>

    </div>
  );
}
