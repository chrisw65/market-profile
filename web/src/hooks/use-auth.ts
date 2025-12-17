"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Hook for managing authentication state
 * Listens to auth changes and provides current user
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'admin' | 'user' | 'guest'>('guest');

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      setUser(payload.user ?? null);
      setIsAdmin(payload.isAdmin ?? false);
      setRole(payload.role ?? 'guest');
    } catch (err) {
      console.error("[useAuth] session fetch failed", err);
      setUser(null);
      setIsAdmin(false);
      setRole('guest');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSession();

    const { data: listener } = supabaseBrowserClient.auth.onAuthStateChange(() => {
      if (!mounted) return;
      fetchSession();
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [fetchSession]);

  return {
    user,
    loading,
    authenticated: Boolean(user),
    userId: user?.id ?? null,
    isAdmin,
    role,
  };
}
