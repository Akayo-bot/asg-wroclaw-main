import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

type Point = { x: string; y: number };
export function MiniStats({ title, data, color = "#34d399" }: {
    title: string; data: Point[]; color?: string;
}) {
    return (
        <div className="rounded-xl bg-[#121816]/90 ring-1 ring-emerald-400/25 p-4">
            <div className="text-sm text-emerald-200/80 mb-2">{title}</div>
            <div className="h-[88px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="x" hide />
                        <Tooltip
                            contentStyle={{ background: "#0f1513", border: "1px solid rgba(16,185,129,.3)", borderRadius: 8 }}
                            labelStyle={{ color: "#a7f3d0" }}
                            formatter={(v) => [v, ""]}
                        />
                        <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill="url(#g)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}



