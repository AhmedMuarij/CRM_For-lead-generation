"use client";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/StatusBadge";
import api from "@/lib/api";
import { FollowUp } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertTriangle, Clock, CalendarClock, CheckCircle2, LucideIcon } from "lucide-react";
import clsx from "clsx";

type FilterType = "overdue" | "today" | "upcoming";

export default function FollowUpsPage() {
    const [filter, setFilter] = useState<FilterType>("today");
    const [data, setData] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get("/api/follow-ups", { params: { filter } });
            setData(r.data);
        } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    async function complete(id: number) {
        try {
            await api.post(`/api/follow-ups/${id}/complete`);
            toast.success("Marked as complete!");
            load();
        } catch { toast.error("Failed"); }
    }

    const tabs: { key: FilterType; label: string; icon: LucideIcon; color: string }[] = [
        { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "text-red-600 border-red-500" },
        { key: "today", label: "Today", icon: Clock, color: "text-amber-600 border-amber-500" },
        { key: "upcoming", label: "Upcoming", icon: CalendarClock, color: "text-blue-600 border-blue-500" },
    ];

    return (
        <AppShell>
            <div className="p-6 space-y-5">
                <h1 className="text-2xl font-bold text-slate-800">Follow-Ups</h1>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                filter === t.key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
                            )}>
                            <t.icon className={clsx("w-4 h-4", filter === t.key && t.color.split(" ")[0])} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading && <p className="text-slate-400 text-sm">Loading…</p>}
                    {!loading && data.length === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No {filter} follow-ups</p>
                            <p className="text-slate-400 text-sm mt-1">You&apos;re all caught up 🎉</p>
                        </div>
                    )}
                    {data.map(fu => {
                        const isOver = new Date(fu.scheduled_at) < new Date();
                        return (
                            <div key={fu.id} className={clsx(
                                "bg-white rounded-2xl border p-5 flex items-start justify-between gap-4 shadow-sm",
                                isOver ? "border-red-200" : "border-slate-200"
                            )}>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {isOver && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                        <Link href={`/leads/${fu.lead_id}`} className="font-semibold text-slate-800 hover:text-emerald-600 text-lg">
                                            {fu.customer_name}
                                        </Link>
                                        {fu.lead_status && <StatusBadge status={fu.lead_status} />}
                                    </div>
                                    <p className="text-sm text-slate-500">{fu.phone} · {fu.vehicle_interest || "—"}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                                        <span className={clsx("font-semibold", isOver ? "text-red-600" : "text-amber-600")}>
                                            {isOver ? "⚠ Overdue: " : "🕐 "}{format(new Date(fu.scheduled_at), "MMM d, yyyy · h:mm a")}
                                            {isOver && ` (${formatDistanceToNow(new Date(fu.scheduled_at), { addSuffix: true })})`}
                                        </span>
                                        {fu.assigned_employee_name && <span>By {fu.assigned_employee_name}</span>}
                                    </div>
                                    {fu.notes && <p className="text-xs text-slate-500 italic mt-1">&quot;{fu.notes}&quot;</p>}
                                </div>
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Link href={`/leads/${fu.lead_id}`} className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-center">
                                        Open Lead
                                    </Link>
                                    <button onClick={() => complete(fu.id)} className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-xl hover:bg-slate-50 text-center">
                                        Complete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppShell>
    );
}
