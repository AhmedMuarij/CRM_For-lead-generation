"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { PaginatedLeads, LeadListItem, User, LeadStatus } from "@/types";
import { format } from "date-fns";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import clsx from "clsx";

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "FOLLOW_UP", "PENDING", "NO_RESPONSE", "WON", "LOST"];

export default function LeadsPage() {
    const { isManager } = useAuth();
    const [data, setData] = useState<PaginatedLeads | null>(null);
    const [employees, setEmployees] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, page_size: 25 };
            if (search) params.search = search;
            if (status) params.status = status;
            if (employeeId) params.employee_id = employeeId;
            const r = await api.get("/api/leads", { params });
            setData(r.data);
        } finally { setLoading(false); }
    }, [page, search, status, employeeId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (isManager) api.get("/api/users").then(r => setEmployees(r.data));
    }, [isManager]);

    const isOverdue = (lead: LeadListItem) =>
        lead.next_follow_up_at && lead.status === "FOLLOW_UP" && new Date(lead.next_follow_up_at) < new Date();

    return (
        <AppShell>
            <div className="p-6 space-y-5">
                <h1 className="text-2xl font-bold text-slate-800">{isManager ? "All Leads" : "My Leads"}</h1>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search name, phone, ID…"
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    {isManager && (
                        <select
                            value={employeeId}
                            onChange={e => { setEmployeeId(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">All Employees</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3 text-left">Customer</th>
                                    <th className="px-4 py-3 text-left">Phone</th>
                                    <th className="px-4 py-3 text-left">City</th>
                                    <th className="px-4 py-3 text-left">Vehicle</th>
                                    <th className="px-4 py-3 text-left">Units</th>
                                    {isManager && <th className="px-4 py-3 text-left">Employee</th>}
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Follow-Up</th>
                                    <th className="px-4 py-3 text-left">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                                )}
                                {!loading && data?.items.length === 0 && (
                                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No leads found</td></tr>
                                )}
                                {!loading && data?.items.map(lead => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            <Link href={`/leads/${lead.id}`} className="font-medium text-slate-800 hover:text-emerald-600">
                                                {lead.customer_name}
                                                {isOverdue(lead) && <AlertTriangle className="inline w-3 h-3 text-red-500 ml-1" />}
                                            </Link>
                                            <p className="text-xs text-slate-400">#{lead.external_lead_id || lead.id}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => navigator.clipboard.writeText(lead.phone)} title="Copy" className="font-mono text-xs text-slate-600 hover:text-emerald-600 transition">{lead.phone}</button>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{lead.city || "—"}</td>
                                        <td className="px-4 py-3 text-slate-500">{lead.vehicle_interest || "—"}</td>
                                        <td className="px-4 py-3 text-slate-500">{lead.units || "—"}</td>
                                        {isManager && (
                                            <td className="px-4 py-3 text-slate-500">{lead.assigned_employee_name || <span className="text-red-400">Unassigned</span>}</td>
                                        )}
                                        <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {lead.next_follow_up_at
                                                ? <span className={clsx(isOverdue(lead) && "text-red-600 font-semibold")}>{format(new Date(lead.next_follow_up_at), "MMM d, h:mm a")}</span>
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(lead.created_at), "MMM d")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data && data.total_pages > 1 && (
                        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-500">Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, data.total)} of {data.total}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.total_pages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
