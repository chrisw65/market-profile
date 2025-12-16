import { SlugSearchForm } from "@/components/slug-search";
import Link from "next/link";
import { SavedCommunities } from "@/components/saved-communities";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm uppercase tracking-wide text-pink-500">
          Skool Profiler
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-900">
          Live community dossier builder
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          Drop in any Skool slug to instantly generate the brand profile,
          classroom breakdown, latest posts, and ad-ready insights.
        </p>
        <SlugSearchForm />
        <p className="mt-6 text-sm text-zinc-500">
          Need an example?{" "}
          <Link
            href="/profiles/the-creators-hub-9795"
            className="font-medium text-pink-500 hover:underline"
          >
            View The Creator&apos;s Hub
          </Link>{" "}
          or{" "}
          <Link
            href="/profiles/ai-operator-academy"
            className="font-medium text-pink-500 hover:underline"
          >
            AI Operator Academy
          </Link>
        </p>
        <SavedCommunities />
        <p className="mt-4 text-xs text-zinc-500">
          Need a dedicated admin account?{" "}
          <Link href="/signup" className="font-semibold text-pink-500 hover:underline">
            Create one with email + password
          </Link>{" "}
          and then use the password sign-in option in the header.
        </p>
      </div>
    </div>
  );
}
