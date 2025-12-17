'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SavedCommunity = {
  id: string;
  name: string;
  slug: string;
};

const STORAGE_KEY = "skool:saved-communities";

function readSavedCommunities(): SavedCommunity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function slugFromInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      return url.pathname.replace(/^\/+/, "").replace(/\/+$/, "") || null;
    } catch {
      // fall through
    }
  }
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "") || null;
}

export function SlugSearchForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedCommunities, setSavedCommunities] = useState<SavedCommunity[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const entries = readSavedCommunities();
    const timer = window.setTimeout(() => {
      if (entries.length) {
        setSavedCommunities(entries);
        setSelectedSaved(entries[0].id);
        setSlug(entries[0].slug);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCommunities));
  }, [savedCommunities, hydrated]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = slugFromInput(slug);
    if (!cleaned) {
      setError("Enter a valid Skool slug or URL.");
      return;
    }
    setError(null);
    router.push(`/profiles/${encodeURIComponent(cleaned)}`);
  };

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    setSelectedSaved(id);
    const match = savedCommunities.find((item) => item.id === id);
    if (match) {
      setSlug(match.slug);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = slugFromInput(newUrl);
    if (!cleaned || !newName.trim()) {
      setError("Provide a name and valid Skool URL or slug.");
      return;
    }
    const entry: SavedCommunity = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      slug: cleaned,
    };
    setSavedCommunities((prev) => [...prev, entry]);
    setNewName("");
    setNewUrl("");
    setSelectedSaved(entry.id);
    setSlug(entry.slug);
    setShowSaveForm(false);
    setError(null);
  };

  return (
    <div className="mt-6 space-y-6 text-left">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="community-select" className="text-sm font-medium text-zinc-700">
          Select a saved community
        </label>
        <select
          id="community-select"
          value={selectedSaved}
          onChange={handleSelect}
          disabled={!hydrated}
          className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:cursor-not-allowed"
        >
          <option value="">{hydrated ? "None" : "Loading saved communities..."}</option>
          {hydrated &&
            savedCommunities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
        </select>

        <label htmlFor="slug-input" className="text-sm font-medium text-zinc-700">
          Skool slug or URL
        </label>
        <input
          id="slug-input"
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="https://www.skool.com/the-creators-hub-9795"
          className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        {error && <p className="text-sm text-pink-600">{error}</p>}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-pink-400"
        >
          Create Profile
        </button>
      </form>

      <div className="rounded-2xl border border-dashed border-zinc-200 p-4">
        <button
          type="button"
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="text-sm font-medium text-pink-500 hover:underline"
        >
          {showSaveForm ? "Close saved communities" : "Save a community shortcut"}
        </button>
        {showSaveForm && (
          <form onSubmit={handleSave} className="mt-4 space-y-3 text-left">
            <div>
              <label className="text-sm font-medium text-zinc-700" htmlFor="community-name">
                Community label
              </label>
              <input
                id="community-name"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="AI Operator Academy"
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700" htmlFor="community-url">
                Skool URL or slug
              </label>
              <input
                id="community-url"
                type="text"
                value={newUrl}
                onChange={(event) => setNewUrl(event.target.value)}
                placeholder="https://www.skool.com/ai-operator-academy"
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800"
            >
              Save community
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
