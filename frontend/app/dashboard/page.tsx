 "use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import {
    EmployeeDashboard,
    ManagerDashboard,
    FollowUpSummary,
} from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import {
    AlertTriangle,
    Clock,
    Plus,
    Users,
    LayoutDashboard,
} from "lucide-react";

/* =========================================================
   Shared row components
   ========================================================= */

function OverdueRow({ fu }: { fu: FollowUpSummary }) {
    return (
        <Link
            href={`/leads/${fu.lead_id}`}
            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition group"
        >
            <div>
                <p className="font-semibold text-sm text-slate-800">
                    {fu.customer_name}
                </p>
                <p className="text-xs text-slate-500">
                    {fu.phone} · {fu.vehicle_interest || "—"}
                </p>
            </div>

            <div className="text-right">
                <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formatDistanceToNow(new Date(fu.scheduled_at), {
                        addSuffix: true,
                    })}
                </span>
            </div>
        </Link>
    );
}

function TodayRow({ fu }: { fu: FollowUpSummary }) {
    return (
        <Link
            href={`/leads/${fu.lead_id}`}
            className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
        >
            <div>
                <p className="font-semibold text-sm text-slate-800">
                    {fu.customer_name}
                </p>
                <p className="text-xs text-slate-500">
                    {fu.phone} · {fu.vehicle_interest || "—"}
                </p>
            </div>

            <span className="text-xs text-amber-700 font-semibold">
                {format(new Date(fu.scheduled_at), "h:mm a")}
            </span>
        </Link>
    );
}

/* =========================================================
   Safe data helpers
   ========================================================= */

function safeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

function safeNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
}

/* =========================================================
   Dashboard page
   ========================================================= */

