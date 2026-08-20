"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { Lead, CallLog, FollowUp, LeadNote, User, LeadStatus, CallOutcome } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Phone, Copy, PhoneCall, Clock, StickyNote, AlertTriangle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

const STATUS_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "FOLLOW_UP", "PENDING", "NO_RESPONSE", "WON", "LOST"];
const OUTCOME_OPTIONS: CallOutcome[] = ["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP_REQUIRED", "PENDING", "NO_ANSWER", "BUSY", "WRONG_NUMBER", "OTHER"];

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold text-slate-700">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function LeadDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user, isManager } = useAuth();
    const [lead, setLead] = useState<Lead | null>(null);
    const [calls, setCalls] = useState<CallLog[]>([]);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [notes, setNotes] = useState<LeadNote[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);

    // Forms
    const [logCallOpen, setLogCallOpen] = useState(false);
    const [callOutcome, setCallOutcome] = useState<CallOutcome>("INTERESTED");
    const [callNotes, setCallNotes] = useState("");
    const [callDt, setCallDt] = useState(new Date().toISOString().slice(0, 16));

    const [fuOpen, setFuOpen] = useState(false);
    const [fuDate, setFuDate] = useState("");
    const [fuNotes, setFuNotes] = useState("");

    const [noteText, setNoteText] = useState("");
    const [newStatus, setNewStatus] = useState<LeadStatus | "">("");
    const [assignTo, setAssignTo] = useState("");

    const reload = () => {
        api.get(`/api/leads/${id}`).then(r => { setLead(r.data); setNewStatus(r.data.status); });
        api.get(`/api/leads/${id}/calls`).then(r => setCalls(r.data));
        api.get(`/api/follow-ups`, { params: { lead_id: id } }).catch(() => { });
        api.get(`/api/leads/${id}/notes`).then(r => setNotes(r.data));
    };

    useEffect(() => { reload(); }, [id]);
    useEffect(() => { if (isManager) api.get("/api/users").then(r => setEmployees(r.data.filter((u: User) => u.role === "EMPLOYEE" && u.active))); }, [isManager]);

    async function submitCall() {
        try {
            await api.post(`/api/leads/${id}/calls`, { call_datetime: new Date(callDt).toISOString(), outcome: callOutcome, notes: callNotes });
            toast.success("Call logged!");
            setLogCallOpen(false); setCallNotes(""); reload();
        } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed"); }
    }

    async function submitFollowUp() {
        if (!fuDate) { toast.error("Please select a follow-up date and time"); return; }
        try {
            await api.post(`/api/leads/${id}/follow-ups`, { scheduled_at: new Date(fuDate).toISOString(), notes: fuNotes });
            toast.success("Follow-up scheduled!");
            setFuOpen(false); setFuNotes(""); setFuDate(""); reload();
        } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed"); }
    }

    async function submitNote() {
        if (!noteText.trim()) return;
        try {
            await api.post(`/api/leads/${id}/notes`, { content: noteText });
            toast.success("Note added"); setNoteText(""); reload();
        } catch (e: any) { toast.error("Failed"); }
    }

    async function updateStatus() {
        if (!newStatus || newStatus === lead?.status) return;
        if (newStatus === "FOLLOW_UP" && !lead?.next_follow_up_at) {
            toast.error("Please schedule a follow-up date and time first");
            setFuOpen(true); return;
        }
        try {
            await api.patch(`/api/leads/${id}`, { status: newStatus });
            toast.success("Status updated"); reload();
        } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed"); }
    }

    async function assignLead() {
        if (!assignTo) return;
        try {
            await api.post(`/api/leads/${id}/assign`, { employee_id: parseInt(assignTo) });
            toast.success("Lead assigned"); setAssignTo(""); reload();
        } catch (e: any) { toast.error("Failed"); }
    }

    if (!lead) return <AppShell><div className="p-6 text-slate-400">Loading…</div></AppShell>;

    const overdue = lead.next_follow_up_at && lead.status === "FOLLOW_UP" && new Date(lead.next_follow_up_at) < new Date();

    return (
        <AppShell>
            <div className="p-6 space-y-5 max-w-5xl">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{lead.customer_name}</h1>
                        <p className="text-sm text-slate-500 mt-1">#{lead.external_lead_id || lead.id} · Created {format(new Date(lead.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={lead.status} />
                        {overdue && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> OVERDUE</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left col */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Customer info */}
                        <Section title="Customer Information" icon={Phone}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="text-xs text-slate-500">Phone Number</p>
                                        <p className="font-bold text-lg text-slate-800 font-mono">{lead.phone}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { navigator.clipboard.writeText(lead.phone); toast.success("Copied!"); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                            <Copy className="w-3 h-3" /> Copy
                                        </button>
                                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                            <PhoneCall className="w-3 h-3" /> Call
                                        </a>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {[["Email", lead.email], ["City", lead.city], ["Country", lead.country], ["Gender", lead.gender], ["Pref. Call Time", lead.preferred_call_time]].map(([l, v]) => (
                                        <div key={l as string}><p className="text-xs text-slate-400">{l}</p><p className="font-medium text-slate-700">{v || "—"}</p></div>
                                    ))}
                                </div>
                            </div>
                        </Section>

                        {/* Vehicle / Business */}
                        <Section title="Vehicle & Business Info" icon={Clock}>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[["Vehicle Interest", lead.vehicle_interest], ["Version", lead.vehicle_version], ["Variant", lead.vehicle_variant], ["Units", lead.units], ["Operation Type", lead.operation_type], ["Lead Type", lead.lead_type], ["Source", lead.source], ["Campaign", lead.campaign]].map(([l, v]) => (
                                    <div key={l as string}><p className="text-xs text-slate-400">{l}</p><p className="font-medium text-slate-700">{v || "—"}</p></div>
                                ))}
                            </div>
                        </Section>

                        {/* Call History */}
                        <Section title={`Call History (${calls.length} attempts)`} icon={PhoneCall}>
                            {calls.length === 0
                                ? <p className="text-sm text-slate-400">No calls logged yet.</p>
                                : <div className="space-y-3">
                                    {calls.map(c => (
                                        <div key={c.id} className="p-3 border border-slate-200 rounded-xl">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-500">Attempt #{c.attempt_number}</span>
                                                <span className="text-xs text-slate-400">{format(new Date(c.call_datetime), "MMM d · h:mm a")}</span>
                                            </div>
                                            <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full",
                                                c.outcome === "INTERESTED" ? "bg-emerald-100 text-emerald-700" :
                                                    c.outcome === "NOT_INTERESTED" ? "bg-red-100 text-red-600" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>{c.outcome.replace("_", " ")}</span>
                                            {c.notes && <p className="text-xs text-slate-600 mt-2 italic">"{c.notes}"</p>}
                                            <p className="text-xs text-slate-400 mt-1">By {c.employee_name}</p>
                                        </div>
                                    ))}
                                </div>}
                        </Section>

                        {/* Notes */}
                        <Section title="Notes" icon={StickyNote}>
                            <div className="space-y-2 mb-3">
                                {notes.map(n => (
                                    <div key={n.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-sm text-slate-700">{n.content}</p>
                                        <p className="text-xs text-slate-400 mt-1">{n.employee_name} · {format(new Date(n.created_at), "MMM d, h:mm a")}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note…"
                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                <button onClick={submitNote} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Add</button>
                            </div>
                        </Section>
                    </div>

                    {/* Right col — Actions */}
                    <div className="space-y-5">
                        {/* CRM Info */}
                        <Section title="CRM Details" icon={CheckCircle2}>
                            <div className="space-y-2 text-sm">
                                {[
                                    ["Assigned To", lead.assigned_employee_id ? employees.find(e => e.id === lead.assigned_employee_id)?.name || "Employee #" + lead.assigned_employee_id : "Unassigned"],
                                    ["Call Attempts", lead.contact_attempt_count],
                                    ["Last Call", lead.last_call_at ? format(new Date(lead.last_call_at), "MMM d, h:mm a") : "Never"],
                                    ["Next Follow-Up", lead.next_follow_up_at ? format(new Date(lead.next_follow_up_at), "MMM d, h:mm a") : "—"],
                                ].map(([l, v]) => (
                                    <div key={l as string} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                                        <span className="text-slate-500">{l}</span>
                                        <span className="font-medium text-slate-700">{v as string}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Change Status */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                            <h3 className="font-semibold text-slate-700 text-sm">Change Status</h3>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value as LeadStatus)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                            </select>
                            <button onClick={updateStatus} className="w-full py-2 text-sm bg-slate-800 text-white rounded-xl hover:bg-slate-700">Update Status</button>
                        </div>

                        {/* Log Call */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                            <h3 className="font-semibold text-slate-700 text-sm">Log Call</h3>
                            {!logCallOpen
                                ? <button onClick={() => setLogCallOpen(true)} className="w-full py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2"><PhoneCall className="w-4 h-4" /> Log a Call</button>
                                : <div className="space-y-2">
                                    <input type="datetime-local" value={callDt} onChange={e => setCallDt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                                    <select value={callOutcome} onChange={e => setCallOutcome(e.target.value as CallOutcome)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
                                        {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                                    </select>
                                    <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Notes…" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm resize-none" />
                                    <div className="flex gap-2">
                                        <button onClick={submitCall} className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-xl">Save</button>
                                        <button onClick={() => setLogCallOpen(false)} className="flex-1 py-2 text-sm border border-slate-300 rounded-xl">Cancel</button>
                                    </div>
                                </div>}
                        </div>

                        {/* Schedule Follow-Up */}
                        <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3">
                            <h3 className="font-semibold text-amber-700 text-sm">Schedule Follow-Up</h3>
                            {!fuOpen
                                ? <button onClick={() => setFuOpen(true)} className="w-full py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Schedule</button>
                                : <div className="space-y-2">
                                    <label className="text-xs text-slate-500">Date & Time *</label>
                                    <input type="datetime-local" value={fuDate} onChange={e => setFuDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                                    <textarea value={fuNotes} onChange={e => setFuNotes(e.target.value)} placeholder="Notes (optional)…" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm resize-none" />
                                    <div className="flex gap-2">
                                        <button onClick={submitFollowUp} className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-xl">Schedule</button>
                                        <button onClick={() => setFuOpen(false)} className="flex-1 py-2 text-sm border border-slate-300 rounded-xl">Cancel</button>
                                    </div>
                                </div>}
                        </div>

                        {/* Assign (Manager only) */}
                        {isManager && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                                <h3 className="font-semibold text-slate-700 text-sm">Assign / Reassign</h3>
                                <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
                                    <option value="">Select employee…</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                                <button onClick={assignLead} className="w-full py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Assign</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
