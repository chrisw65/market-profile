import Link from "next/link";

const getOrigin = () =>
  process.env.NEXT_PUBLIC_APP_ORIGIN ??
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_URL ??
  "http://localhost:3000";

type SavedCommunityEntry = {
  id: string;
  slug: string;
  created_at?: string;
};

export async function SavedCommunities() {
  const response = await fetch(`${getOrigin()}/api/communities`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ data: [] }));
  const entries: SavedCommunityEntry[] = payload.data ?? [];
  if (!entries.length) return null;

  return (
    <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Saved communities
      </h2>
      <ul className="mt-4 space-y-3 text-sm text-zinc-700">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">{entry.slug}</p>
              <p className="text-xs text-zinc-500">
                Saved{" "}
                {entry.created_at
                  ? new Date(entry.created_at).toLocaleDateString()
                  : ""}
              </p>
            </div>
            <Link
              href={`/profiles/${entry.slug}`}
              className="text-xs font-semibold text-pink-500 hover:underline"
            >
              View
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
