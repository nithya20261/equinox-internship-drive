import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export interface AuthUser {
  id?: string | undefined;
  role: "student" | "company";
  name?: string | undefined;
  teamCode?: string | undefined;
  email?: string | undefined;
}

const AUTH_STORAGE_KEY = "equinox_auth_user";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isUserLoggedIn(): boolean {
  return getStoredUser() !== null;
}

export function loginUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("equinox-auth-change"));
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("equinox-auth-change"));
  supabase.auth.signOut().catch(() => {});
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sync with existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        const role = (metadata?.["role"] as "student" | "company") || "student";
        const authUser: AuthUser = {
          id: session.user.id,
          role,
          name: (metadata?.["full_name"] as string | undefined) || session.user.email?.split("@")[0],
          teamCode: metadata?.["team_code"] as string | undefined,
          email: session.user.email ?? undefined,
        };
        loginUser(authUser);
        setUser(authUser);
      }
      setLoading(false);
    });

    // 2. Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const metadata = session.user.user_metadata;
        const role = (metadata?.["role"] as "student" | "company") || "student";
        const authUser: AuthUser = {
          id: session.user.id,
          role,
          name: (metadata?.["full_name"] as string | undefined) || session.user.email?.split("@")[0],
          teamCode: metadata?.["team_code"] as string | undefined,
          email: session.user.email ?? undefined,
        };
        loginUser(authUser);
        setUser(authUser);
      } else if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          window.dispatchEvent(new Event("equinox-auth-change"));
        }
        setUser(null);
      }
    });

    const handleAuthChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("equinox-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("equinox-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return {
    user,
    loading,
    isLoggedIn: user !== null,
    isStudent: user?.role === "student",
    isCompany: user?.role === "company",
    login: loginUser,
    logout: logoutUser,
  };
}

