import Link from "next/link";
import { listSavedCommunities } from "@/lib/supabase/org";

export async function SavedCommunities() {
  const entries = await listSavedCommunities();
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
                Saved {entry.inserted_at ? new Date(entry.inserted_at).toLocaleDateString() : ""}
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
