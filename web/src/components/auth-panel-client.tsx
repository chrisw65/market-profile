"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowserClient } from "@/lib/supabase/client";

type SignInMode = "magic" | "password";

export function AuthPanelClient({ user }: { user: User | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<SignInMode>("magic");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    if (mode === "password" && !password) {
      setError("Password is required.");
      return;
    }
    try {
      setLoading(true);
      if (mode === "magic") {
        const { error } = await supabaseBrowserClient.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          throw error;
        }
        setStatus("Check your email for the sign-in link.");
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "Unable to sign in.");
        }

        setStatus("Signed in with password.");
        setPassword("");
      }
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "magic"
          ? "Unable to send magic link."
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
    window.location.reload();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-600">
          <p className="font-semibold text-zinc-900">{user.email}</p>
          <p>Signed in</p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-[180px] flex-1 rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-900 focus:border-pink-500 focus:outline-none"
          required
        />
        {mode === "password" && (
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="your password"
            className="min-w-[140px] flex-1 rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-900 focus:border-pink-500 focus:outline-none"
            required
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Working..." : mode === "magic" ? "Send magic link" : "Sign in"}
        </button>
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            mode === "magic" ? "text-pink-500" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          magic link
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            mode === "password" ? "text-pink-500" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          password
        </button>
      </div>
      {(status || error) && (
        <p
          className={`text-xs ${error ? "text-pink-600" : "text-emerald-600"}`}
        >
          {error ?? status}
        </p>
      )}
    </form>
  );
}
