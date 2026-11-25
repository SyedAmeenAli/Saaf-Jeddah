"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export default function Donut({ data, total, height = 170 }: { data: { name: string; value: number; color: string }[]; total: number; height?: number }) {
  return (
    <div className="relative" style={{ height }} role="img" aria-label={data.map((d) => `${d.name} ${d.value}`).join(", ")}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={{ background: "var(--glass-strong)", border: "1px solid var(--hair-strong)", borderRadius: 6, color: "var(--fg)" }} />
          <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none" animationDuration={1000}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold tnum">{total}</span><span className="text-[11px] text-muted">Total</span></div>
    </div>
  );
}
