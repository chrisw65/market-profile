import { ProfilePageClient } from "@/components/profile-page-client";
import { notFound, redirect } from "next/navigation";
import { normalizeSlug } from "@/lib/skool/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[profiles/page] auth check failed", error);
  }

  if (!user) {
    redirect("/");
  }

  return <ProfilePageClient slug={slug} />;
}
