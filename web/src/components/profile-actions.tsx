'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeSlug } from "@/lib/skool/utils";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type SavedCampaign = {
  id: string;
  title?: string;
  ideas?: string;
  notes?: string;
  created_at?: string;
};

type StatusMessage = { type: "success" | "warning" | "error"; text: string };

export function ProfileActions({ slug }: { slug: string }) {
  const normalizedSlug = normalizeSlug(slug) || slug;
  const [ideas, setIdeas] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const authenticated = Boolean(user);
  const sessionBanner = useMemo(
    () =>
      !authLoading && !authenticated
        ? "Please log in via the top bar to save campaigns."
        : null,
    [authLoading, authenticated]
  );

  const setStatus = (status: StatusMessage | null) => setStatusMessage(status);

  const sessionUserId = user?.id ?? null;

  const fetchSavedCampaigns = useCallback(async () => {
    if (!sessionUserId) {
      setSavedCampaigns([]);
      return;
    }
    setSavedLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/campaigns?slug=${encodeURIComponent(normalizedSlug)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Unable to load saved campaigns.");
      }
      setSavedCampaigns(payload.data.entries ?? []);
      if (payload.warning) {
        setStatus({ type: "warning", text: payload.warning });
      }
    } catch (err) {
      console.error("Saved campaigns fetch error", err);
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Failed to load saved campaigns." });
    } finally {
      setSavedLoading(false);
    }
  }, [normalizedSlug, sessionUserId]);

  const fetchSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      setUser(payload.user ?? null);
    } catch (err) {
      console.error("[ProfileActions] session fetch failed", err);
      setUser(null);
    } finally {
      setAuthLoading(false);
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

  useEffect(() => {
    if (!authLoading) {
      fetchSavedCampaigns();
    }
  }, [authLoading, fetchSavedCampaigns]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setIdeas(null);
    setStatus(null);
    try {
      const response = await fetch(`/api/campaign/${encodeURIComponent(normalizedSlug)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate campaign ideas.");
      }
      setIdeas(data.ideas ?? "");
      if (data?.warning) {
        setStatus({ type: "warning", text: data.warning });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const url = `/api/profiles/${encodeURIComponent(normalizedSlug)}`;
    window.open(url, "_blank");
  };

  const handleSave = async () => {
    if (!authenticated) {
      setStatus({ type: "error", text: "You must be logged in to save." });
      return;
    }
    if (!ideas) {
      setStatus({ type: "error", text: "Generate ideas before saving." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: normalizedSlug,
          title: `Campaign ${new Date().toLocaleString()}`,
          ideas,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Failed to save campaign.");
      }
      const saved = payload.data.campaign;
      setSavedCampaigns((previous) => [saved, ...previous.filter((entry) => entry.id !== saved.id)]);
      setHighlightedId(saved.id);
      setStatus({ type: "success", text: "Campaign saved to workspace." });
    } catch (err) {
      console.error("Save error", err);
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to save campaign." });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadCampaign = (campaign: SavedCampaign) => {
    setIdeas(campaign.ideas ?? "");
    setHighlightedId(campaign.id);
    setStatus({ type: "success", text: "Plan loaded to the generator." });
  };

  const handleDeleteCampaign = async (id: string) => {
    setSavedLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Failed to delete campaign.");
      }
      setSavedCampaigns((prev) => prev.filter((entry) => entry.id !== id));
      if (highlightedId === id) {
        setIdeas(null);
        setHighlightedId(null);
      }
      setStatus({ type: "success", text: "Campaign removed." });
    } catch (err) {
      console.error("Delete error", err);
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Could not delete campaign." });
    } finally {
      setSavedLoading(false);
    }
  };

  return (
    <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
      <section className="space-y-4">
        <header className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Actions
          </h3>
          {statusMessage && (
            <p
              className={`text-xs font-medium ${
                statusMessage.type === "error"
                  ? "text-pink-600"
                  : statusMessage.type === "warning"
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {statusMessage.text}
            </p>
          )}
          {sessionBanner && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-medium text-amber-700">
              {sessionBanner}
            </p>
          )}
        </header>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownload}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Download JSON
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-pink-400 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate AI Campaign Ideas"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !authenticated}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save campaign"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-pink-600" aria-live="assertive">
            {error}
          </p>
        )}
        {ideas && (
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
            {renderMarkdown(ideas)}
          </div>
        )}
      </section>
      <section className="space-y-3 rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-zinc-700">Saved campaigns</p>
          {savedLoading ? (
            <span className="text-[11px] text-zinc-400">Loading…</span>
          ) : (
            <button
              onClick={fetchSavedCampaigns}
              className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
            >
              Refresh
            </button>
          )}
        </div>
        {!authenticated && !authLoading ? (
          <p className="text-xs text-zinc-500">
            Sign in to save and manage campaigns.
          </p>
        ) : savedLoading ? (
          <p className="text-xs text-zinc-500">Loading saved campaigns…</p>
        ) : savedCampaigns.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No saved campaigns yet for this profile.
          </p>
        ) : (
          <div className="space-y-3">
            {savedCampaigns.map((entry) => (
              <div
                key={entry.id}
                className={`space-y-2 rounded-xl border px-3 py-2 ${
                  highlightedId === entry.id
                    ? "border-pink-400 bg-pink-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {entry.title ?? "Campaign"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : "Unknown date"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadCampaign(entry)}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:border-zinc-500"
                    >
                      Load plan
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(entry.id)}
                      className="rounded-full border border-transparent bg-pink-100 px-3 py-1 text-[11px] font-semibold text-pink-600 hover:bg-pink-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {entry.ideas && (
                  <p className="text-[11px] text-zinc-500 line-clamp-3">
                    {entry.ideas}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let tableBuffer: string[][] = [];
  let tableHeaders: string[] | null = null;

  const flushList = () => {
    if (listBuffer.length) {
      nodes.push(
        <ul key={`list-${nodes.length}`} className="list-disc space-y-1 pl-5">
          {listBuffer.map((item, index) => (
            <li key={`list-${index}`}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length) {
      nodes.push(
        <div key={`table-${nodes.length}`} className="max-w-full overflow-x-auto">
          <table className="w-full text-sm text-zinc-700">
            {tableHeaders && (
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  {tableHeaders.map((Cell, idx) => (
                    <th key={`header-${idx}`} className="border-b px-3 py-2 text-left">
                      {parseInline(Cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableBuffer.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-b last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} className="px-3 py-2">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      tableHeaders = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      flushTable();
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="mt-4 text-xl font-semibold text-zinc-900">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      flushTable();
      nodes.push(
        <h3 key={`h3-${nodes.length}`} className="mt-3 text-lg font-semibold text-zinc-900">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushTable();
      listBuffer.push(trimmed.slice(2).trim());
      continue;
    }

    if (trimmed.startsWith("|")) {
      const rowCells = trimmed
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const isDelimiter = rowCells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, "")));
      if (isDelimiter) {
        continue;
      }
      if (!tableHeaders) {
        tableHeaders = rowCells;
        continue;
      }
      tableBuffer.push(rowCells);
      continue;
    }

    flushList();
    flushTable();
    nodes.push(
      <p key={`p-${nodes.length}`} className="mt-2 text-sm text-zinc-700">
        {parseInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return nodes;
};

const parseInline = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  const inlineRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text))) {
    const [token] = match;
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const content = token.slice(token.startsWith("**") || token.startsWith("__") ? 2 : 1, token.length - (token.endsWith("**") || token.endsWith("__") ? 2 : 1));
    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={`bold-${match.index}`}>{parseInline(content)}</strong>
      );
    } else {
      nodes.push(
        <em key={`italic-${match.index}`}>{parseInline(content)}</em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};
