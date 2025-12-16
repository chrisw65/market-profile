import { ProfilePageClient } from "@/components/profile-page-client";
import { notFound } from "next/navigation";
import { normalizeSlug } from "@/lib/skool/utils";

/**
 * Profile page - now uses client-side data loading
 * Benefits:
 * - Loads cached data instantly from database
 * - Manual "Scrape Now" button for fresh data
 * - No more 30-60 second waits on every page load
 * - Graceful error handling with retry options
 */
export default async function ProfilePage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const slugParam = resolved?.slug;

  if (!slugParam) {
    notFound();
  }

  const slug = normalizeSlug(slugParam);
  if (!slug) {
    notFound();
  }

  return <ProfilePageClient slug={slug} />;
}
