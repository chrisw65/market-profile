"use client";

import { useCallback, useEffect, useState } from "react";

export type SavedCampaign = {
  id: string;
  title?: string;
  ideas?: string;
  notes?: string;
  slug?: string;
  created_at?: string;
};

type StatusMessage = {
  type: "success" | "warning" | "error";
  text: string;
};

interface UseCampaignsOptions {
  slug: string;
  userId: string | null;
  autoFetch?: boolean;
}

/**
 * Hook for managing campaign operations
 * Handles CRUD operations for saved campaigns
 */
export function useCampaigns({ slug, userId, autoFetch = true }: UseCampaignsOptions) {
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!userId) {
      setCampaigns([]);
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/campaigns?slug=${encodeURIComponent(slug)}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Unable to load saved campaigns.");
      }

      setCampaigns(payload.data.entries ?? []);

      if (payload.warning) {
        setStatusMessage({ type: "warning", text: payload.warning });
      }
    } catch (err) {
      console.error("Saved campaigns fetch error", err);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load saved campaigns.",
      });
    } finally {
      setLoading(false);
    }
  }, [slug, userId]);

  const saveCampaign = useCallback(
    async (ideas: string, title?: string) => {
      if (!userId) {
        setStatusMessage({ type: "error", text: "You must be logged in to save." });
        return null;
      }

      setLoading(true);
      setStatusMessage(null);

      try {
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            title: title || `Campaign ${new Date().toLocaleString()}`,
            ideas,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error || "Failed to save campaign.");
        }

        const saved = payload.data.campaign;
        setCampaigns((previous) => [
          saved,
          ...previous.filter((entry) => entry.id !== saved.id),
        ]);
        setHighlightedId(saved.id);
        setStatusMessage({ type: "success", text: "Campaign saved to workspace." });

        return saved;
      } catch (err) {
        console.error("Save error", err);
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Unable to save campaign.",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [slug, userId]
  );

  const deleteCampaign = useCallback(
    async (id: string) => {
      setLoading(true);
      setStatusMessage(null);

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

        setCampaigns((prev) => prev.filter((entry) => entry.id !== id));

        if (highlightedId === id) {
          setHighlightedId(null);
        }

        setStatusMessage({ type: "success", text: "Campaign removed." });
      } catch (err) {
        console.error("Delete error", err);
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Could not delete campaign.",
        });
      } finally {
        setLoading(false);
      }
    },
    [highlightedId]
  );

  const highlightCampaign = useCallback((id: string) => {
    setHighlightedId(id);
  }, []);

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
  }, []);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchCampaigns();
    }
  }, [autoFetch, userId, fetchCampaigns]);

  return {
    campaigns,
    loading,
    statusMessage,
    highlightedId,
    fetchCampaigns,
    saveCampaign,
    deleteCampaign,
    highlightCampaign,
    clearStatus,
  };
}
