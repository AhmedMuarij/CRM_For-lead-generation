"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import api from "@/lib/api";
import { User } from "@/types";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Users, Plus, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function EmployeesPage() {
    const { isManager } = useAuth();
    const router = useRouter();
    const [employees, setEmployees] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isManager) { router.push("/dashboard"); return; }
        api.get("/api/users").then(r => setEmployees(r.data));
    }, [isManager]);

    async function createEmployee(e: React.FormEvent) {
        e.preventDefault();
        if (!name || !email || !password) { toast.error("All fields required"); return; }
        setSubmitting(true);
        try {
            await api.post("/api/users", { name, email, password, role: "EMPLOYEE" });
            toast.success("Employee created!");
            setShowForm(false); setName(""); setEmail(""); setPassword("");
            api.get("/api/users").then(r => setEmployees(r.data));
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed");
        } finally { setSubmitting(false); }
    }

    async function toggleActive(emp: User) {
        try {
            await api.patch(`/api/users/${emp.id}`, { active: !emp.active });
            toast.success(emp.active ? "Employee deactivated" : "Employee activated");
            api.get("/api/users").then(r => setEmployees(r.data));
        } catch { toast.error("Failed"); }
    }

    return (
        <AppShell>
            <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-6 h-6 text-slate-400" />
                        <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
                    </div>
                    <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700">
                        <Plus className="w-4 h-4" /> Add Employee
                    </button>
                </div>

                {/* Add form */}
                {showForm && (
                    <form onSubmit={createEmployee} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                        <h2 className="font-semibold text-slate-700">New Call Center Employee</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={submitting} className="px-6 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60">
                                {submitting ? "Creating…" : "Create Employee"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm">Cancel</button>
                        </div>
                    </form>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            <tr>
                                {["Name", "Email", "Assigned", "Active Leads", "Status", "Actions"].map(h => (
                                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.filter(e => e.role === "EMPLOYEE").map(emp => (
                                <tr key={emp.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        <Link href={`/employees/${emp.id}`} className="font-medium text-slate-800 hover:text-emerald-600">{emp.name}</Link>
                                        <p className="text-xs text-slate-400">ID #{emp.id}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                                    <td className="px-4 py-3 text-slate-600">{emp.assigned_leads_count ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-600">{emp.active_leads_count ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${emp.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                            {emp.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {emp.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <Link href={`/employees/${emp.id}`} className="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">View</Link>
                                        <button onClick={() => toggleActive(emp)} className={`px-3 py-1 text-xs rounded-lg ${emp.active ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"}`}>
                                            {emp.active ? "Deactivate" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppShell>
    );
}
