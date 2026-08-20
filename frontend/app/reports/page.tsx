"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp } from "lucide-react";

export default function ReportsPage() {
    const { isManager, loading } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<any>(null);
    const [perf, setPerf] = useState<any>(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        if (!loading && !isManager) router.push("/dashboard");
    }, [isManager, loading]);

    function load() {
        const params: any = {};
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        api.get("/api/reports/summary", { params }).then(r => setSummary(r.data));
        api.get("/api/reports/employee-performance", { params }).then(r => setPerf(r.data));
    }

    useEffect(() => { if (isManager) load(); }, [isManager]);

    return (
        <AppShell>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-slate-400" />
                    <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
                </div>

                {/* Date filter */}
                <div className="flex gap-3 items-end bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">From Date</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">To Date</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                    </div>
                    <button onClick={load} className="px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700">Apply Filter</button>
                    <button onClick={() => { setFromDate(""); setToDate(""); setTimeout(load, 50); }} className="px-4 py-2 border border-slate-300 rounded-xl text-sm">Clear</button>
                </div>

                {/* Summary cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Leads", value: summary.total_leads, color: "bg-blue-50 border-blue-200 text-blue-700" },
                            { label: "Won", value: summary.won, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                            { label: "Lost", value: summary.lost, color: "bg-slate-50 border-slate-200 text-slate-600" },
                            { label: "Conversion Rate", value: `${summary.conversion_rate}%`, color: "bg-violet-50 border-violet-200 text-violet-700" },
                        ].map(c => (
                            <div key={c.label} className={`rounded-2xl border p-5 shadow-sm ${c.color}`}>
                                <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
                                <p className="text-3xl font-bold mt-1">{c.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Status breakdown */}
                {summary?.status_breakdown && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h2 className="font-semibold text-slate-700 mb-4">Status Breakdown</h2>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                            {Object.entries(summary.status_breakdown).map(([s, v]) => (
                                <div key={s} className="text-center p-3 bg-slate-50 rounded-xl">
                                    <p className="text-xl font-bold text-slate-700">{v as number}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{s.replace("_", " ")}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Employee performance */}
                {perf?.employees && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <h2 className="font-semibold text-slate-700">Employee Performance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
                                    <tr>
                                        {["Employee", "Assigned", "Calls", "Won", "Lost", "Conversion"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {perf.employees.map((e: any) => (
                                        <tr key={e.employee_id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{e.employee_name} {!e.active && <span className="text-xs text-slate-400">(inactive)</span>}</td>
                                            <td className="px-4 py-3 text-slate-600">{e.assigned_leads}</td>
                                            <td className="px-4 py-3 text-slate-600">{e.total_calls}</td>
                                            <td className="px-4 py-3 text-emerald-600 font-semibold">{e.won}</td>
                                            <td className="px-4 py-3 text-slate-400">{e.lost}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-violet-600">{e.conversion_rate}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
