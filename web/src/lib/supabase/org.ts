import { createSupabaseServerClient } from "./server";
import { createSupabaseServiceClient } from "./service";

export async function ensurePersonalOrganization(userId: string, email?: string) {
  const supabase = createSupabaseServiceClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership?.organization_id) {
    return membership.organization_id;
  }

  const orgName = email ? `${email.split("@")[0]}'s Workspace` : "Personal Workspace";
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, creator: userId })
    .select("id")
    .single();

  if (orgError) {
    console.error("[ensurePersonalOrganization] failed to insert org", orgError);
    throw orgError;
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    console.error("[ensurePersonalOrganization] failed to insert member", memberError);
    throw memberError;
  }

  return org.id;
}

export async function listSavedCommunities() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data } = await supabase
    .from("community_profiles")
    .select("id, slug, inserted_at:created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
