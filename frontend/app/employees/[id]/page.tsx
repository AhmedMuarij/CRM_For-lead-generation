"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { User, LeadListItem } from "@/types";

interface EmployeeStats {
    total_assigned: number;
    won: number;
    lost: number;
    overdue: number;
}
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { isManager, loading } = useAuth();
    const router = useRouter();
    const [employee, setEmployee] = useState<User | null>(null);
    const [leads, setLeads] = useState<LeadListItem[]>([]);
    const [stats, setStats] = useState<EmployeeStats | null>(null);

    useEffect(() => {
        if (!loading && !isManager) router.push("/dashboard");
        if (!isManager) return;
        api.get(`/api/users/${id}`).then(r => setEmployee(r.data));
        api.get(`/api/users/${id}/stats`).then(r => setStats(r.data));
        api.get("/api/leads", { params: { employee_id: id, page_size: 100 } }).then(r => setLeads(r.data.items));
    }, [isManager, loading, id, router]);

    if (!employee) return <AppShell><div className="p-6 text-slate-400">Loading…</div></AppShell>;

    return (
        <AppShell>
            <div className="p-6 space-y-5 max-w-4xl">
                <div className="flex items-center gap-3">
                    <Link href="/employees" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
                        <p className="text-sm text-slate-500">{employee.email} · {employee.role}</p>
                    </div>
                    <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${employee.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {employee.active ? "Active" : "Inactive"}
                    </span>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Assigned", value: stats.total_assigned },
                            { label: "Won", value: stats.won },
                            { label: "Lost", value: stats.lost },
                            { label: "Overdue", value: stats.overdue },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <p className="text-xs text-slate-400">{s.label}</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Leads table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <h2 className="font-semibold text-slate-700">Assigned Leads ({leads.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
                                <tr>
                                    {["Customer", "Phone", "Vehicle", "Status", "Next Follow-Up", "Created"].map(h =>
                                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No leads assigned</td></tr>
                                )}
                                {leads.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            <Link href={`/leads/${l.id}`} className="font-medium text-slate-800 hover:text-emerald-600">{l.customer_name}</Link>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.phone}</td>
                                        <td className="px-4 py-3 text-slate-500">{l.vehicle_interest || "—"}</td>
                                        <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {l.next_follow_up_at ? format(new Date(l.next_follow_up_at), "MMM d, h:mm a") : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(l.created_at), "MMM d")}</td>
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
