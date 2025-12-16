"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    if (password !== confirm) {
      setError("Passwords must match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to create account.");
      } else {
        setStatus("Account created. Use the header sign-in form with your password.");
        setEmail("");
        setPassword("");
        setConfirm("");
        setName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-24">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-pink-400">
            Admin onboarding
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            Create your admin user
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            This creates a Supabase account plus the supporting workspace so you
            can log in with email and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Full name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className="mt-1 w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
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
              className="mt-1 w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-400 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create admin account"}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500">
          {status && <p className="text-emerald-400">{status}</p>}
          {error && <p className="text-pink-400">{error}</p>}
          <p className="mt-3">
            Already have credentials?{" "}
            <Link href="/" className="font-semibold text-pink-400 hover:text-pink-200">
              sign in with your password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
