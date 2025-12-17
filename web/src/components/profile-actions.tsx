"use client";

import { useState } from "react";
import { normalizeSlug } from "@/lib/skool/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { MarkdownRenderer } from "./markdown-renderer";
import { CampaignList } from "./campaign-list";

/**
 * Main profile actions component
 * Handles campaign generation, saving, and management
 */
export function ProfileActions({ slug }: { slug: string }) {
  const normalizedSlug = normalizeSlug(slug) || slug;
  const [ideas, setIdeas] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { loading: authLoading, authenticated, userId } = useAuth();

  const {
    campaigns,
    loading: campaignsLoading,
    statusMessage,
    highlightedId,
    fetchCampaigns,
    saveCampaign,
    deleteCampaign,
    highlightCampaign,
  } = useCampaigns({
    slug: normalizedSlug,
    userId,
    autoFetch: !authLoading,
  });

  const sessionBanner =
    !authLoading && !authenticated ? "Please log in via the top bar to save campaigns." : null;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    setIdeas(null);

    try {
      const response = await fetch(`/api/campaign/${encodeURIComponent(normalizedSlug)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate campaign ideas.");
      }

      setIdeas(data.ideas ?? "");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const url = `/api/profiles/${encodeURIComponent(normalizedSlug)}`;
    window.open(url, "_blank");
  };

  const handleSave = async () => {
    if (!authenticated) {
      return;
    }

    if (!ideas) {
      return;
    }

    await saveCampaign(ideas);
  };

  const handleLoadCampaign = (campaign: { ideas?: string; id: string }) => {
    setIdeas(campaign.ideas ?? "");
    highlightCampaign(campaign.id);
  };

  return (
    <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
      {/* Main actions section */}
      <section className="space-y-4">
        <header className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Actions</h3>

          {/* Status messages */}
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

          {/* Auth banner */}
          {sessionBanner && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-medium text-amber-700">
              {sessionBanner}
            </p>
          )}
        </header>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownload}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Download JSON
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex w-full items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-pink-400 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate AI Campaign Ideas"}
          </button>

          <button
            onClick={handleSave}
            disabled={campaignsLoading || !authenticated || !ideas}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            {campaignsLoading ? "Saving..." : "Save campaign"}
          </button>
        </div>

        {/* Generate error */}
        {generateError && (
          <p className="text-sm text-pink-600" aria-live="assertive">
            {generateError}
          </p>
        )}

        {/* Generated ideas */}
        {ideas && (
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
            <MarkdownRenderer content={ideas} />
          </div>
        )}
      </section>

      {/* Saved campaigns section */}
      <CampaignList
        campaigns={campaigns}
        loading={campaignsLoading}
        authenticated={authenticated}
        authLoading={authLoading}
        highlightedId={highlightedId}
        onLoad={handleLoadCampaign}
        onDelete={deleteCampaign}
        onRefresh={fetchCampaigns}
      />
    </div>
  );
}
