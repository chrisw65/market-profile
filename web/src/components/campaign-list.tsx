"use client";

import type { SavedCampaign } from "@/hooks/use-campaigns";

interface CampaignListProps {
  campaigns: SavedCampaign[];
  loading: boolean;
  authenticated: boolean;
  authLoading: boolean;
  highlightedId: string | null;
  onLoad: (campaign: SavedCampaign) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

/**
 * Displays a list of saved campaigns with load and delete actions
 */
export function CampaignList({
  campaigns,
  loading,
  authenticated,
  authLoading,
  highlightedId,
  onLoad,
  onDelete,
  onRefresh,
}: CampaignListProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-zinc-700">Saved campaigns</p>
        {loading ? (
          <span className="text-[11px] text-zinc-400">Loading…</span>
        ) : (
          <button
            onClick={onRefresh}
            className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
          >
            Refresh
          </button>
        )}
      </div>

      {!authenticated && !authLoading ? (
        <p className="text-xs text-zinc-500">Sign in to save and manage campaigns.</p>
      ) : loading ? (
        <p className="text-xs text-zinc-500">Loading saved campaigns…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-xs text-zinc-500">No saved campaigns yet for this profile.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              highlighted={highlightedId === campaign.id}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface CampaignCardProps {
  campaign: SavedCampaign;
  highlighted: boolean;
  onLoad: (campaign: SavedCampaign) => void;
  onDelete: (id: string) => void;
}

function CampaignCard({ campaign, highlighted, onLoad, onDelete }: CampaignCardProps) {
  return (
    <div
      className={`space-y-2 rounded-xl border px-3 py-2 ${
        highlighted ? "border-pink-400 bg-pink-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-zinc-900">{campaign.title ?? "Campaign"}</p>
          <p className="text-[11px] text-zinc-500">
            {campaign.created_at
              ? new Date(campaign.created_at).toLocaleString()
              : "Unknown date"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onLoad(campaign)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:border-zinc-500"
          >
            Load plan
          </button>
          <button
            onClick={() => onDelete(campaign.id)}
            className="rounded-full border border-transparent bg-pink-100 px-3 py-1 text-[11px] font-semibold text-pink-600 hover:bg-pink-200"
          >
            Delete
          </button>
        </div>
      </div>
      {campaign.ideas && (
        <p className="line-clamp-3 text-[11px] text-zinc-500">{campaign.ideas}</p>
      )}
    </div>
  );
}
