import { LeadStatus } from "@/types";
import clsx from "clsx";

const STATUS_STYLES: Record<LeadStatus, string> = {
    NEW: "bg-blue-50 text-blue-700 border border-blue-200",
    CONTACTED: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    FOLLOW_UP: "bg-amber-50 text-amber-700 border border-amber-200",
    PENDING: "bg-orange-50 text-orange-700 border border-orange-200",
    NO_RESPONSE: "bg-red-50 text-red-600 border border-red-200",
    WON: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    LOST: "bg-slate-100 text-slate-500 border border-slate-200",
};

const DOT_STYLES: Record<LeadStatus, string> = {
    NEW: "bg-blue-500",
    CONTACTED: "bg-indigo-500",
    FOLLOW_UP: "bg-amber-500",
    PENDING: "bg-orange-500",
    NO_RESPONSE: "bg-red-500",
    WON: "bg-emerald-600",
    LOST: "bg-slate-400",
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
        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", STATUS_STYLES[status])}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", DOT_STYLES[status])} />
            {STATUS_LABELS[status]}
        </span>
    );
}
