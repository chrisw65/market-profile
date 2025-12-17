"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabase/client";

export function AppHeader() {
  const { user, isAdmin, authenticated, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
      <Link href={authenticated ? "/dashboard" : "/"} className="text-sm font-semibold text-zinc-900">
        Skool Profiler
      </Link>

      {loading ? (
        <div className="text-xs text-zinc-400">Loading...</div>
      ) : authenticated && user ? (
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-700 hover:text-pink-500"
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin/users"
                className="text-sm font-medium text-zinc-700 hover:text-pink-500"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
            <div className="text-xs text-zinc-600">
              {user.email}
              {isAdmin && (
                <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                  ADMIN
                </span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-700 hover:text-pink-500"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-pink-400"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
}
