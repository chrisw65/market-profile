'use client';

import { useEffect, useState } from "react";
import { normalizeSlug } from "@/lib/skool/utils";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

type SavedCampaign = {
  id: string;
  title?: string;
  ideas?: string;
  created_at?: string;
};

export function ProfileActions({ slug }: { slug: string }) {
  const normalizedSlug = normalizeSlug(slug) || slug;
  const [ideas, setIdeas] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchSavedCampaigns = async () => {
    if (!session?.user) {
      setSavedCampaigns([]);
      return;
    }
    setSavedLoading(true);
    try {
      const response = await fetch(`/api/campaigns?slug=${encodeURIComponent(normalizedSlug)}`);
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSavedCampaigns(data.entries ?? []);
      } else {
        console.warn("Failed to fetch saved campaigns", data?.error, response.status);
      }
    } catch (error) {
      console.error("Saved campaigns fetch error", error);
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setAuthLoading(true);
    supabaseBrowserClient.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!mounted) return;
        setSession(currentSession);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setAuthLoading(false);
      });

    const { data: listener } = supabaseBrowserClient.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchSavedCampaigns();
  }, [normalizedSlug, session?.user?.id]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setIdeas(null);
    try {
      const response = await fetch(`/api/campaign/${encodeURIComponent(normalizedSlug)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate campaign ideas.");
      }
      setIdeas(data.ideas);
      if (data?.warning) {
        setError(data.warning);
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
    setSaving(true);
    setSaveStatus(null);
    setError(null);
    if (!session?.user) {
      setError("Log in to save campaigns.");
      setSaving(false);
      return;
    }
    try {
      if (!ideas) {
        throw new Error("Generate ideas before saving.");
      }
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: normalizedSlug,
          title: `Campaign ${new Date().toLocaleString()}`,
          ideas,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save campaign.");
      }
      setSaveStatus("Saved to workspace.");
      fetchSavedCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Actions
      </h3>
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
          disabled={saving || !session?.user}
          className="inline-flex w-full items-center justify-center rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save campaign"}
        </button>
      </div>
      {saveStatus && <p className="text-sm text-emerald-600">{saveStatus}</p>}
      {error && <p className="text-sm text-pink-600">{error}</p>}
  {ideas && (
    <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
      {renderMarkdown(ideas)}
    </div>
  )}
      <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-700">Saved campaigns</p>
        {authLoading ? (
          <p>Checking authentication…</p>
        ) : session?.user ? (
          savedLoading ? (
            <p>Loading…</p>
          ) : savedCampaigns.length === 0 ? (
            <p>No saved campaigns yet for this community.</p>
          ) : (
            <div className="space-y-3 mt-3">
              {savedCampaigns.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">
                    {entry.title ?? "Campaign"}
                  </p>
                  {entry.ideas && (
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {entry.ideas.slice(0, 140)}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-zinc-400">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-xs text-zinc-500">
            Save campaigns requires authentication—use the login panel in the top bar.
          </p>
        )}
      </div>
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
