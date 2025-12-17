"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CommunityProfile {
  id: string;
  slug: string;
  profile: {
    community?: {
      name?: string;
      members?: number;
      posts?: number;
    };
  };
  updated_at: string;
  created_at: string;
}

export function DashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSlug, setSearchSlug] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/communities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch profiles");
      }
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSlug.trim()) {
      router.push(`/profiles/${searchSlug.trim()}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Your Dashboard
          </h1>
          <p className="mt-2 text-zinc-600">
            Manage and analyze Skool community profiles
          </p>
        </div>

        {/* Search/Analyze Form */}
        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Analyze New Community
          </h2>
          <form onSubmit={handleAnalyze} className="flex gap-3">
            <input
              type="text"
              value={searchSlug}
              onChange={(e) => setSearchSlug(e.target.value)}
              placeholder="Enter Skool community slug (e.g., ai-operator-academy)"
              className="flex-1 rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-pink-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
            >
              Analyze
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Try:{" "}
            <button
              onClick={() => setSearchSlug("the-creators-hub-9795")}
              className="font-medium text-pink-500 hover:underline"
            >
              the-creators-hub-9795
            </button>
            {" or "}
            <button
              onClick={() => setSearchSlug("ai-operator-academy")}
              className="font-medium text-pink-500 hover:underline"
            >
              ai-operator-academy
            </button>
          </p>
        </div>

        {/* Profiles List */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Your Saved Profiles
            </h2>
            <button
              onClick={fetchProfiles}
              className="text-sm text-pink-500 hover:text-pink-400"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-pink-50 p-4 text-sm text-pink-600">
              {error}
            </div>
          )}

          {profiles.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">🔍</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                No communities analyzed yet
              </h3>
              <p className="text-sm text-zinc-600">
                Start by analyzing your first Skool community using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => {
                const name = profile.profile?.community?.name || profile.slug;
                const members = profile.profile?.community?.members || 0;
                const posts = profile.profile?.community?.posts || 0;
                const lastUpdated = new Date(profile.updated_at).toLocaleDateString();

                return (
                  <Link
                    key={profile.id}
                    href={`/profiles/${profile.slug}`}
                    className="block rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition-all hover:border-pink-300 hover:bg-pink-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900">{name}</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          slug: {profile.slug}
                        </p>
                        <div className="mt-2 flex gap-4 text-xs text-zinc-600">
                          <span>👥 {members.toLocaleString()} members</span>
                          <span>💬 {posts.toLocaleString()} posts</span>
                          <span>📅 Updated {lastUpdated}</span>
                        </div>
                      </div>
                      <div className="text-pink-500">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          strokeWidth="2"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
