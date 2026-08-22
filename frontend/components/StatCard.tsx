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
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500", iconBg: "bg-blue-50" },
    indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", icon: "text-indigo-500", iconBg: "bg-indigo-50" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-600", iconBg: "bg-amber-50" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-600", iconBg: "bg-orange-50" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500", iconBg: "bg-red-50" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-600", iconBg: "bg-emerald-50" },
    slate: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: "text-slate-400", iconBg: "bg-slate-100" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500", iconBg: "bg-rose-50" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "text-violet-500", iconBg: "bg-violet-50" },
};

export function StatCard({ label, value, icon: Icon, color = "slate", urgent }: StatCardProps) {
    const c = colorMap[color];
    return (
        <div className={clsx(
            "relative rounded-2xl border p-4 flex items-center gap-3.5 shadow-sm bg-white",
            urgent ? "bg-red-50 border-red-200" : "border-slate-200"
        )}>
            {urgent && (
                <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
            {urgent && <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-red-500" />}
            {Icon && (
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", urgent ? "bg-red-100" : c.iconBg)}>
                    <Icon className={clsx("w-5 h-5", urgent ? "text-red-600" : c.icon)} />
                </div>
            )}
            <div>
                <p className={clsx("text-[11px] font-bold uppercase tracking-wide", urgent ? "text-red-700" : "text-slate-500")}>{label}</p>
                <p className={clsx("text-2xl font-extrabold mt-0.5 num", urgent ? "text-red-700" : c.text)}>{value}</p>
            </div>
        </div>
    );
}
