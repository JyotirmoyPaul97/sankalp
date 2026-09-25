"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, setSession, clearSession } from "@/lib/api-client";
import type { AuthUser } from "@/types/domain";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: "idle",
      error: null,
      login: async (email, password) => {
        set({ status: "loading", error: null });
        try {
          const data = await api.post<{ token: string; user: AuthUser }>(
            "/api/v1/auth/login",
            { email, password },
          );
          setSession(data.token, data.user);
          set({ user: data.user, token: data.token, status: "authenticated", error: null });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Login failed";
          set({ status: "error", error: msg, user: null, token: null });
          return false;
        }
      },
      logout: () => {
        clearSession();
        set({ user: null, token: null, status: "idle", error: null });
        setActiveView("overview");
      },
      hydrate: () => {
        if (typeof window === "undefined") return;
        const t = localStorage.getItem("kd_token");
        const u = localStorage.getItem("kd_user");
        if (t && u) {
          try {
            set({ token: t, user: JSON.parse(u), status: "authenticated" });
          } catch {
            clearSession();
            set({ status: "idle" });
          }
        }
      },
    }),
    { name: "kd-auth" },
  ),
);

interface NavState {
  activeView: string;
  activeDistrictId: string | null;
  setActiveView: (v: string) => void;
  openDistrict: (id: string) => void;
  sidebarOpen: boolean;
  setSidebar: (open: boolean) => void;
}

export const useNav = create<NavState>((set) => ({
  activeView: "overview",
  activeDistrictId: null,
  setActiveView: (v) => set({ activeView: v, activeDistrictId: null }),
  openDistrict: (id) => set({ activeView: "district-profile", activeDistrictId: id }),
  sidebarOpen: false,
  setSidebar: (open) => set({ sidebarOpen: open }),
}));

// Convenience: setActiveView re-exported to avoid circular import friction in nav file.
export const setActiveView = (v: string) => useNav.getState().setActiveView(v);
