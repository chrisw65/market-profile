"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { authenticated, isAdmin, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && authenticated) {
      if (isAdmin) {
        router.push("/admin/users");
      } else {
        router.push("/dashboard");
      }
    }
  }, [authenticated, isAdmin, authLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Unable to sign in.");
      } else {
        // Success - page will reload and redirect via useEffect
        window.location.href = isAdmin ? "/admin/users" : "/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-24">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-pink-400">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your credentials to access your community profiles and campaigns.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-400 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500">
          {error && <p className="mb-3 text-pink-400">{error}</p>}
          <p>
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-pink-400 hover:text-pink-200">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
