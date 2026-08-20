"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { EmployeeDashboard, ManagerDashboard, FollowUpSummary } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import {
    AlertTriangle, Clock, Plus, Users, LayoutDashboard
} from "lucide-react";

function OverdueRow({ fu }: { fu: FollowUpSummary }) {
    return (
        <Link href={`/leads/${fu.lead_id}`} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition group">
            <div>
                <p className="font-semibold text-sm text-slate-800">{fu.customer_name}</p>
                <p className="text-xs text-slate-500">{fu.phone} · {fu.vehicle_interest || "—"}</p>
            </div>
            <div className="text-right">
                <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {formatDistanceToNow(new Date(fu.scheduled_at), { addSuffix: true })}
                </span>
            </div>
        </Link>
    );
}

function TodayRow({ fu }: { fu: FollowUpSummary }) {
    return (
        <Link href={`/leads/${fu.lead_id}`} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition">
            <div>
                <p className="font-semibold text-sm text-slate-800">{fu.customer_name}</p>
                <p className="text-xs text-slate-500">{fu.phone} · {fu.vehicle_interest || "—"}</p>
            </div>
            <span className="text-xs text-amber-700 font-semibold">{format(new Date(fu.scheduled_at), "h:mm a")}</span>
        </Link>
    );
}

export default function DashboardPage() {
    const { isManager } = useAuth();
    const [data, setData] = useState<EmployeeDashboard | ManagerDashboard | null>(null);

    useEffect(() => {
        const endpoint = isManager ? "/api/dashboard/manager" : "/api/dashboard/employee";
        api.get(endpoint).then(r => setData(r.data)).catch(() => { });
    }, [isManager]);

    if (!data) return (
        <AppShell>
            <div className="p-6 text-slate-400 text-sm">Loading dashboard…</div>
        </AppShell>
    );

    if (isManager) {
        const d = data as ManagerDashboard;
        const perf = d.employee_performance;
        return (
            <AppShell>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6 text-slate-400" />
                        <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Leads" value={d.stats.total_leads} color="blue" />
                        <StatCard label="Overdue Follow-Ups" value={d.stats.overdue_follow_ups} color="red" urgent={d.stats.overdue_follow_ups > 0} />
                        <StatCard label="Today's Follow-Ups" value={d.stats.today_follow_ups} color="amber" />
                        <StatCard label="Won" value={d.stats.won ?? 0} color="emerald" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="New" value={d.stats.new ?? 0} color="blue" />
                        <StatCard label="Contacted" value={d.stats.contacted ?? 0} color="indigo" />
                        <StatCard label="Follow-Up" value={d.stats.follow_up ?? 0} color="amber" />
                        <StatCard label="Lost" value={d.stats.lost ?? 0} color="slate" />
                    </div>

                    {/* Employee performance */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            <h2 className="font-semibold text-slate-700">Employee Performance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    <tr>
                                        {["Employee", "Assigned", "New", "Contacted", "Follow-Up", "Pending", "Won", "Lost", "Overdue"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {perf.map(e => (
                                        <tr key={e.employee_id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                <Link href={`/employees/${e.employee_id}`} className="hover:text-emerald-600">{e.employee_name}</Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{e.assigned}</td>
                                            <td className="px-4 py-3"><span className="text-blue-600">{e.new}</span></td>
                                            <td className="px-4 py-3"><span className="text-indigo-600">{e.contacted}</span></td>
                                            <td className="px-4 py-3"><span className="text-amber-600">{e.follow_up}</span></td>
                                            <td className="px-4 py-3"><span className="text-orange-600">{e.pending}</span></td>
                                            <td className="px-4 py-3"><span className="text-emerald-600 font-semibold">{e.won}</span></td>
                                            <td className="px-4 py-3"><span className="text-slate-400">{e.lost}</span></td>
                                            <td className="px-4 py-3"><span className={e.overdue > 0 ? "text-red-600 font-bold" : "text-slate-400"}>{e.overdue}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    // Employee dashboard
    const d = data as EmployeeDashboard;
    return (
        <AppShell>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-6 h-6 text-slate-400" />
                    <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="My Leads" value={d.stats.total} color="blue" />
                    <StatCard label="Overdue" value={d.stats.overdue} color="red" urgent={d.stats.overdue > 0} />
                    <StatCard label="Today's Follow-Ups" value={d.stats.today_follow_ups} color="amber" />
                    <StatCard label="New Leads" value={d.stats.new} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Pending" value={d.stats.pending} color="orange" />
                    <StatCard label="Contacted" value={d.stats.contacted} color="indigo" />
                    <StatCard label="Won" value={d.stats.won} color="emerald" />
                    <StatCard label="Lost" value={d.stats.lost} color="slate" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overdue */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200">
                        <div className="px-4 py-3 border-b border-red-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h2 className="font-semibold text-red-700 text-sm">🔴 Overdue ({d.stats.overdue})</h2>
                        </div>
                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                            {d.overdue_follow_ups.length === 0
                                ? <p className="text-xs text-slate-400 text-center py-4">No overdue follow-ups 🎉</p>
                                : d.overdue_follow_ups.map(fu => <OverdueRow key={fu.follow_up_id} fu={fu} />)}
                        </div>
                    </div>

                    {/* Today */}
                    <div className="bg-white rounded-2xl shadow-sm border border-amber-200">
                        <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <h2 className="font-semibold text-amber-700 text-sm">Today ({d.stats.today_follow_ups})</h2>
                        </div>
                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                            {d.today_follow_ups.length === 0
                                ? <p className="text-xs text-slate-400 text-center py-4">No follow-ups today</p>
                                : d.today_follow_ups.map(fu => <TodayRow key={fu.follow_up_id} fu={fu} />)}
                        </div>
                    </div>

                    {/* New Leads */}
                    <div className="bg-white rounded-2xl shadow-sm border border-blue-200">
                        <div className="px-4 py-3 border-b border-blue-100 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-500" />
                            <h2 className="font-semibold text-blue-700 text-sm">New Leads ({d.stats.new})</h2>
                        </div>
                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                            {d.new_leads.length === 0
                                ? <p className="text-xs text-slate-400 text-center py-4">No new leads</p>
                                : d.new_leads.map(l => (
                                    <Link key={l.lead_id} href={`/leads/${l.lead_id}`} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{l.customer_name}</p>
                                            <p className="text-xs text-slate-500">{l.phone} · {l.city || "—"}</p>
                                        </div>
                                        <span className="text-xs text-blue-600">{l.vehicle_interest || "—"}</span>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
