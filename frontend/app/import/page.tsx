"use client";
import { useState } from "react";
import axios from "axios";
import { AppShell } from "@/components/layout";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Import, CheckCircle2, AlertTriangle, History } from "lucide-react";
import { format } from "date-fns";

interface ImportError {
    row: number;
    error: string;
}

interface ImportResult {
    rows_found: number;
    new_leads: number;
    duplicates: number;
    errors: number;
    error_details: ImportError[];
}

interface ImportLogEntry {
    id: number;
    imported_by: string;
    rows_found: number;
    new_leads: number;
    duplicates: number;
    errors: number;
    imported_at: string;
}

export default function ImportPage() {
    const { isManager, loading } = useAuth();
    const router = useRouter();
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [history, setHistory] = useState<ImportLogEntry[]>([]);

    useEffect(() => {
        if (!loading && !isManager) router.push("/dashboard");
        if (isManager) api.get("/api/import/history").then(r => setHistory(r.data));
    }, [isManager, loading, router]);

    async function runImport() {
        setImporting(true); setResult(null);
        try {
            const r = await api.post("/api/import/google-sheets");
            setResult(r.data);
            toast.success(`Import complete! ${r.data.new_leads} new leads added.`);
            api.get("/api/import/history").then(r => setHistory(r.data));
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
            toast.error(message || "Import failed. Check Google Sheet configuration.");
        } finally { setImporting(false); }
    }

    return (
        <AppShell>
            <div className="p-6 space-y-6 max-w-2xl">
                <div className="flex items-center gap-2">
                    <Import className="w-6 h-6 text-slate-400" />
                    <h1 className="text-2xl font-bold text-slate-800">Import Leads</h1>
                </div>

                {/* Import button */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div>
                        <h2 className="font-semibold text-slate-700">Import from Google Sheets</h2>
                        <p className="text-sm text-slate-500 mt-1">Connects to the configured Google Sheet, reads all rows, deduplicates, and creates new leads. Existing leads are never overwritten.</p>
                    </div>
                    <button
                        onClick={runImport}
                        disabled={importing}
                        id="import-btn"
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition"
                    >
                        <Import className="w-5 h-5" />
                        {importing ? "Importing…" : "Import Leads from Google Sheets"}
                    </button>
                </div>

                {/* Result */}
                {result && (
                    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <h2 className="font-semibold text-emerald-700">Import Completed</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["Rows Found", result.rows_found, "text-slate-700"],
                                ["New Leads Created", result.new_leads, "text-emerald-700 font-bold"],
                                ["Duplicates Skipped", result.duplicates, "text-amber-600"],
                                ["Errors", result.errors, "text-red-600"],
                            ].map(([l, v, cls]) => (
                                <div key={l as string} className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-sm text-slate-500">{l}</span>
                                    <span className={`text-sm ${cls}`}>{v as number}</span>
                                </div>
                            ))}
                        </div>
                        {result.error_details?.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-2"><AlertTriangle className="w-3 h-3" /> Error Details</p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {result.error_details.map((e: ImportError) => (
                                        <p key={e.row} className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">Row {e.row}: {e.error}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* History */}
                {history.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" />
                            <h2 className="font-semibold text-slate-700">Import History</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {history.map(log => (
                                <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{format(new Date(log.imported_at), "MMM d, yyyy · h:mm a")}</p>
                                        <p className="text-xs text-slate-400">By {log.imported_by}</p>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>{log.rows_found} rows</span>
                                        <span className="text-emerald-600 font-semibold">+{log.new_leads} new</span>
                                        <span className="text-amber-600">{log.duplicates} dup</span>
                                        {log.errors > 0 && <span className="text-red-500">{log.errors} err</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
