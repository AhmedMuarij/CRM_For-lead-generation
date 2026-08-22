"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard, Users, PhoneCall, BarChart3, Import, ClipboardList, LogOut, Zap, Menu, X, MoreHorizontal
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

// The bottom tab bar only has room for a handful of items — primary nav
// first, everything else lives behind "More" (which opens the same drawer
// used for the mobile hamburger).
const MOBILE_TAB_COUNT = 3;

function useNav() {
    const { isManager } = useAuth();
    return isManager ? managerNav : employeeNav;
}

function isActive(pathname: string, href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function Logo() {
    return (
        <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-2 shadow-sm">
                <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
                <p className="font-bold text-sm leading-none">EV CRM</p>
                <p className="text-xs text-white/55 mt-0.5">Lead Manager</p>
            </div>
        </div>
    );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const nav = useNav();
    const pathname = usePathname();
    return (
        <nav className="flex-1 px-3 py-4 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                    <Link key={href} href={href} onClick={onNavigate} className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        active
                            ? "bg-emerald-500/20 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}>
                        <Icon className={clsx("w-4 h-4 flex-shrink-0", active && "text-emerald-400")} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}

function UserCard({ onLogout }: { onLogout: () => void }) {
    const { user } = useAuth();
    return (
        <div className="border-t border-white/10 pt-3.5 mt-2">
            <div className="flex items-center gap-3 px-2 pb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {user?.name?.charAt(0) ?? "?"}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-white/50">{user?.role}</p>
                </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-white/5 rounded-xl transition-all">
                <LogOut className="w-4 h-4" /> Logout
            </button>
        </div>
    );
}

export function Sidebar() {
    const { logout } = useAuth();
    return (
        <aside className="hidden md:flex w-64 min-h-dvh bg-gradient-to-b from-navy-900 to-navy-800 text-white flex-col fixed left-0 top-0 z-30 shadow-xl">
            <div className="px-6 py-5 border-b border-white/10">
                <Logo />
            </div>
            <NavLinks />
            <div className="px-4 pb-4">
                <UserCard onLogout={logout} />
            </div>
        </aside>
    );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { logout } = useAuth();
    return (
        <div className={clsx("md:hidden fixed inset-0 z-50 transition-opacity", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}>
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
            <aside className={clsx(
                "absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-navy-900 to-navy-800 text-white flex flex-col transition-transform duration-200",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <Logo />
                    <button onClick={onClose} className="w-11 h-11 -mr-2.5 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <NavLinks onNavigate={onClose} />
                <div className="px-4 pb-4">
                    <UserCard onLogout={logout} />
                </div>
            </aside>
        </div>
    );
}

function MobileTopBar({ onMenu, title }: { onMenu: () => void; title: string | null }) {
    const nav = useNav();
    const pathname = usePathname();
    const current = nav.find(n => isActive(pathname, n.href));
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center gap-2 px-2.5 h-14 bg-white/90 backdrop-blur border-b border-slate-200">
            <button onClick={onMenu} className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
                <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 truncate">{title ?? current?.label ?? "EV CRM"}</span>
        </header>
    );
}

function MobileTabBar({ onMore }: { onMore: () => void }) {
    const nav = useNav();
    const pathname = usePathname();
    const primary = nav.slice(0, MOBILE_TAB_COUNT);
    const hasMore = nav.length > MOBILE_TAB_COUNT;
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex bg-white border-t border-slate-200 px-1 pt-1.5 pb-2.5">
            {primary.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                    <Link key={href} href={href} className={clsx(
                        "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-11 py-1 text-[10.5px] font-semibold",
                        active ? "text-emerald-700" : "text-slate-400"
                    )}>
                        <Icon className="w-5 h-5" />
                        {label}
                    </Link>
                );
            })}
            {hasMore && (
                <button onClick={onMore} className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-11 py-1 text-[10.5px] font-semibold text-slate-400">
                    <MoreHorizontal className="w-5 h-5" />
                    More
                </button>
            )}
        </nav>
    );
}

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user && pathname !== "/login") router.push("/login");
    }, [loading, user, pathname, router]);

    // Close the mobile drawer on route changes so it doesn't stay open
    // after navigating.
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    if (loading) return <div className="h-dvh flex items-center justify-center bg-slate-950 text-white">Loading…</div>;
    if (!user) return null;

    return (
        <div className="flex bg-slate-50 min-h-dvh">
            <Sidebar />
            <MobileTopBar onMenu={() => setDrawerOpen(true)} title={title ?? null} />
            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <main className="md:ml-64 flex-1 min-h-dvh overflow-auto pt-14 pb-20 md:pt-0 md:pb-0">{children}</main>
            <MobileTabBar onMore={() => setDrawerOpen(true)} />
        </div>
    );
}
