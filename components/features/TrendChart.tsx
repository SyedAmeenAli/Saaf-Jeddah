"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface P { data: { day: string; pass: number; fail: number }[]; height?: number; bars?: boolean }

export default function TrendChart({ data, height = 200, bars = false }: P) {
  const common = { data, margin: { top: 8, right: 4, left: -22, bottom: 0 } };
  const axis = { stroke: "#64748b", fontSize: 11, tickLine: false, axisLine: false } as const;
  const tip = <Tooltip cursor={{ stroke: "rgba(255,255,255,0.15)" }} contentStyle={{ background: "rgba(9,18,40,0.92)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, color: "#fff", fontSize: 12 }} />;
  return (
    <div style={{ height }} role="img" aria-label="7-day pass and fail trend chart">
      <ResponsiveContainer width="100%" height="100%">
        {bars ? (
          <BarChart {...common}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" {...axis} /><YAxis {...axis} allowDecimals={false} />{tip}
            <Bar dataKey="pass" stackId="a" fill="#59dfce" fillOpacity={0.9} radius={[0, 0, 4, 4]} animationDuration={900} />
            <Bar dataKey="fail" stackId="a" fill="#ef6f6c" radius={[4, 4, 0, 0]} animationDuration={900} />
          </BarChart>
        ) : (
          <AreaChart {...common}>
            <defs>
              <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#59dfce" stopOpacity={0.35} /><stop offset="1" stopColor="#59dfce" stopOpacity={0} /></linearGradient>
              <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ef6f6c" stopOpacity={0.35} /><stop offset="1" stopColor="#ef6f6c" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" {...axis} /><YAxis {...axis} allowDecimals={false} />{tip}
            <Area type="monotone" dataKey="pass" stroke="#59dfce" strokeWidth={2} fill="url(#gp)" dot={{ r: 3, fill: "#59dfce", strokeWidth: 0 }} animationDuration={1100} />
            <Area type="monotone" dataKey="fail" stroke="#ef6f6c" strokeWidth={1.5} fill="url(#gf)" animationDuration={1100} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
