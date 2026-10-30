import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { getAuthoritativeProfileRoleServerFn } from "./server-auth";

export interface AuthUser {
  id?: string | undefined;
  role: "student" | "admin";
  name?: string | undefined;
  fullName?: string | undefined;
  college?: string | undefined;
  branch?: string | undefined;
  mobile?: string | undefined;
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
    // 1. Authoritative server check: verify role directly from database
    const syncAuthoritativeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          const stored = getStoredUser();
          if (stored) {
            setUser(stored);
          } else {
            setUser(null);
          }

          setLoading(false);
          return;
        }

        // Authoritative server-side profile check
        const res = await getAuthoritativeProfileRoleServerFn({
          data: { userId: session.user.id },
        });

        if (!res?.role) {
          const stored = getStoredUser();
          if (stored) {
            setUser(stored);
          } else {
            logoutUser();
            setUser(null);
          }

          setLoading(false);
          return;
        }

        const cleanDisplayName =
          res.fullName && !res.fullName.toLowerCase().startsWith("cnf") && !res.fullName.includes("XXX")
            ? res.fullName
            : (session.user.user_metadata?.["full_name"] || session.user.email?.split("@")[0]);

        const authUser: AuthUser = {
          id: session.user.id,
          role: res.role,
          email: session.user.email ?? undefined,
          name: cleanDisplayName,
          fullName: res.fullName || cleanDisplayName,
          college: res.college ?? undefined,
          branch: res.branch ?? undefined,
          mobile: res.mobile ?? undefined,
          teamCode: res.teamCode ?? undefined,
        };

        loginUser(authUser);
        setUser(authUser);
      } catch (err) {
        console.warn("syncAuthoritativeSession fallback to stored user:", err);
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
        } else {
          setUser(null);
        }

      } finally {
        setLoading(false);
      }
    };

    syncAuthoritativeSession();

    // 2. Listen to Supabase auth events & verify role with authoritative server check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const res = await getAuthoritativeProfileRoleServerFn({
            data: { userId: session.user.id },
          });

          if (!res?.role) {
            const stored = getStoredUser();
            if (stored) {
              setUser(stored);
            } else {
              logoutUser();
              setUser(null);
            }
            return;
          }

          const cleanDisplayName =
            res.fullName && !res.fullName.toLowerCase().startsWith("cnf") && !res.fullName.includes("XXX")
              ? res.fullName
              : (session.user.user_metadata?.["full_name"] || session.user.email?.split("@")[0]);

          const authUser: AuthUser = {
            id: session.user.id,
            role: res.role,
            email: session.user.email ?? undefined,
            name: cleanDisplayName,
            fullName: res.fullName || cleanDisplayName,
            college: res.college ?? undefined,
            branch: res.branch ?? undefined,
            mobile: res.mobile ?? undefined,
            teamCode: res.teamCode ?? undefined,
          };

          loginUser(authUser);
          setUser(authUser);
        } catch {
          const stored = getStoredUser();
          if (stored) {
            setUser(stored);
          } else {
            setUser(null);
          }
        }
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
    isAdmin: user?.role === "admin",
    login: loginUser,
    logout: logoutUser,
  };
}
