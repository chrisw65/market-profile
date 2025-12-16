import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensurePersonalOrganization, listSavedCommunities } from "@/lib/supabase/org";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Unable to verify user:", error);
  }

  const savedCommunities = await listSavedCommunities();
  let organizationId: string | null = null;

  if (user) {
    try {
      organizationId = await ensurePersonalOrganization(user.id, user.email ?? undefined);
    } catch (err) {
      console.error("Failed to ensure personal organization:", err);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 px-6">
        <div className="max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950/80 p-10 text-center shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-400">
            Auth required
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">You need to sign in first</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Head back to the home page and use the magic-link widget in the top bar to
            authenticate.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-zinc-700 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:border-pink-400 hover:text-pink-300"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Admin console</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Workspace overview</h1>
          <p className="mt-3 text-sm text-zinc-600">
            Signed in as <span className="font-medium text-zinc-900">{user.email}</span>. Organization
            ID <span className="font-semibold text-pink-500">{organizationId}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link
              href="/"
              className="rounded-full border border-zinc-200 px-4 py-2 font-semibold text-zinc-900 hover:border-pink-400 hover:text-pink-500"
            >
              Browse profiles
            </Link>
            <a
              href="/"
              className="rounded-full border border-transparent bg-pink-500 px-4 py-2 font-semibold text-white shadow-sm hover:bg-pink-400"
            >
              Request new profile
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400">Saved communities</p>
              <h2 className="text-2xl font-semibold text-zinc-900">
                {savedCommunities.length} Communities
              </h2>
            </div>
          </div>
          {savedCommunities.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              You don&apos;t have any saved Skool communities yet. Use the search form on the
              homepage to build one, or enter a slug directly below.
            </p>
          ) : (
            <div className="mt-6 divide-y divide-zinc-100">
              {savedCommunities.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">{entry.slug}</p>
                    <p className="text-xs text-zinc-500">
                      Saved{" "}
                      {entry.inserted_at ? new Date(entry.inserted_at).toLocaleString() : ""}
                    </p>
                  </div>
                  <Link
                    href={`/profiles/${entry.slug}`}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-pink-500 hover:bg-pink-50"
                  >
                    View profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