export default function DashboardPage() {
    const { isManager } = useAuth();

    const [data, setData] = useState<
        EmployeeDashboard | ManagerDashboard | null
    >(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const endpoint = isManager
            ? "/api/dashboard/manager"
            : "/api/dashboard/employee";

        setLoading(true);
        setError(false);

        api.get(endpoint)
            .then((response) => {
                if (!mounted) return;

                const raw = response?.data ?? {};

                if (isManager) {
                    const stats = raw.stats ?? {};

                    const normalizedManagerData: ManagerDashboard = {
                        ...raw,
                        stats: {
                            ...stats,
                            total_leads: safeNumber(stats.total_leads),
                            overdue_follow_ups: safeNumber(
                                stats.overdue_follow_ups
                            ),
                            today_follow_ups: safeNumber(
                                stats.today_follow_ups
                            ),
                            won: safeNumber(stats.won),
                            new: safeNumber(stats.new),
                            contacted: safeNumber(stats.contacted),
                            follow_up: safeNumber(stats.follow_up),
                            pending: safeNumber(stats.pending),
                            no_response: safeNumber(stats.no_response),
                            lost: safeNumber(stats.lost),
                        },
                        employee_performance: safeArray(
                            raw.employee_performance
                        ),
                    };

                    setData(normalizedManagerData);
                } else {
                    const stats = raw.stats ?? {};

                    const normalizedEmployeeData: EmployeeDashboard = {
                        ...raw,
                        stats: {
                            ...stats,
                            total: safeNumber(stats.total),
                            new: safeNumber(stats.new),
                            contacted: safeNumber(stats.contacted),
                            follow_up: safeNumber(stats.follow_up),
                            pending: safeNumber(stats.pending),
                            no_response: safeNumber(stats.no_response),
                            won: safeNumber(stats.won),
                            lost: safeNumber(stats.lost),
                            overdue: safeNumber(stats.overdue),
                            today_follow_ups: safeNumber(
                                stats.today_follow_ups
                            ),
                            upcoming: safeNumber(stats.upcoming),
                        },
                        overdue_follow_ups: safeArray(
                            raw.overdue_follow_ups
                        ),
                        today_follow_ups: safeArray(
                            raw.today_follow_ups
                        ),
                        new_leads: safeArray(raw.new_leads),
                    };

                    setData(normalizedEmployeeData);
                }

                setError(false);
            })
            .catch((requestError) => {
                console.error("Dashboard API error:", requestError);

                if (!mounted) return;

                setData(null);
                setError(true);
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [isManager]);

    /* =====================================================
       Loading state
       ===================================================== */

    if (loading) {
        return (
            <AppShell>
                <div className="p-6 text-slate-400 text-sm">
                    Loading dashboard…
                </div>
            </AppShell>
        );
    }

    /* =====================================================
       Error state
       ===================================================== */

    if (error || !data) {
        return (
            <AppShell>
                <div className="p-6">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Failed to load dashboard. Please refresh the page.
                    </div>
                </div>
            </AppShell>
        );
    }

    /* =====================================================
       Manager dashboard
       ===================================================== */

    if (isManager) {
        const d = data as ManagerDashboard;
        const stats = d.stats ?? {};
        const performance = safeArray(d.employee_performance);

        return (
            <AppShell>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6 text-slate-400" />
                        <h1 className="text-2xl font-bold text-slate-800">
                            Manager Dashboard
                        </h1>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Leads"
                            value={safeNumber(stats.total_leads)}
                            color="blue"
                        />

                        <StatCard
                            label="Overdue Follow-Ups"
                            value={safeNumber(
                                stats.overdue_follow_ups
                            )}
                            color="red"
                            urgent={
                                safeNumber(stats.overdue_follow_ups) > 0
                            }
                        />

                        <StatCard
                            label="Today's Follow-Ups"
                            value={safeNumber(
                                stats.today_follow_ups
                            )}
                            color="amber"
                        />

                        <StatCard
                            label="Won"
                            value={safeNumber(stats.won)}
                            color="emerald"
                        />
                    </div>

                    {/* Status cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="New"
                            value={safeNumber(stats.new)}
                            color="blue"
                        />

                        <StatCard
                            label="Contacted"
                            value={safeNumber(stats.contacted)}
                            color="indigo"
                        />

                        <StatCard
                            label="Follow-Up"
                            value={safeNumber(stats.follow_up)}
                            color="amber"
                        />

                        <StatCard
                            label="Lost"
                            value={safeNumber(stats.lost)}
                            color="slate"
                        />
                    </div>

                    {/* Employee performance */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            <h2 className="font-semibold text-slate-700">
                                Employee Performance
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    <tr>
                                        {[
                                            "Employee",
                                            "Assigned",
                                            "New",
                                            "Contacted",
                                            "Follow-Up",
                                            "Pending",
                                            "Won",
                                            "Lost",
                                            "Overdue",
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-4 py-3 text-left"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {performance.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-4 py-8 text-center text-sm text-slate-400"
                                            >
                                                No employee performance data
                                                available.
                                            </td>
                                        </tr>
                                    ) : (
                                        performance.map((employee) => (
                                            <tr
                                                key={employee.employee_id}
                                                className="hover:bg-slate-50 transition"
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    <Link
                                                        href={`/employees/${employee.employee_id}`}
                                                        className="hover:text-emerald-600"
                                                    >
                                                        {
                                                            employee.employee_name
                                                        }
                                                    </Link>
                                                </td>

                                                <td className="px-4 py-3 text-slate-600">
                                                    {safeNumber(
                                                        employee.assigned
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-blue-600">
                                                        {safeNumber(
                                                            employee.new
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-indigo-600">
                                                        {safeNumber(
                                                            employee.contacted
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-amber-600">
                                                        {safeNumber(
                                                            employee.follow_up
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-orange-600">
                                                        {safeNumber(
                                                            employee.pending
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-emerald-600 font-semibold">
                                                        {safeNumber(
                                                            employee.won
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-slate-400">
                                                        {safeNumber(
                                                            employee.lost
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={
                                                            safeNumber(
                                                                employee.overdue
                                                            ) > 0
                                                                ? "text-red-600 font-bold"
                                                                : "text-slate-400"
                                                        }
                                                    >
                                                        {safeNumber(
                                                            employee.overdue
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    /* =====================================================
       Employee dashboard
       ===================================================== */

    const d = data as EmployeeDashboard;
    const stats = d.stats ?? {};

    const overdueFollowUps = safeArray(d.overdue_follow_ups);
    const todayFollowUps = safeArray(d.today_follow_ups);
    const newLeads = safeArray(d.new_leads);

    return (
        <AppShell>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-6 h-6 text-slate-400" />
                    <h1 className="text-2xl font-bold text-slate-800">
                        My Dashboard
                    </h1>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="My Leads"
                        value={safeNumber(stats.total)}
                        color="blue"
                    />

                    <StatCard
                        label="Overdue"
                        value={safeNumber(stats.overdue)}
                        color="red"
                        urgent={safeNumber(stats.overdue) > 0}
                    />

                    <StatCard
                        label="Today's Follow-Ups"
                        value={safeNumber(
                            stats.today_follow_ups
                        )}
                        color="amber"
                    />

                    <StatCard
                        label="New Leads"
                        value={safeNumber(stats.new)}
                        color="indigo"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Pending"
                        value={safeNumber(stats.pending)}
                        color="orange"
                    />

                    <StatCard
                        label="Contacted"
                        value={safeNumber(stats.contacted)}
                        color="indigo"
                    />

                    <StatCard
                        label="Won"
                        value={safeNumber(stats.won)}
                        color="emerald"
                    />

                    <StatCard
                        label="Lost"
                        value={safeNumber(stats.lost)}
                        color="slate"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overdue */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200">
                        <div className="px-4 py-3 border-b border-red-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h2 className="font-semibold text-red-700 text-sm">
                                🔴 Overdue ({safeNumber(stats.overdue)})
                            </h2>
                        </div>

                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                            {overdueFollowUps.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">
                                    No overdue follow-ups 🎉
                                </p>
                            ) : (
                                overdueFollowUps.map((fu) => (
                                    <OverdueRow
                                        key={fu.follow_up_id}
                                        fu={fu}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Today */}
                    <div className="bg-white rounded-2xl shadow-sm border border-amber-200">
                        <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <h2 className="font-semibold text-amber-700 text-sm">
                                Today (
                                {safeNumber(stats.today_follow_ups)}
                                )
                            </h2>
                        </div>

                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                            {todayFollowUps.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">
                                    No follow-ups today
                                </p>
                            ) : (
                                todayFollowUps.map((fu) => (
                                    <TodayRow
                                        key={fu.follow_up_id}
                                        fu={fu}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* New Leads */}
                    <div className="bg-white rounded-2xl shadow-sm border border-blue-200">
                        <div className="px-4 py-3 border-b border-blue-100 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-500" />
                            <h2 className="font-semibold text-blue-700 text-sm">
                                New Leads ({safeNumber(stats.new)})
                            </h2>
                        </div>

                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                            {newLeads.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">
                                    No new leads
                                </p>
                            ) : (
                                newLeads.map((lead) => (
                                    <Link
                                        key={lead.lead_id}
                                        href={`/leads/${lead.lead_id}`}
                                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">
                                                {lead.customer_name}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {lead.phone} ·{" "}
                                                {lead.city || "—"}
                                            </p>
                                        </div>

                                        <span className="text-xs text-blue-600">
                                            {lead.vehicle_interest || "—"}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
