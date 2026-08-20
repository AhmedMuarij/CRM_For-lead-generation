import clsx from "clsx";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    color?: "blue" | "indigo" | "amber" | "orange" | "red" | "emerald" | "slate" | "rose" | "violet";
    urgent?: boolean;
}

const colorMap = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-400" },
    indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", icon: "text-indigo-400" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-400" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-400" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-400" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-400" },
    slate: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: "text-slate-400" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-400" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "text-violet-400" },
};

export function StatCard({ label, value, icon: Icon, color = "slate", urgent }: StatCardProps) {
    const c = colorMap[color];
    return (
        <div className={clsx(
            "rounded-xl border p-4 flex items-center gap-4 shadow-sm",
            c.bg, c.border,
            urgent && "ring-2 ring-red-400 ring-offset-1 animate-pulse"
        )}>
            {Icon && (
                <div className={clsx("p-2 rounded-lg bg-white shadow-sm", c.icon)}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                <p className={clsx("text-2xl font-bold mt-0.5", c.text)}>{value}</p>
            </div>
        </div>
    );
}
