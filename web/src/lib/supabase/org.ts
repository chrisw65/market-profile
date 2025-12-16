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
