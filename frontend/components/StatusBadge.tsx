import { LeadStatus } from "@/types";
import clsx from "clsx";

const STATUS_STYLES: Record<LeadStatus, string> = {
    NEW: "bg-blue-100 text-blue-700 border border-blue-200",
    CONTACTED: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    FOLLOW_UP: "bg-amber-100 text-amber-700 border border-amber-200",
    PENDING: "bg-orange-100 text-orange-700 border border-orange-200",
    NO_RESPONSE: "bg-red-100 text-red-600 border border-red-200",
    WON: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    LOST: "bg-slate-100 text-slate-500 border border-slate-200",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
    NEW: "New",
    CONTACTED: "Contacted",
    FOLLOW_UP: "Follow-Up",
    PENDING: "Pending",
    NO_RESPONSE: "No Response",
    WON: "Won",
    LOST: "Lost",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
    return (
        <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", STATUS_STYLES[status])}>
            {STATUS_LABELS[status]}
        </span>
    );
}
