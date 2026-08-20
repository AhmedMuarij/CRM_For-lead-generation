"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthResponse, UserRole } from "@/types";
import api from "@/lib/api";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isManager: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem("crm_token");
        const storedUser = localStorage.getItem("crm_user");
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
        localStorage.setItem("crm_token", data.access_token);
        const u: AuthUser = { id: data.user_id, name: data.name, email, role: data.role };
        localStorage.setItem("crm_user", JSON.stringify(u));
        setToken(data.access_token);
        setUser(u);
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isManager: user?.role === "MANAGER", loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
