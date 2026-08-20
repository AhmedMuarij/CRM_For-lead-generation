"use client";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) { toast.error("Please enter email and password"); return; }
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
            toast.error(message || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-2xl shadow-emerald-500/30 mb-4">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">EV CRM</h1>
                    <p className="text-slate-400 mt-1 text-sm">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                placeholder="you@evcrm.com"
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>
                </div>
                <p className="text-center text-xs text-slate-500 mt-6">EV CRM · Call Center Lead Manager</p>
            </div>
        </div>
    );
}
