"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
    LayoutDashboard, Users, PhoneCall, BarChart3, Import, ClipboardList, LogOut, Zap
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const employeeNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "My Leads", icon: ClipboardList },
    { href: "/follow-ups", label: "Follow-Ups", icon: PhoneCall },
];

const managerNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "All Leads", icon: ClipboardList },
    { href: "/follow-ups", label: "Follow-Ups", icon: PhoneCall },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/import", label: "Import Leads", icon: Import },
];

export function Sidebar() {
    const { user, isManager, logout } = useAuth();
    const pathname = usePathname();
    const nav = isManager ? managerNav : employeeNav;

    return (
        <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-30 shadow-xl">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
                <div className="rounded-lg bg-emerald-500 p-2">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-bold text-sm leading-none">EV CRM</p>
                    <p className="text-xs text-slate-400 mt-0.5">Lead Manager</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {nav.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                    return (
                        <Link key={href} href={href} className={clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            active
                                ? "bg-emerald-600 text-white shadow-md"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="px-4 py-4 border-t border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
                        {user?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.role}</p>
                    </div>
                </div>
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-all">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </aside>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && pathname !== "/login") router.push("/login");
    }, [loading, user, pathname, router]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white">Loading…</div>;
    if (!user) return null;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="ml-64 flex-1 min-h-screen overflow-auto">{children}</main>
        </div>
    );
}
