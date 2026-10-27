import { useState, useEffect } from "react";

export interface AuthUser {
  role: "student" | "company";
  name?: string;
  teamCode?: string;
  email?: string;
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
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("equinox-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("equinox-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return {
    user,
    isLoggedIn: user !== null,
    isStudent: user?.role === "student",
    isCompany: user?.role === "company",
    login: loginUser,
    logout: logoutUser,
  };
}
